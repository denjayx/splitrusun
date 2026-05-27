import React, { useState, useEffect } from 'react';
import { DEFAULT_MEMBERS, DEFAULT_RATES, DEFAULT_DEVICES } from './data/defaults';
import { calculateSplits } from './utils/splitEngine';
import { formatIDR } from './utils/formatCurrency';
import BillForm from './components/BillForm';
import ElectricityBreakdown from './components/ElectricityBreakdown';
import SplitSummary from './components/SplitSummary';
import WhatsAppShare from './components/WhatsAppShare';
import './App.css';

// Storage Key
const LOCAL_STORAGE_KEY = '222splits_app_state';

// Default initial state
const getInitialState = () => {
  const defaultPeriod = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  
  return {
    members: DEFAULT_MEMBERS,
    bills: {
      room: 709800,
      electricity: 0,
      water: 0,
      ac: 185000,
      internet: 200000,
      tax: 70980
    },
    waterInputMode: 'm3',
    waterM3: 0,
    rates: DEFAULT_RATES,
    electricityCalculations: {
      freezer: {
        wattage: DEFAULT_DEVICES.freezer.wattage,
        hoursPerDay: DEFAULT_DEVICES.freezer.hoursPerDay,
        enabled: true,
        memberIds: ['deni', 'zandi', 'baren', 'ricki', 'zul', 'vito']
      },
      riceCooker: {
        wattage: DEFAULT_DEVICES.riceCooker.wattage,
        hoursPerDay: DEFAULT_DEVICES.riceCooker.hoursPerDay,
        enabled: true,
        memberIds: ['deni', 'ricki']
      }
    },
    splits: {
      room: ['deni', 'zandi'],
      ac: ['deni', 'zandi'],
      internet: ['deni', 'zandi'],
      tax: ['deni', 'zandi'],
      electricityRemainder: ['deni', 'zandi'],
      waterMain: ['deni', 'zandi'], // 80% split
      waterOther: ['ricki', 'zul']   // 20% split
    },
    periodName: defaultPeriod,
    paymentNote: ''
  };
};

