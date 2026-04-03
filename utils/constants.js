// 个税税率表（综合所得年度累计预扣法）
const TAX_RATES = [
  { max: 36000, rate: 0.03, deduction: 0 },
  { max: 144000, rate: 0.10, deduction: 2520 },
  { max: 300000, rate: 0.20, deduction: 16920 },
  { max: 420000, rate: 0.25, deduction: 31920 },
  { max: 660000, rate: 0.30, deduction: 52920 },
  { max: 960000, rate: 0.35, deduction: 85920 },
  { max: Infinity, rate: 0.45, deduction: 181920 }
];

// 城市社保公积金配置
const CITY_CONFIGS = {
  '默认': {
    socialBaseMin: 3000,
    socialBaseMax: 25000,
    housingBaseMin: 2000,
    housingBaseMax: 25000,
    socialRates: {
      pension: 0.08,
      medical: 0.02,
      unemployment: 0.005,
      maternity: 0,
      workInjury: 0
    },
    housingRate: 0.12
  },
  '上海': {
    socialBaseMin: 4927,
    socialBaseMax: 28017,
    housingBaseMin: 2500,
    housingBaseMax: 25000,
    socialRates: {
      pension: 0.08,
      medical: 0.02,
      unemployment: 0.005,
      maternity: 0.005,
      workInjury: 0.002
    },
    housingRate: 0.07
  },
  '北京': {
    socialBaseMin: 5080,
    socialBaseMax: 25401,
    housingBaseMin: 2500,
    housingBaseMax: 35811,
    socialRates: {
      pension: 0.08,
      medical: 0.02,
      unemployment: 0.005,
      maternity: 0,
      workInjury: 0.002
    },
    housingRate: 0.12
  },
  '广州': {
    socialBaseMin: 2300,
    socialBaseMax: 38082,
    housingBaseMin: 2300,
    housingBaseMax: 38082,
    socialRates: {
      pension: 0.08,
      medical: 0.02,
      unemployment: 0.005,
      maternity: 0,
      workInjury: 0
    },
    housingRate: 0.12
  },
  '深圳': {
    socialBaseMin: 2200,
    socialBaseMax: 25044,
    housingBaseMin: 2200,
    housingBaseMax: 25044,
    socialRates: {
      pension: 0.08,
      medical: 0.02,
      unemployment: 0.005,
      maternity: 0.005,
      workInjury: 0.004
    },
    housingRate: 0.12
  }
};

module.exports = {
  TAX_RATES,
  CITY_CONFIGS
};
