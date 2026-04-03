// 云函数入口文件
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

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
    socialBaseMin: 3000, socialBaseMax: 25000, housingBaseMin: 2000, housingBaseMax: 25000,
    socialRates: { pension: 0.08, medical: 0.02, unemployment: 0.005, maternity: 0, workInjury: 0 },
    housingRate: 0.12
  },
  '上海': {
    socialBaseMin: 4927, socialBaseMax: 28017, housingBaseMin: 2500, housingBaseMax: 25000,
    socialRates: { pension: 0.08, medical: 0.02, unemployment: 0.005, maternity: 0.005, workInjury: 0.002 },
    housingRate: 0.07
  },
  '北京': {
    socialBaseMin: 5080, socialBaseMax: 25401, housingBaseMin: 2500, housingBaseMax: 35811,
    socialRates: { pension: 0.08, medical: 0.02, unemployment: 0.005, maternity: 0, workInjury: 0.002 },
    housingRate: 0.12
  },
  '广州': {
    socialBaseMin: 2300, socialBaseMax: 38082, housingBaseMin: 2300, housingBaseMax: 38082,
    socialRates: { pension: 0.08, medical: 0.02, unemployment: 0.005, maternity: 0, workInjury: 0 },
    housingRate: 0.12
  },
  '深圳': {
    socialBaseMin: 2200, socialBaseMax: 25044, housingBaseMin: 2200, housingBaseMax: 25044,
    socialRates: { pension: 0.08, medical: 0.02, unemployment: 0.005, maternity: 0.005, workInjury: 0.004 },
    housingRate: 0.12
  }
};

/**
 * 安全转换为数字，失败时返回默认值。
 * @param {number|string} value - 输入值
 * @param {number} fallback - 默认值
 * @returns {number} 数字结果
 */
function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * 将社保比例标准化为小数（支持 8/0.08、0.5/0.005、0.2/0.002）。
 * @param {number|string|undefined} value - 输入比例
 * @param {number} fallback - 默认比例
 * @returns {number} 标准化后的比例
 */
function toSocialRatio(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num === 0) return 0;
  if (num > 1) return num / 100;
  if (num > 0.15) return num / 100;
  return num;
}

/**
 * 将公积金比例标准化为小数（支持 12 或 0.12 两种输入）。
 * @param {number|string|undefined} value - 输入比例
 * @param {number} fallback - 默认比例
 * @returns {number} 标准化后的比例
 */
function toHousingRatio(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  if (num === 0) return 0;
  return num > 1 ? num / 100 : num;
}

/**
 * 将数值限制在最小和最大值之间。
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * 计算累计应纳税额（年度累计预扣法）。
 * @param {number} cumulativeTaxableIncome - 累计应纳税所得额
 * @returns {number} 累计应纳税额
 */
function calcCumulativeTax(cumulativeTaxableIncome) {
  for (const tier of TAX_RATES) {
    if (cumulativeTaxableIncome <= tier.max) {
      return cumulativeTaxableIncome * tier.rate - tier.deduction;
    }
  }
  return 0;
}

/**
 * 计算月度社保缴纳额（个人部分）。
 * @param {number} base - 社保基数
 * @param {object} rates - 社保比例配置
 * @returns {object} 月度社保明细
 */
function calcSocialInsurance(base, rates) {
  const pension = base * rates.pension;
  const medical = base * rates.medical;
  const unemployment = base * rates.unemployment;
  const maternity = base * rates.maternity;
  const workInjury = base * rates.workInjury;
  const total = pension + medical + unemployment + maternity + workInjury;

  return { base, pension, medical, unemployment, maternity, workInjury, total };
}

/**
 * 计算月度公积金（个人部分）。
 * @param {number} base - 公积金基数
 * @param {number} rate - 公积金比例
 * @returns {object} 月度公积金明细
 */
function calcHousingFund(base, rate) {
  const total = base * rate;
  return { base, rate, total };
}

/**
 * 计算月度专项附加扣除合计。
 * @param {object} deductions - 专项附加扣除配置
 * @returns {number} 月度专项附加扣除
 */
