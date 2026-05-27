import React, { useState } from 'react';
import { formatIDR } from '../utils/formatCurrency';
import './BillForm.css';

export default function BillForm({
  bills,
  waterInputMode,
  waterM3,
  rates,
  members,
  splits,
  onUpdateBill,
  onUpdateWaterMode,
  onUpdateWaterM3,
  onUpdateRates,
  onUpdateSplits
}) {
  // Local state to keep track of which split configurations are expanded
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleExpand = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleBillChange = (item, val) => {
    const value = parseFloat(val) || 0;
    onUpdateBill(item, value);
  };

  const handleToggleMember = (category, memberId) => {
    const currentList = splits[category] || [];
    let newList;
    if (currentList.includes(memberId)) {
      newList = currentList.filter(id => id !== memberId);
    } else {
      newList = [...currentList, memberId];
    }
    onUpdateSplits(category, newList);
  };

  return (
    <div className="bill-form-panel">
      <h3 className="section-subtitle">💵 Input Tagihan</h3>
      <p className="card-description">
        Masukkan nilai tagihan bulan ini dan sesuaikan pembagian per barang jika diperlukan.
      </p>

      {/* 1. Room Rent Input */}
      <div className="bill-input-card">
        <div className="bill-main-row">
          <div className="input-group flex-grow">
            <label className="input-label">Sewa Kamar (Rent)</label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                type="number"
                value={bills.room || ''}
                onChange={(e) => handleBillChange('room', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <button 
            type="button" 
            className={`btn-toggle-config ${splits.room?.length !== 2 ? 'customized' : ''}`}
            onClick={() => toggleExpand('room')}
            title="Atur pembagian kamar"
          >
            ⚙️ {splits.room?.length || 0} Orang
          </button>
        </div>
        
        {expandedSection === 'room' && (
          <div className="split-config-drawer animate-fade-in">
            <span className="drawer-title">Sewa kamar dibagi ke:</span>
            <div className="selector-grid">
              {members.map(m => (
                <label key={m.id} className={`selector-chip ${splits.room?.includes(m.id) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.room?.includes(m.id)}
                    onChange={() => handleToggleMember('room', m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Electricity Total Input */}
      <div className="bill-input-card">
        <div className="bill-main-row">
          <div className="input-group flex-grow">
            <label className="input-label">Total Tagihan Listrik (PLN)</label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                type="number"
                value={bills.electricity || ''}
                onChange={(e) => handleBillChange('electricity', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <p className="helper-info-text">
          *Beban freezer & rice cooker diatur di panel sebelah kanan.
        </p>
      </div>

      {/* 3. Water Input */}
      <div className="bill-input-card">
        <div className="bill-main-row flex-col">
          <div className="water-mode-toggle">
            <span className="toggle-label-text">Cara Input Air:</span>
            <div className="radio-group">
              <button 
                type="button"
                className={`radio-btn ${waterInputMode === 'm3' ? 'active' : ''}`}
                onClick={() => onUpdateWaterMode('m3')}
              >
                Meter Air (m³)
              </button>
              <button 
                type="button"
                className={`radio-btn ${waterInputMode === 'idr' ? 'active' : ''}`}
                onClick={() => onUpdateWaterMode('idr')}
              >
                Nominal Langsung
              </button>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
            {waterInputMode === 'm3' ? (
              <>
                <div className="input-group" style={{ flex: '1 1 50%', marginBottom: 0 }}>
                  <label className="input-label">Pemakaian Air (m³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterM3 || ''}
                    onChange={(e) => onUpdateWaterM3(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="input-group" style={{ flex: '1 1 50%', marginBottom: 0 }}>
                  <label className="input-label">
                    <span>Est. Tagihan Air</span>
                  </label>
                  <div className="currency-input-wrapper readonly-wrapper">
                    <span className="currency-prefix">Rp</span>
                    <input
                      type="text"
                      readOnly
                      value={formatIDR(waterM3 * rates.waterM3 + rates.waterMaintenance)}
                      className="readonly-input"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="input-group flex-grow" style={{ marginBottom: 0 }}>
                <label className="input-label">Total Tagihan Air (PDAM)</label>
                <div className="currency-input-wrapper">
                  <span className="currency-prefix">Rp</span>
                  <input
                    type="number"
                    value={bills.water || ''}
                    onChange={(e) => handleBillChange('water', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
            <button 
              type="button" 
              className={`btn-toggle-config ${(splits.waterMain?.length !== 2 || splits.waterOther?.length !== 2) ? 'customized' : ''}`}
              onClick={() => toggleExpand('water')}
              style={{ height: '42px', alignSelf: 'flex-end' }}
            >
              ⚙️ Split 80/20
            </button>
          </div>
        </div>

        {waterInputMode === 'm3' && expandedSection !== 'water' && (
          <div className="water-rates-inline">
            <span>Tarif: <strong>{formatIDR(rates.waterM3)}/m³</strong></span>
            <span>Abonemen: <strong>{formatIDR(rates.waterMaintenance)}</strong></span>
            <button 
              type="button" 
              className="btn-edit-rates"
              onClick={() => toggleExpand('water-rates')}
            >
              Ubah Tarif Air
            </button>
          </div>
        )}

        {expandedSection === 'water-rates' && (
          <div className="split-config-drawer animate-fade-in">
            <span className="drawer-title">Konfigurasi Tarif Air:</span>
            <div className="input-grid-2">
              <div className="input-group">
                <label className="input-label">Tarif per m³ (IDR)</label>
                <input
                  type="number"
                  value={rates.waterM3}
                  onChange={(e) => onUpdateRates('waterM3', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Abonemen / Perawatan (IDR)</label>
                <input
                  type="number"
                  value={rates.waterMaintenance}
                  onChange={(e) => onUpdateRates('waterMaintenance', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <button type="button" className="btn-close-drawer" onClick={() => setExpandedSection(null)}>
              Tutup
            </button>
          </div>
        )}

        {expandedSection === 'water' && (
          <div className="split-config-drawer animate-fade-in">
            <span className="drawer-title">Grup Utama Air (Menanggung 80% Tagihan):</span>
            <div className="selector-grid" style={{ marginBottom: '1rem' }}>
              {members.map(m => (
                <label key={m.id} className={`selector-chip ${splits.waterMain?.includes(m.id) ? 'active main-water-chip' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.waterMain?.includes(m.id)}
                    onChange={() => handleToggleMember('waterMain', m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>

            <span className="drawer-title">Grup Lainnya Air (Menanggung 20% Tagihan):</span>
            <div className="selector-grid">
              {members.map(m => (
                <label key={m.id} className={`selector-chip ${splits.waterOther?.includes(m.id) ? 'active other-water-chip' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.waterOther?.includes(m.id)}
                    onChange={() => handleToggleMember('waterOther', m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
            <p className="helper-info-text" style={{ marginTop: '0.75rem' }}>
              *Deni & Zandi menanggung 80% (40% masing-masing), Ricki & Zul menanggung 20% (10% masing-masing) secara default.
            </p>
          </div>
        )}
      </div>

      {/* 4. AC Rent Input */}
      <div className="bill-input-card">
        <div className="bill-main-row">
          <div className="input-group flex-grow">
            <label className="input-label">Sewa AC (Air Conditioner)</label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                type="number"
                value={bills.ac || ''}
                onChange={(e) => handleBillChange('ac', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <button 
            type="button" 
            className={`btn-toggle-config ${splits.ac?.length !== 2 ? 'customized' : ''}`}
            onClick={() => toggleExpand('ac')}
          >
            ⚙️ {splits.ac?.length || 0} Orang
          </button>
        </div>

        {expandedSection === 'ac' && (
          <div className="split-config-drawer animate-fade-in">
            <span className="drawer-title">Sewa AC dibagi ke:</span>
            <div className="selector-grid">
              {members.map(m => (
                <label key={m.id} className={`selector-chip ${splits.ac?.includes(m.id) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.ac?.includes(m.id)}
                    onChange={() => handleToggleMember('ac', m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Internet Input */}
      <div className="bill-input-card">
        <div className="bill-main-row">
          <div className="input-group flex-grow">
            <label className="input-label">Internet / Wifi</label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                type="number"
                value={bills.internet || ''}
                onChange={(e) => handleBillChange('internet', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <button 
            type="button" 
            className={`btn-toggle-config ${splits.internet?.length !== 2 ? 'customized' : ''}`}
            onClick={() => toggleExpand('internet')}
          >
            ⚙️ {splits.internet?.length || 0} Orang
          </button>
        </div>

        {expandedSection === 'internet' && (
          <div className="split-config-drawer animate-fade-in">
            <span className="drawer-title">Internet/Wifi dibagi ke:</span>
            <div className="selector-grid">
              {members.map(m => (
                <label key={m.id} className={`selector-chip ${splits.internet?.includes(m.id) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.internet?.includes(m.id)}
                    onChange={() => handleToggleMember('internet', m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Tax Input */}
      <div className="bill-input-card">
        <div className="bill-main-row">
          <div className="input-group flex-grow">
            <label className="input-label">Pajak (Tax)</label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">Rp</span>
              <input
                type="number"
                value={bills.tax || ''}
                onChange={(e) => handleBillChange('tax', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <button 
            type="button" 
            className={`btn-toggle-config ${splits.tax?.length !== 2 ? 'customized' : ''}`}
            onClick={() => toggleExpand('tax')}
          >
            ⚙️ {splits.tax?.length || 0} Orang
          </button>
        </div>

        {expandedSection === 'tax' && (
          <div className="split-config-drawer animate-fade-in">
            <span className="drawer-title">Pajak dibagi ke:</span>
            <div className="selector-grid">
              {members.map(m => (
                <label key={m.id} className={`selector-chip ${splits.tax?.includes(m.id) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.tax?.includes(m.id)}
                    onChange={() => handleToggleMember('tax', m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
