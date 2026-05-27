import React, { useState, useEffect } from 'react';
import { formatGroupSummary, formatIndividualSummary } from '../utils/whatsappFormatter';
import { formatIDR } from '../utils/formatCurrency';
import './WhatsAppShare.css';

export default function WhatsAppShare({ result, periodName, onUpdatePeriod, paymentNote, onUpdatePaymentNote }) {
  const { personBreakdown } = result;
  
  // Tabs: 'group' or 'individual'
  const [activeTab, setActiveTab] = useState('group');
  
  // Clipboard copy state flags
  const [copiedGroup, setCopiedGroup] = useState(false);
  const [copiedIndividual, setCopiedIndividual] = useState({});

  // Individual phone numbers for direct wa.me/62... links
  const [phoneNumbers, setPhoneNumbers] = useState(() => {
    const saved = localStorage.getItem('222splits_phones');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('222splits_phones', JSON.stringify(phoneNumbers));
  }, [phoneNumbers]);

  const handlePhoneChange = (memberId, val) => {
    setPhoneNumbers(prev => ({
      ...prev,
      [memberId]: val
    }));
  };

  const copyToClipboard = (text, type = 'group', id = null) => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'group') {
        setCopiedGroup(true);
        setTimeout(() => setCopiedGroup(false), 2000);
      } else if (type === 'individual' && id) {
        setCopiedIndividual(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
          setCopiedIndividual(prev => ({ ...prev, [id]: false }));
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  const groupText = formatGroupSummary(result, periodName, paymentNote);

  // Helper to format clean phone numbers (e.g. converting 0812... to 62812...)
  const getCleanPhone = (phone) => {
    if (!phone) return '';
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  };

  const getWaLink = (text, phone = '') => {
    const encodedText = encodeURIComponent(text);
    const cleanPhone = getCleanPhone(phone);
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encodedText}`;
    }
    return `https://api.whatsapp.com/send?text=${encodedText}`;
  };

  return (
    <div className="whatsapp-share-panel">
      <h3 className="section-subtitle">📱 Kirim ke WhatsApp</h3>
      <p className="card-description">
        Bagikan rincian tagihan ini ke grup WhatsApp rusun atau secara pribadi (DM).
      </p>

      {/* Tabs */}
      <div className="wa-tabs">
        <button 
          className={`wa-tab-btn ${activeTab === 'group' ? 'active' : ''}`}
          onClick={() => setActiveTab('group')}
        >
          👥 Ringkasan Grup
        </button>
        <button 
          className={`wa-tab-btn ${activeTab === 'individual' ? 'active' : ''}`}
          onClick={() => setActiveTab('individual')}
        >
          👤 Kirim Personal
        </button>
      </div>

      {/* Shared configurations */}
      <div className="share-config-section">
        <div className="input-group">
          <label className="input-label">Bulan / Periode Tagihan</label>
          <input
            type="text"
            value={periodName}
            onChange={(e) => onUpdatePeriod(e.target.value)}
            placeholder="Contoh: Mei 2026"
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">Catatan Transfer (Opsional)</label>
          <textarea
            rows="3"
            value={paymentNote}
            onChange={(e) => onUpdatePaymentNote(e.target.value)}
            placeholder="Contoh: Transfer ke BCA 12345678 a/n Deni Wijaya"
          />
        </div>
      </div>

      {/* Tab 1: Group Summary */}
      {activeTab === 'group' && (
        <div className="group-summary-content animate-fade-in">
          <label className="input-label">Pratinjau Pesan Grup:</label>
          <div className="message-preview-container">
            <pre className="message-preview">{groupText}</pre>
          </div>

          <div className="share-actions-row">
            <button 
              type="button" 
              className="btn-copy-wa"
              onClick={() => copyToClipboard(groupText, 'group')}
            >
              {copiedGroup ? '✅ Berhasil Disalin!' : '📋 Salin Pesan'}
            </button>
            <a 
              href={getWaLink(groupText)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-share-wa"
            >
              💬 Kirim ke Grup WA
            </a>
          </div>
        </div>
      )}

      {/* Tab 2: Individual Summaries */}
      {activeTab === 'individual' && (
        <div className="individual-summary-content animate-fade-in">
          <div className="individual-members-list">
            {personBreakdown.map(person => {
              const { member, totalOwed } = person;
              if (totalOwed <= 0) return null;

              const indText = formatIndividualSummary(person, result, paymentNote);
              const isCopied = copiedIndividual[member.id] || false;
              const phone = phoneNumbers[member.id] || '';

              return (
                <div key={member.id} className="ind-member-card">
                  <div className="ind-member-header">
                    <span className="ind-member-name">{member.name}</span>
                    <span className="ind-member-owed">{formatIDR(totalOwed)}</span>
                  </div>

                  <div className="ind-member-actions">
                    <div className="phone-input-wrapper">
                      <span className="phone-prefix">+62</span>
                      <input 
                        type="text"
                        placeholder="81234567..."
                        value={phone}
                        onChange={(e) => handlePhoneChange(member.id, e.target.value)}
                        className="phone-input"
                        title="Masukkan nomor HP untuk langsung kirim DM WA"
                      />
                    </div>

                    <div className="actions-buttons-group">
                      <button 
                        type="button"
                        className={`btn-ind-action btn-ind-copy ${isCopied ? 'copied' : ''}`}
                        onClick={() => copyToClipboard(indText, 'individual', member.id)}
                        title="Salin rincian orang ini"
                      >
                        {isCopied ? '✅' : '📋'}
                      </button>
                      <a 
                        href={getWaLink(indText, phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ind-action btn-ind-share"
                        title="Kirim chat langsung ke WA orang ini"
                      >
                        💬 Kirim WA
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
