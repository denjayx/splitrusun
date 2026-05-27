import { formatIDR } from './formatCurrency';

/**
 * Formats a single person's breakdown into a WhatsApp message.
 * @param {Object} person - Person data from breakdown
 * @param {Object} fullResult - Full calculation result object
 * @param {string} note - Custom note (e.g., bank transfer info)
 * @returns {string}
 */
export function formatIndividualSummary(person, fullResult, note = '') {
  const { member, shares, totalOwed } = person;
  const { electricityCalculation, waterCalculation } = fullResult;
  
  let text = `👤 *TAGIHAN SPLIT 222 — ${member.name.toUpperCase()}*\n\n`;
  text += `Berikut rincian tagihan kamu bulan ini:\n\n`;

  // Room
  if (shares.room > 0) {
    text += `• *Sewa Kamar:* ${formatIDR(shares.room)}\n`;
  }

  // Electricity breakdown
  if (shares.electricity > 0) {
    text += `• *Listrik:* ${formatIDR(shares.electricity)}\n`;
    const details = shares.electricityDetails;
    if (details.freezer > 0) {
      text += `   - Freezer (÷${electricityCalculation.freezer.memberCount}): ${formatIDR(details.freezer)}\n`;
    }
    if (details.riceCooker > 0) {
      text += `   - Rice Cooker (÷${electricityCalculation.riceCooker.memberCount}): ${formatIDR(details.riceCooker)}\n`;
    }
    if (details.remainder > 0) {
      text += `   - Sisa Listrik (÷${electricityCalculation.remainder.memberCount}): ${formatIDR(details.remainder)}\n`;
    }
  }

  // Water
  if (shares.water > 0) {
    // Show percentage or details
    const isMain = fullResult.personBreakdown.find(p => p.member.id === member.id)?.shares.water > 0; // check where they belong
    // Calculate percentage representation
    const pct = waterCalculation.total > 0 ? Math.round((shares.water / waterCalculation.total) * 100) : 0;
    text += `• *Air (${pct}%):* ${formatIDR(shares.water)}\n`;
  }

  // AC
  if (shares.ac > 0) {
    text += `• *Sewa AC:* ${formatIDR(shares.ac)}\n`;
  }

  // Internet
  if (shares.internet > 0) {
    text += `• *Internet/Wifi:* ${formatIDR(shares.internet)}\n`;
  }

  // Tax
  if (shares.tax > 0) {
    text += `• *Pajak:* ${formatIDR(shares.tax)}\n`;
  }

  text += `--------------------------------------\n`;
  text += `💵 *TOTAL WAJIB BAYAR:* *${formatIDR(totalOwed)}*\n\n`;

  if (note.trim()) {
    text += `${note}\n`;
  } else {
    text += `Mohon segera ditransfer ya, terima kasih! 🙏`;
  }

  return text;
}

/**
 * Formats all members' totals into a single group WhatsApp summary.
 * @param {Object} fullResult - Full calculation result object
 * @param {string} periodName - Custom period (e.g., "Mei 2026")
 * @param {string} note - Custom payment info note
 * @returns {string}
 */
export function formatGroupSummary(fullResult, periodName = '', note = '') {
  const { bills, personBreakdown, grandTotal } = fullResult;
  const period = periodName || new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  let text = `🏠 *TAGIHAN RUSUN — ${period.toUpperCase()}*\n\n`;
  
  text += `📋 *Rincian Pengeluaran:* \n`;
  text += `• Sewa Kamar: ${formatIDR(bills.room)}\n`;
  text += `• Listrik: ${formatIDR(bills.electricity)}\n`;
  text += `• Air: ${formatIDR(bills.water)}\n`;
  text += `• Sewa AC: ${formatIDR(bills.ac)}\n`;
  text += `• Internet/Wifi: ${formatIDR(bills.internet)}\n`;
  text += `• Pajak: ${formatIDR(bills.tax)}\n`;
  text += `--------------------------------------\n`;
  text += `*GRAND TOTAL:* *${formatIDR(grandTotal)}*\n\n`;

  text += `💰 *Rincian per Orang:* \n`;
  
  // Sort main tenants first
  const sortedBreakdown = [...personBreakdown].sort((a, b) => {
    if (a.member.isMain && !b.member.isMain) return -1;
    if (!a.member.isMain && b.member.isMain) return 1;
    return b.totalOwed - a.totalOwed;
  });

  sortedBreakdown.forEach(person => {
    if (person.totalOwed > 0) {
      text += `• *${person.member.name}:* ${formatIDR(person.totalOwed)}\n`;
    }
  });

  text += `\n`;
  if (note.trim()) {
    text += `${note}\n`;
  } else {
    text += `Detail breakdown per barang bisa dicek di web atau minta ke Deni. Makasih semuanya! 👍`;
  }

  return text;
}