function calcMonthlySpecialDeductions(deductions = {}) {
  let total = 0;
  if (deductions.childrenEducation) total += 2000;
  if (deductions.continuingEducation) total += 400;
  if (deductions.housingLoan) total += 1000;
  if (deductions.elderlySupport) total += 2000;

  if (deductions.bigDiseaseMedical) {
    total += Math.min(toNumber(deductions.bigDiseaseMedical, 0) / 12, 80000 / 12);
  }

  if (deductions.housingRent) {
    total += { '一线': 1500, '二线': 1100, '三线': 800 }[deductions.housingRent] || 800;
  }

  return total;
}

/**
 * 计算个税结果（按月工资输入，采用年度累计预扣法）。
 * @param {object} payload - 云函数输入参数
 * @param {number|string} payload.income - 月税前工资
 * @param {number|string} [payload.socialBase] - 社保基数
 * @param {number|string} [payload.housingBase] - 公积金基数
 * @param {object} [payload.socialRates] - 社保比例（支持百分数或小数）
 * @param {number|string} [payload.housingRate] - 公积金比例（支持百分数或小数）
 * @param {object} [payload.deductions] - 专项附加扣除
 * @param {string} [payload.city='默认'] - 城市
 * @returns {object} 计算结果
 */
function calculateTax(payload) {
  const income = toNumber(payload.income, 0);
  const city = payload.city || '默认';
  const cityConfig = CITY_CONFIGS[city] || CITY_CONFIGS['默认'];
  const deductions = payload.deductions || {};
  const inputSocialRates = payload.socialRates || {};

  const socialBaseInput = toNumber(payload.socialBase, income);
  const housingBaseInput = toNumber(payload.housingBase, income);

  const socialBase = clamp(socialBaseInput, cityConfig.socialBaseMin, cityConfig.socialBaseMax);
  const housingBase = clamp(housingBaseInput, cityConfig.housingBaseMin, cityConfig.housingBaseMax);

  const socialRates = {
    pension: toSocialRatio(inputSocialRates.pension, cityConfig.socialRates.pension),
    medical: toSocialRatio(inputSocialRates.medical, cityConfig.socialRates.medical),
    unemployment: toSocialRatio(inputSocialRates.unemployment, cityConfig.socialRates.unemployment),
    maternity: toSocialRatio(inputSocialRates.maternity, cityConfig.socialRates.maternity),
    workInjury: toSocialRatio(inputSocialRates.workInjury, cityConfig.socialRates.workInjury)
  };
  const housingRate = toHousingRatio(payload.housingRate, cityConfig.housingRate);

  const socialInsurance = calcSocialInsurance(socialBase, socialRates);
  const housingFund = calcHousingFund(housingBase, housingRate);
  const monthlySpecialDeductions = calcMonthlySpecialDeductions(deductions);
  const monthlyDeduction = socialInsurance.total + housingFund.total;

  const monthlyDetails = [];
  let cumulativeTax = 0;

  for (let month = 1; month <= 12; month++) {
    const cumulativeIncome = income * month;
    const cumulativeDeduction = (monthlyDeduction + monthlySpecialDeductions + 5000) * month;
    const cumulativeTaxableIncome = Math.max(0, cumulativeIncome - cumulativeDeduction);
    const cumulativeTaxToPay = calcCumulativeTax(cumulativeTaxableIncome);
    const monthTax = cumulativeTaxToPay - cumulativeTax;
    cumulativeTax = cumulativeTaxToPay;
    const monthAfterTax = income - monthlyDeduction - monthTax;

    monthlyDetails.push({
      month,
      cumulativeIncome,
      cumulativeDeduction,
      cumulativeTaxableIncome,
      tax: monthTax,
      afterTax: monthAfterTax
    });
  }

  const firstMonthTaxableIncome = Math.max(0, income - monthlyDeduction - monthlySpecialDeductions - 5000);
  const annualTax = cumulativeTax;
  const annualAfterTax = income * 12 - monthlyDeduction * 12 - annualTax;

  return {
    city,
    socialInsurance,
    housingFund,
    monthlyDeduction,
    specialDeductionsTotal: monthlySpecialDeductions,
    taxableIncome: firstMonthTaxableIncome,
    personalTax: annualTax,
    afterTaxIncome: annualAfterTax,
    taxBefore: income,
    monthlyDetails
  };
}

// 云函数入口
exports.main = async (event, context) => {
  try {
    const result = calculateTax(event || {});
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