export default function App() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Make sure parsing was complete and has necessary properties
        if (parsed.members && parsed.bills && parsed.splits) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load from localStorage:", e);
    }
    return getInitialState();
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Calculations
  const calculationResult = calculateSplits(state);

  // Handlers for state updates
  const handleUpdateBill = (item, value) => {
    setState(prev => ({
      ...prev,
      bills: {
        ...prev.bills,
        [item]: value
      }
    }));
  };

  const handleUpdateWaterMode = (mode) => {
    setState(prev => ({
      ...prev,
      waterInputMode: mode
    }));
  };

  const handleUpdateWaterM3 = (value) => {
    setState(prev => ({
      ...prev,
      waterM3: value
    }));
  };

  const handleUpdateRates = (rateField, value) => {
    setState(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [rateField]: value
      }
    }));
  };

  const handleUpdateCalculation = (device, data) => {
    setState(prev => ({
      ...prev,
      electricityCalculations: {
        ...prev.electricityCalculations,
        [device]: data
      }
    }));
  };

  const handleUpdateSplits = (category, newList) => {
    setState(prev => ({
      ...prev,
      splits: {
        ...prev.splits,
        [category]: newList
      }
    }));
  };

  const handleUpdatePeriod = (name) => {
    setState(prev => ({
      ...prev,
      periodName: name
    }));
  };

  const handleUpdatePaymentNote = (note) => {
    setState(prev => ({
      ...prev,
      paymentNote: note
    }));
  };

  // Member Management State & Handlers
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberIsMain, setNewMemberIsMain] = useState(false);

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const id = newMemberName.toLowerCase().replace(/\s+/g, '_');
    
    // Avoid duplicates
    if (state.members.some(m => m.id === id)) {
      alert("Nama member sudah ada. Gunakan nama panggilan lain!");
      return;
    }

    const newMember = {
      id,
      name: newMemberName.trim(),
      isMain: newMemberIsMain
    };

    setState(prev => {
      // Add member to relevant splits automatically
      const updatedSplits = { ...prev.splits };
      
      // Auto add to freezer
      if (prev.electricityCalculations.freezer.enabled) {
        prev.electricityCalculations.freezer.memberIds.push(id);
      }

      if (newMember.isMain) {
        // Main tenants automatically split room, ac, internet, tax, electricity remainder, and waterMain
        ['room', 'ac', 'internet', 'tax', 'electricityRemainder', 'waterMain'].forEach(cat => {
          if (!updatedSplits[cat].includes(id)) {
            updatedSplits[cat] = [...updatedSplits[cat], id];
          }
        });
      } else {
        // Roommates split waterOther by default
        if (!updatedSplits.waterOther.includes(id)) {
          updatedSplits.waterOther = [...updatedSplits.waterOther, id];
        }
      }

      return {
        ...prev,
        members: [...prev.members, newMember],
        splits: updatedSplits
      };
    });

    setNewMemberName('');
    setNewMemberIsMain(false);
  };

  const handleRemoveMember = (memberId) => {
    if (memberId === 'deni' || memberId === 'zandi') {
      alert("Penyewa utama (Deni & Zandi) tidak bisa dihapus.");
      return;
    }
    
    if (!confirm("Apakah Anda yakin ingin menghapus member ini?")) return;

    setState(prev => {
      // Clean up splits and device lists
      const cleanedSplits = {};
      Object.keys(prev.splits).forEach(key => {
        cleanedSplits[key] = prev.splits[key].filter(id => id !== memberId);
      });

      const cleanedElecCalculations = { ...prev.electricityCalculations };
      Object.keys(cleanedElecCalculations).forEach(key => {
        cleanedElecCalculations[key] = {
          ...cleanedElecCalculations[key],
          memberIds: (cleanedElecCalculations[key].memberIds || []).filter(id => id !== memberId)
        };
      });

      return {
        ...prev,
        members: prev.members.filter(m => m.id !== memberId),
        splits: cleanedSplits,
        electricityCalculations: cleanedElecCalculations
      };
    });
  };

  const handleToggleMemberRole = (memberId) => {
    setState(prev => {
      const updatedMembers = prev.members.map(m => {
        if (m.id === memberId) {
          return { ...m, isMain: !m.isMain };
        }
        return m;
      });

      const updatedSplits = { ...prev.splits };
      const toggledMember = updatedMembers.find(m => m.id === memberId);

      if (toggledMember) {
        if (toggledMember.isMain) {
          // Add to main splits, remove from waterOther
          ['room', 'ac', 'internet', 'tax', 'electricityRemainder', 'waterMain'].forEach(cat => {
            if (!updatedSplits[cat].includes(memberId)) {
              updatedSplits[cat] = [...updatedSplits[cat], memberId];
            }
          });
          updatedSplits.waterOther = updatedSplits.waterOther.filter(id => id !== memberId);
        } else {
          // Remove from main splits, add to waterOther
          ['room', 'ac', 'internet', 'tax', 'electricityRemainder', 'waterMain'].forEach(cat => {
            updatedSplits[cat] = updatedSplits[cat].filter(id => id !== memberId);
          });
          if (!updatedSplits.waterOther.includes(memberId)) {
            updatedSplits.waterOther = [...updatedSplits.waterOther, memberId];
          }
        }
      }

      return {
        ...prev,
        members: updatedMembers,
        splits: updatedSplits
      };
    });
  };

  const handleResetToDefaults = () => {
    if (confirm("Reset ulang semua input dan member kembali ke default?")) {
      setState(getInitialState());
    }
  };

  return (
    <div className="app-wrapper">
      {/* Header Banner */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo-section">
            <span className="logo-icon">🏠</span>
            <div className="logo-text">
              <h1>222Splits</h1>
              <p>Kalkulator Split Tagihan Rusun Premium</p>
            </div>
          </div>
          <span className="header-badge">v1.2 (Active)</span>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="container">
        {/* Active Members Management Section */}
        <section className="glass-panel panel-section members-manager">
          <h3 className="section-title">👥 Pengelola Anggota Rusun</h3>
          <form className="member-input-row" onSubmit={handleAddMember}>
            <input 
              type="text" 
              placeholder="Nama panggilan baru (Contoh: Budi)" 
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
            <label className="selector-chip" style={{ display: 'inline-flex', height: '42px', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={newMemberIsMain}
                onChange={() => setNewMemberIsMain(!newMemberIsMain)}
              />
              <span>Main Tenant</span>
            </label>
            <button type="submit" className="btn-add-member">+ Tambah</button>
          </form>

          <div className="members-list">
            {state.members.map(member => (
              <div key={member.id} className={`member-badge ${member.isMain ? 'main-tenant' : ''}`}>
                <span className="member-badge-name">{member.name}</span>
                {member.id !== 'deni' && member.id !== 'zandi' && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => handleToggleMemberRole(member.id)}
                      className="btn-toggle-role"
                      title={member.isMain ? "Jadikan roommate biasa" : "Jadikan penyewa utama (Deni/Zandi)"}
                    >
                      👑
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveMember(member.id)}
                      className="btn-remove-member"
                      title="Hapus member"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Grand Total Banner */}
        <div className="grand-total-banner">
          <span className="grand-total-label">Grand Total Pembayaran</span>
          <span className="grand-total-amount">{formatIDR(calculationResult.grandTotal)}</span>
        </div>

        {/* Two-Column Layout */}
        <div className="dashboard-grid">
          {/* Left Column: Bill Inputs */}
          <div className="dashboard-left-col">
            <BillForm
              bills={state.bills}
              waterInputMode={state.waterInputMode}
              waterM3={state.waterM3}
              rates={state.rates}
              members={state.members}
              splits={state.splits}
              onUpdateBill={handleUpdateBill}
              onUpdateWaterMode={handleUpdateWaterMode}
              onUpdateWaterM3={handleUpdateWaterM3}
              onUpdateRates={handleUpdateRates}
              onUpdateSplits={handleUpdateSplits}
            />
          </div>

          {/* Right Column: Calculations & Sharing */}
          <div className="dashboard-right-col">
            <ElectricityBreakdown
              rates={state.rates}
              electricityCalculations={state.electricityCalculations}
              members={state.members}
              splits={state.splits}
              electricityTotal={state.bills.electricity}
              onUpdateRates={handleUpdateRates}
              onUpdateCalculation={handleUpdateCalculation}
              onUpdateSplits={handleUpdateSplits}
            />

            <div className="panel-section glass-panel" style={{ marginTop: '1.5rem' }}>
              <SplitSummary result={calculationResult} />
            </div>

            <div className="panel-section glass-panel" style={{ marginTop: '1.5rem' }}>
              <WhatsAppShare 
                result={calculationResult}
                periodName={state.periodName}
                onUpdatePeriod={handleUpdatePeriod}
                paymentNote={state.paymentNote}
                onUpdatePaymentNote={handleUpdatePaymentNote}
              />
            </div>
            
            <div style={{ textAlign: 'right', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <button 
                type="button" 
                className="btn-close-drawer"
                style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#F87171' }}
                onClick={handleResetToDefaults}
              >
                Reset ke Default Pabrik ⚠️
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="app-footer">
        <p>Built with ❤️ for Deni & Zandi by Antigravity AI.</p>
        <p style={{ marginTop: '0.25rem' }}>Frontend only. All data is saved automatically in your browser.</p>
      </footer>
    </div>
  );
}
