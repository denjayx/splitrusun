import { DEFAULT_RATES } from '../data/defaults';

/**
 * Calculates the bill splits based on form state.
 * @param {Object} state - The full application state
 * @returns {Object} Calculated splits, item breakdowns, and totals
 */
export function calculateSplits(state) {
  const {
    members = [],
    bills = {},
    waterInputMode = 'm3',
    waterM3 = 0,
    rates = DEFAULT_RATES,
    electricityCalculations = {},
    splits = {}
  } = state;

  const activeMembers = members.filter(m => !m.hidden); // Support hiding/inactive members if needed
  const activeMemberIds = activeMembers.map(m => m.id);

  // Helper to safely split an amount among a list of member IDs
  const getShare = (amount, memberIds, fallbackIds = []) => {
    const targets = memberIds.length > 0 ? memberIds : fallbackIds;
    if (targets.length === 0) return {};
    const share = amount / targets.length;
    
    const breakdown = {};
    targets.forEach(id => {
      breakdown[id] = share;
    });
    return breakdown;
  };

  // 1. Calculate Water Bill
  let totalWater = 0;
  if (waterInputMode === 'm3') {
    totalWater = (parseFloat(waterM3) || 0) * rates.waterM3 + rates.waterMaintenance;
  } else {
    totalWater = parseFloat(bills.water) || 0;
  }

  // Water split rules:
  // 80% split among waterMain (Deni, Zandi)
  // 20% split among waterOther (Ricki, Zul)
  const waterMainIds = splits.waterMain || [];
  const waterOtherIds = splits.waterOther || [];
  
  const waterBreakdown = {};
  activeMemberIds.forEach(id => { waterBreakdown[id] = 0; });

  const hasMain = waterMainIds.length > 0;
  const hasOther = waterOtherIds.length > 0;

  let waterMainTotal = 0;
  let waterOtherTotal = 0;

  if (hasMain && hasOther) {
    waterMainTotal = totalWater * 0.8;
    waterOtherTotal = totalWater * 0.2;
  } else if (hasMain) {
    waterMainTotal = totalWater;
  } else if (hasOther) {
    waterOtherTotal = totalWater;
  } else {
    // Fallback: split equally among all active members
    const share = totalWater / (activeMemberIds.length || 1);
    activeMemberIds.forEach(id => { waterBreakdown[id] = share; });
  }

  if (hasMain) {
    const share = waterMainTotal / waterMainIds.length;
    waterMainIds.forEach(id => {
      waterBreakdown[id] = (waterBreakdown[id] || 0) + share;
    });
  }
  if (hasOther) {
    const share = waterOtherTotal / waterOtherIds.length;
    waterOtherIds.forEach(id => {
      waterBreakdown[id] = (waterBreakdown[id] || 0) + share;
    });
  }

  // 2. Calculate Electricity Bill & Sub-items
  const totalElectricity = parseFloat(bills.electricity) || 0;
  
  // Freezer Calculations (40.3W, 24h, 30 days)
  const freezerCalc = electricityCalculations.freezer || {};
  const freezerKwh = freezerCalc.enabled 
    ? (freezerCalc.wattage * freezerCalc.hoursPerDay * 30) / 1000
    : 0;
  const freezerTotalCost = freezerKwh * rates.electricityKwh;
  const freezerShareMap = getShare(freezerTotalCost, freezerCalc.memberIds || [], activeMemberIds);

  // Rice Cooker Calculations (300W, 2.5h, 30 days)
  const riceCookerCalc = electricityCalculations.riceCooker || {};
  const riceCookerKwh = riceCookerCalc.enabled 
    ? (riceCookerCalc.wattage * riceCookerCalc.hoursPerDay * 30) / 1000
    : 0;
  const riceCookerTotalCost = riceCookerKwh * rates.electricityKwh;
  const riceCookerShareMap = getShare(riceCookerTotalCost, riceCookerCalc.memberIds || [], activeMemberIds);

  // Remaining Electricity
  const subtotalDeviceCost = freezerTotalCost + riceCookerTotalCost;
  const remainingElectricityCost = Math.max(0, totalElectricity - subtotalDeviceCost);
  const remainingElectricityShareMap = getShare(
    remainingElectricityCost, 
    splits.electricityRemainder || [], 
    activeMemberIds
  );

  // Combine electricity breakdowns per person
  const electricityBreakdown = {};
  activeMemberIds.forEach(id => {
    electricityBreakdown[id] = {
      freezer: freezerShareMap[id] || 0,
      riceCooker: riceCookerShareMap[id] || 0,
      remainder: remainingElectricityShareMap[id] || 0,
      total: (freezerShareMap[id] || 0) + (riceCookerShareMap[id] || 0) + (remainingElectricityShareMap[id] || 0)
    };
  });

  // 3. Simple Splits (Room, AC, Internet, Tax)
  const roomTotal = parseFloat(bills.room) || 0;
  const roomShareMap = getShare(roomTotal, splits.room || [], activeMemberIds);

  const acTotal = parseFloat(bills.ac) || 0;
  const acShareMap = getShare(acTotal, splits.ac || [], activeMemberIds);

  const internetTotal = parseFloat(bills.internet) || 0;
  const internetShareMap = getShare(internetTotal, splits.internet || [], activeMemberIds);

  const taxTotal = parseFloat(bills.tax) || 0;
  const taxShareMap = getShare(taxTotal, splits.tax || [], activeMemberIds);

  // 4. Combine Everything Per Person
  const grandTotal = roomTotal + totalElectricity + totalWater + acTotal + internetTotal + taxTotal;

  const personBreakdown = activeMembers.map(member => {
    const id = member.id;
    const roomShare = roomShareMap[id] || 0;
    const elecShareObj = electricityBreakdown[id] || { freezer: 0, riceCooker: 0, remainder: 0, total: 0 };
    const waterShare = waterBreakdown[id] || 0;
    const acShare = acShareMap[id] || 0;
    const internetShare = internetShareMap[id] || 0;
    const taxShare = taxShareMap[id] || 0;

    const totalOwed = roomShare + elecShareObj.total + waterShare + acShare + internetShare + taxShare;

    return {
      member,
      shares: {
        room: roomShare,
        electricity: elecShareObj.total,
        electricityDetails: elecShareObj,
        water: waterShare,
        ac: acShare,
        internet: internetShare,
        tax: taxShare
      },
      totalOwed
    };
  });

  return {
    bills: {
      room: roomTotal,
      electricity: totalElectricity,
      water: totalWater,
      ac: acTotal,
      internet: internetTotal,
      tax: taxTotal
    },
    waterCalculation: {
      mode: waterInputMode,
      m3: parseFloat(waterM3) || 0,
      rate: rates.waterM3,
      maintenance: rates.waterMaintenance,
      total: totalWater,
      mainTotal: waterMainTotal,
      otherTotal: waterOtherTotal
    },
    electricityCalculation: {
      total: totalElectricity,
      freezer: {
        kwh: freezerKwh,
        cost: freezerTotalCost,
        wattage: freezerCalc.wattage,
        hours: freezerCalc.hoursPerDay,
        memberCount: (freezerCalc.memberIds || []).length
      },
      riceCooker: {
        kwh: riceCookerKwh,
        cost: riceCookerTotalCost,
        wattage: riceCookerCalc.wattage,
        hours: riceCookerCalc.hoursPerDay,
        memberCount: (riceCookerCalc.memberIds || []).length
      },
      remainder: {
        cost: remainingElectricityCost,
        memberCount: (splits.electricityRemainder || []).length
      }
    },
    personBreakdown,
    grandTotal
  };
}
