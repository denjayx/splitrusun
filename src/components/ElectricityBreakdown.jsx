import React from 'react';
import { formatIDR } from '../utils/formatCurrency';
import './ElectricityBreakdown.css';

export default function ElectricityBreakdown({
  rates,
  electricityCalculations,
  members,
  splits,
  electricityTotal,
  onUpdateRates,
  onUpdateCalculation,
  onUpdateSplits
}) {
  const { freezer, riceCooker } = electricityCalculations;

  // Toggle freezer/rice cooker enabled state
  const handleToggleDevice = (device) => {
    onUpdateCalculation(device, {
      ...electricityCalculations[device],
      enabled: !electricityCalculations[device].enabled
    });
  };

  // Update numeric fields (wattage, hours)
  const handleNumberChange = (device, field, val) => {
    const value = parseFloat(val) || 0;
    onUpdateCalculation(device, {
      ...electricityCalculations[device],
      [field]: value
    });
  };

  // Toggle member inclusion in a specific device split
  const handleToggleMemberForDevice = (device, memberId) => {
    const currentList = electricityCalculations[device].memberIds || [];
    let newList;
    if (currentList.includes(memberId)) {
      newList = currentList.filter(id => id !== memberId);
    } else {
      newList = [...currentList, memberId];
    }
    onUpdateCalculation(device, {
      ...electricityCalculations[device],
      memberIds: newList
    });
  };

  // Toggle member inclusion in remaining electricity split
  const handleToggleMemberForRemainder = (memberId) => {
    const currentList = splits.electricityRemainder || [];
    let newList;
    if (currentList.includes(memberId)) {
      newList = currentList.filter(id => id !== memberId);
    } else {
      newList = [...currentList, memberId];
    }
    onUpdateSplits('electricityRemainder', newList);
  };

  // Sub-calculations for real-time preview
  const freezerKwh = freezer.enabled ? (freezer.wattage * freezer.hoursPerDay * 30) / 1000 : 0;
  const freezerCost = freezerKwh * rates.electricityKwh;

  const riceCookerKwh = riceCooker.enabled ? (riceCooker.wattage * riceCooker.hoursPerDay * 30) : 0;
  const riceCookerCost = (riceCookerKwh * 30 / 30) / 1000 * rates.electricityKwh; // equivalent to: (300 * 2.5 * 30) / 1000 * rate
  const calculatedRiceCookerCost = riceCooker.enabled ? (riceCooker.wattage * riceCooker.hoursPerDay * 30 / 1000) * rates.electricityKwh : 0;

  return (
    <div className="elec-breakdown-card">
      <h3 className="section-subtitle">⚡ Sub-Kalkulasi Alat Listrik</h3>
      <p className="card-description">
        Masukkan watt dan jam pakai untuk menghitung beban alat yang menyala terus/khusus.
      </p>

      {/* Electricity Rate configuration */}
      <div className="input-group" style={{ marginBottom: '1.5rem' }}>
        <label className="input-label">
          <span>Tarif Listrik per kWh</span>
          <span className="input-suffix">Default: Rp 1.262</span>
        </label>
        <div className="currency-input-wrapper">
          <span className="currency-prefix">Rp</span>
          <input
            type="number"
            value={rates.electricityKwh}
            onChange={(e) => onUpdateRates('electricityKwh', parseFloat(e.target.value) || 0)}
            placeholder="1262"
          />
        </div>
      </div>

      {/* Freezer Sub-Calculator */}
      <div className={`device-section ${!freezer.enabled ? 'disabled' : ''}`}>
        <div className="device-header">
          <div className="device-title">
            <span className="device-icon">❄️</span>
            <div>
              <h4>Freezer (Kulkas/Sewa/dll)</h4>
              <span className="device-cost-preview">Est. Tagihan: <strong>{formatIDR(freezerCost)}</strong> / bulan</span>
            </div>
          </div>
          <div className="switch-container">
            <input
              type="checkbox"
              id="freezer-enabled"
              className="switch-input"
              checked={freezer.enabled}
              onChange={() => handleToggleDevice('freezer')}
            />
            <label htmlFor="freezer-enabled" className="switch-slider-label"></label>
          </div>
        </div>

        {freezer.enabled && (
          <div className="device-body animate-fade-in">
            <div className="input-grid-2">
              <div className="input-group">
                <label className="input-label">Konsumsi (Watt)</label>
                <input
                  type="number"
                  step="0.1"
                  value={freezer.wattage}
                  onChange={(e) => handleNumberChange('freezer', 'wattage', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Rata-rata jam / hari</label>
                <input
                  type="number"
                  step="0.5"
                  value={freezer.hoursPerDay}
                  onChange={(e) => handleNumberChange('freezer', 'hoursPerDay', e.target.value)}
                />
              </div>
            </div>
            
            <div className="split-selectors">
              <span className="selector-title">Dibagi ke ({freezer.memberIds.length} orang):</span>
              <div className="selector-grid">
                {members.map(member => (
                  <label key={member.id} className={`selector-chip ${freezer.memberIds.includes(member.id) ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={freezer.memberIds.includes(member.id)}
                      onChange={() => handleToggleMemberForDevice('freezer', member.id)}
                    />
                    <span>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rice Cooker Sub-Calculator */}
      <div className={`device-section ${!riceCooker.enabled ? 'disabled' : ''}`}>
        <div className="device-header">
          <div className="device-title">
            <span className="device-icon">🍚</span>
            <div>
              <h4>Rice Cooker</h4>
              <span className="device-cost-preview">Est. Tagihan: <strong>{formatIDR(calculatedRiceCookerCost)}</strong> / bulan</span>
            </div>
          </div>
          <div className="switch-container">
            <input
              type="checkbox"
              id="rice-cooker-enabled"
              className="switch-input"
              checked={riceCooker.enabled}
              onChange={() => handleToggleDevice('riceCooker')}
            />
            <label htmlFor="rice-cooker-enabled" className="switch-slider-label"></label>
          </div>
        </div>

        {riceCooker.enabled && (
          <div className="device-body animate-fade-in">
            <div className="input-grid-2">
              <div className="input-group">
                <label className="input-label">Konsumsi (Watt)</label>
                <input
                  type="number"
                  value={riceCooker.wattage}
                  onChange={(e) => handleNumberChange('riceCooker', 'wattage', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Rata-rata jam / hari</label>
                <input
                  type="number"
                  step="0.5"
                  value={riceCooker.hoursPerDay}
                  onChange={(e) => handleNumberChange('riceCooker', 'hoursPerDay', e.target.value)}
                />
              </div>
            </div>
            
            <div className="split-selectors">
              <span className="selector-title">Dibagi ke ({riceCooker.memberIds.length} orang):</span>
              <div className="selector-grid">
                {members.map(member => (
                  <label key={member.id} className={`selector-chip ${riceCooker.memberIds.includes(member.id) ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={riceCooker.memberIds.includes(member.id)}
                      onChange={() => handleToggleMemberForDevice('riceCooker', member.id)}
                    />
                    <span>{member.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Electricity Remainder Split config */}
      <div className="device-section remainder-section">
        <div className="device-header">
          <div className="device-title">
            <span className="device-icon">💡</span>
            <div>
              <h4>Sisa Listrik Lainnya</h4>
              <span className="device-cost-preview">
                Est. Sisa: <strong>{formatIDR(Math.max(0, (parseFloat(electricityTotal) || 0) - freezerCost - calculatedRiceCookerCost))}</strong>
              </span>
            </div>
          </div>
        </div>
        <div className="device-body" style={{ marginTop: '0.5rem', paddingTop: 0 }}>
          <div className="split-selectors" style={{ border: 'none', padding: 0 }}>
            <span className="selector-title">Sisa tagihan listrik dibagi ke:</span>
            <div className="selector-grid">
              {members.map(member => (
                <label key={member.id} className={`selector-chip ${splits.electricityRemainder?.includes(member.id) ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={splits.electricityRemainder?.includes(member.id)}
                    onChange={() => handleToggleMemberForRemainder(member.id)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
