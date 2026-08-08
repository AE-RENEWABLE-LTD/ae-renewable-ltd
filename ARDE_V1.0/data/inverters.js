// =========================================
// AE Renewable Solar Design Engine
// Inverter Database
//
// inverter.JS
// =========================================

export const inverters = [
  // -----------------------------------------
  // FELICITY SOLAR INVERTERS (3.5kVA - 12kVA)
  // -----------------------------------------
  {
    id: 1,
    brand: "Felicity",
    model: "IVEM3024",
    inverterSize: 3500,
    phase: 1,
    maxPvWatt: 4000,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 40,
    mppt: 1,
    stringsPerMppt: 1,
    batteryVoltage: 24,
    price: 450000
  },
  {
    id: 2,
    brand: "Felicity",
    model: "IVEM6048 ",
    inverterSize: 6000,
    phase: 1,
    maxPvWatt: 7500,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 80,
    mppt: 1,
    stringsPerMppt: 2,
    batteryVoltage: 48,
    price: 750000
  },
  {
    id: 3,
    brand: "Felicity",
    model: "IVEM8048 ",
    inverterSize: 8000,
    phase: 1,
    maxPvWatt: 10000,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 100,
    mppt: 1,
    stringsPerMppt: 2,
    batteryVoltage: 48,
    price: 1100000
  },
  {
    id: 4,
    brand: "Felicity",
    model: "IVEM12048 ",
    inverterSize: 12000,
    phase: 1,
    maxPvWatt: 15000,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 100,
    mppt: 2,
    stringsPerMppt: 2,
    batteryVoltage: 48,
    price: 1350000
  },
  {
    id: 5,
    brand: "Felicity",
    model: "IVGM20KLP3G1",
    inverterSize: 20000,
    phase: 3,
    maxPvWatt: 32000,
    inverterPvVoltage: 800,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 120,
    mppt: 2,
    stringsPerMppt: 4,
    batteryVoltage: 48,
    price: 1650000
  },












  // -----------------------------------------
  // FIRMAN INVERTERS / GENERATOR SOURCES (1kVA - 11kVA)
  // -----------------------------------------
  // {
  //   id: 7,
  //   brand: "Firman",
  //   model: "FIR-1K-SG01LP1",
  //   inverterSize: 1000,
  //   phase: 1,
  //   maxPvWatt: 400,
  //   inverterPvVoltage: 60,
  //   inverterAcVoltage: 230,
  //   maxACChargeCurrent: 20,
  //   mppt: 1,
  //   stringsPerMppt: 1,
  //   batteryVoltage: 12,
  //   price: 180000
  // },
  // {
  //   id: 8,
  //   brand: "Firman",
  //   model: "FIR-2K-SG02LP1",
  //   inverterSize: 2000,
  //   phase: 1,
  //   maxPvWatt: 2500,
  //   inverterPvVoltage: 300,
  //   inverterAcVoltage: 230,
  //   maxACChargeCurrent: 30,
  //   mppt: 1,
  //   stringsPerMppt: 1,
  //   batteryVoltage: 24,
  //   price: 320000
  // },
  {
    id: 9,
    brand: "Firman",
    model: "FH03K0110 ",
    inverterSize: 3000,
    phase: 1,
    maxPvWatt: 4000,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 40,
    mppt: 1,
    stringsPerMppt: 1,
    batteryVoltage: 24,
    price: 520000
  },
  {
    id: 10,
    brand: "Firman",
    model: "FIR-5K-SG04LP1",
    inverterSize: 5000,
    phase: 1,
    maxPvWatt: 5500,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 60,
    mppt: 1,
    stringsPerMppt: 1,
    batteryVoltage: 48,
    price: 780000
  },
  // {
  //   id: 11,
  //   brand: "Firman",
  //   model: "FIR-7.5K-SG04LP1",
  //   inverterSize: 7500,
  //   phase: 1,
  //   maxPvWatt: 9500,
  //   inverterPvVoltage: 500,
  //   inverterAcVoltage: 230,
  //   maxACChargeCurrent: 80,
  //   mppt: 2,
  //   stringsPerMppt: 1,
  //   batteryVoltage: 48,
  //   price: 1150000
  // },
  // {
  //   id: 12,
  //   brand: "Firman",
  //   model: "FIR-9K-SG04LP1",
  //   inverterSize: 9000,
  //   phase: 1,
  //   maxPvWatt: 11500,
  //   inverterPvVoltage: 500,
  //   inverterAcVoltage: 230,
  //   maxACChargeCurrent: 100,
  //   mppt: 2,
  //   stringsPerMppt: 2,
  //   batteryVoltage: 48,
  //   price: 1420000
  // },
  {
    id: 13,
    brand: "Firman",
    model: "FIR-11K-SG04LP3",
    inverterSize: 11000,
    phase: 1,
    maxPvWatt: 11000,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 100,
    mppt: 2,
    stringsPerMppt: 2,
    batteryVoltage: 48,
    price: 1850000
  },

  // -----------------------------------------
  // DEYE HYBRID INVERTERS (6kVA - 80kVA)
  // -----------------------------------------
  {
    id: 14,
    brand: "Deye",
    model: "SUN-6K-SG04LP1",
    inverterSize: 6000,
    phase: 1,
    maxPvWatt: 7800,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 40,
    mppt: 2,
    stringsPerMppt: 1,
    batteryVoltage: 48,
    price: 950000
  },
  {
    id: 15,
    brand: "Deye",
    model: "SUN-8K-SG01LP1",
    inverterSize: 8000,
    phase: 1,
    maxPvWatt: 10400,
    inverterPvVoltage: 500,
    inverterAcVoltage: 230,
    maxACChargeCurrent: 60,
    mppt: 2,
    stringsPerMppt: 1,
    batteryVoltage: 48,
    price: 1700000
  },
  {
    id: 16,
    brand: "Deye",
    model: "SUN-10K-SG04LP3",
    inverterSize: 10000,
    phase: 1,
    maxPvWatt: 13000,
    inverterPvVoltage: 650,
    inverterAcVoltage: 220,
    maxACChargeCurrent: 80,
    mppt: 2,
    stringsPerMppt: 2,
    batteryVoltage: 48,
    price: 2100000
  },
  {
    id: 17,
    brand: "Deye",
    model: "SUN-12K-SG04LP3",
    inverterSize: 12000,
    phase: 1,
    maxPvWatt: 15600,
    inverterPvVoltage: 500,
    inverterAcVoltage: 220,
    maxACChargeCurrent: 100,
    mppt: 2,
    stringsPerMppt: 2,
    batteryVoltage: 48,
    price: 2500000
  },
  {
    id: 18,
    brand: "Deye",
    model: "SUN-16K-SG01HP3",
    inverterSize: 16000,
    phase: 1,
    maxPvWatt: 20800,
    inverterPvVoltage: 500,
    inverterAcVoltage: 220,
    maxACChargeCurrent: 100,
    mppt: 2,
    stringsPerMppt: 4,
    batteryVoltage: 150,
    price: 3600000
  },
  {
    id: 19,
    brand: "Deye",
    model: "SUN-20K-SG01HP3",
    inverterSize: 20000,
    phase: 3,
    maxPvWatt: 32000,
    inverterPvVoltage: 800,
    inverterAcVoltage: 400,
    maxACChargeCurrent: 120,
    mppt: 2,
    stringsPerMppt: 4,
    batteryVoltage: 48,
    price: 4300000
  },
  {
    id: 20,
    brand: "Deye",
    model: "SUN-30K-SG01HP3",
    inverterSize: 30000,
    phase: 3,
    maxPvWatt: 48000,
    inverterPvVoltage: 800,
    inverterAcVoltage: 400,
    maxACChargeCurrent: 120,
    mppt: 3,
    stringsPerMppt: 6,
    batteryVoltage: 300,
    price: 5800000
  },
  {
    id: 21,
    brand: "Deye",
    model: "SUN-50K-SG01HP3",
    inverterSize: 50000,
    phase: 3,
    maxPvWatt: 65000,
    inverterPvVoltage: 1000,
    inverterAcVoltage: 400,
    maxACChargeCurrent: 150,
    mppt: 4,
    stringsPerMppt: 8,
    batteryVoltage: 160,
    price: 8500000
  },
  {
    id: 22,
    brand: "Deye",
    model: "SUN-80K-SG01HP3",
    inverterSize: 80000,
    phase: 3,
    maxPvWatt: 128000,
    inverterPvVoltage: 1000,
    inverterAcVoltage: 400,
    maxACChargeCurrent: 180,
    mppt: 6,
    stringsPerMppt: 12,
    batteryVoltage: 160,
    price: 12800000
  }
];