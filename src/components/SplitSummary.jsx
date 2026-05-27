import React, { useState } from 'react';
import { formatIDR } from '../utils/formatCurrency';
import './SplitSummary.css';

export default function SplitSummary({ result }) {
  const { personBreakdown, grandTotal, electricityCalculation, waterCalculation } = result;
  
  // Track which card is expanded for details
  const [expandedPerson, setExpandedPerson] = useState(null);

  const toggleExpand = (id) => {
    setExpandedPerson(expandedPerson === id ? null : id);
  };

  return (
    <div className="summary-list-panel">
      <h3 className="section-subtitle">📊 Rincian per Orang</h3>
      <p className="card-description">
        Pilih nama untuk melihat detail pembagian barang yang harus dibayar.
      </p>

      <div className="person-cards-grid">
        {personBreakdown.map((person) => {
          const { member, shares, totalOwed } = person;
          const isExpanded = expandedPerson === member.id;
          
          // Calculate percentage of grand total
          const sharePercentage = grandTotal > 0 ? (totalOwed / grandTotal) * 100 : 0;

          if (totalOwed <= 0) return null;

          return (
            <div 
              key={member.id} 
              className={`person-card glass-panel ${isExpanded ? 'expanded' : ''} ${member.isMain ? 'main-tenant-card' : ''}`}
              onClick={() => toggleExpand(member.id)}
            >
              {/* Card Header Summary */}
              <div className="card-header-summary">
                <div className="person-identity">
                  <div className="avatar-placeholder">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="person-name">
                      {member.name}
                      {member.isMain && <span className="main-badge">Utama</span>}
                    </h4>
                    <span className="person-pct">{sharePercentage.toFixed(1)}% dari total</span>
                  </div>
                </div>

                <div className="person-owed-amount">
                  {formatIDR(totalOwed)}
                  <span className="expand-indicator">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Progress Bar of their share */}
              <div className="share-progress-bar-container">
                <div 
                  className="share-progress-bar-fill"
                  style={{ width: `${sharePercentage}%` }}
                ></div>
              </div>

              {/* Detailed Breakdown Drawer */}
              {isExpanded && (
                <div className="person-details-drawer animate-fade-in" onClick={(e) => e.stopPropagation()}>
                  <div className="detail-table">
                    {shares.room > 0 && (
                      <div className="detail-row">
                        <span className="detail-item-name">🏠 Sewa Kamar</span>
                        <span className="detail-item-val">{formatIDR(shares.room)}</span>
                      </div>
                    )}

                    {shares.electricity > 0 && (
                      <div className="detail-group">
                        <div className="detail-row group-header">
                          <span className="detail-item-name">⚡ Listrik (Subtotal)</span>
                          <span className="detail-item-val">{formatIDR(shares.electricity)}</span>
                        </div>
                        <div className="group-children">
                          {shares.electricityDetails.freezer > 0 && (
                            <div className="detail-row child-row">
                              <span className="detail-item-name">• Freezer (÷{electricityCalculation.freezer.memberCount})</span>
                              <span className="detail-item-val">{formatIDR(shares.electricityDetails.freezer)}</span>
                            </div>
                          )}
                          {shares.electricityDetails.riceCooker > 0 && (
                            <div className="detail-row child-row">
                              <span className="detail-item-name">• Rice Cooker (÷{electricityCalculation.riceCooker.memberCount})</span>
                              <span className="detail-item-val">{formatIDR(shares.electricityDetails.riceCooker)}</span>
                            </div>
                          )}
                          {shares.electricityDetails.remainder > 0 && (
                            <div className="detail-row child-row">
                              <span className="detail-item-name">• Sisa Listrik (÷{electricityCalculation.remainder.memberCount})</span>
                              <span className="detail-item-val">{formatIDR(shares.electricityDetails.remainder)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {shares.water > 0 && (
                      <div className="detail-row">
                        <span className="detail-item-name">💧 Air (PDAM/Meteran)</span>
                        <span className="detail-item-val">
                          {formatIDR(shares.water)}
                          <span className="detail-pct-sub">
                            ({waterCalculation.total > 0 ? Math.round((shares.water / waterCalculation.total) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                    )}

                    {shares.ac > 0 && (
                      <div className="detail-row">
                        <span className="detail-item-name">❄️ Sewa AC</span>
                        <span className="detail-item-val">{formatIDR(shares.ac)}</span>
                      </div>
                    )}

                    {shares.internet > 0 && (
                      <div className="detail-row">
                        <span className="detail-item-name">🌐 Internet / Wifi</span>
                        <span className="detail-item-val">{formatIDR(shares.internet)}</span>
                      </div>
                    )}

                    {shares.tax > 0 && (
                      <div className="detail-row">
                        <span className="detail-item-name">📝 Pajak</span>
                        <span className="detail-item-val">{formatIDR(shares.tax)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
