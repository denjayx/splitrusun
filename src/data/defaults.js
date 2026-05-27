// Default values for 222Splits app

export const DEFAULT_MEMBERS = [
  { id: 'deni', name: 'Deni', isMain: true },
  { id: 'zandi', name: 'Zandi', isMain: true },
  { id: 'baren', name: 'Baren', isMain: false },
  { id: 'ricki', name: 'Ricki', isMain: false },
  { id: 'zul', name: 'Zul', isMain: false },
  { id: 'vito', name: 'Vito', isMain: false }
];

export const DEFAULT_RATES = {
  electricityKwh: 1262, // IDR per kWh
  waterM3: 7500,       // IDR per m3
  waterMaintenance: 10500 // IDR flat fee
};

export const DEFAULT_DEVICES = {
  freezer: {
    wattage: 40.3,
    hoursPerDay: 24,
    enabled: true
  },
  riceCooker: {
    wattage: 300,
    hoursPerDay: 2.5, // 2-3 hours average
    enabled: true
  }
};
