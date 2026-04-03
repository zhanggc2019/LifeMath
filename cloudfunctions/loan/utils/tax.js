const { TAX_RATES, CITY_CONFIGS } = require('./constants');

/**
 * 计算个税（综合所得年度累计预扣法）。
 * @param {number} income - 月税前工资
 * @param {number} socialBase - 社保基数
 * @param {number} housingBase - 公积金基数
 * @param {object} deductions - 专项附加扣除
 * @param {string} city - 城市名称
 * @returns {object} 个税计算结果
 */
function calculateTax(income, socialBase, housingBase, deductions, city = '默认') {
  const cityConfig = getCityConfig(city);
  const socialInsurance = calcSocialInsurance(socialBase, cityConfig);
  const housingFund = calcHousingFund(housingBase, cityConfig);
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

/**
 * 计算累计应纳税额。
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
 * 计算社保（个人部分）。
 * @param {number} base - 社保基数
 * @param {object} cityConfig - 城市配置
 * @returns {object} 社保明细
 */
function calcSocialInsurance(base, cityConfig) {
  const { socialBaseMin, socialBaseMax, socialRates } = cityConfig;
  const socialBase = Math.max(socialBaseMin, Math.min(base, socialBaseMax));

  const pension = socialBase * socialRates.pension;
  const medical = socialBase * socialRates.medical;
  const unemployment = socialBase * socialRates.unemployment;
  const maternity = socialBase * socialRates.maternity;
  const workInjury = socialBase * socialRates.workInjury;
  const total = pension + medical + unemployment + maternity + workInjury;

  return { base: socialBase, pension, medical, unemployment, maternity, workInjury, total };
}

/**
 * 计算公积金（个人部分）。
 * @param {number} base - 公积金基数
 * @param {object} cityConfig - 城市配置
 * @returns {object} 公积金明细
 */
function calcHousingFund(base, cityConfig) {
  const { housingBaseMin, housingBaseMax, housingRate } = cityConfig;
  const baseValue = Math.max(housingBaseMin, Math.min(base, housingBaseMax));
  const total = baseValue * housingRate;

  return { base: baseValue, rate: housingRate, total };
}

/**
 * 计算月度专项附加扣除。
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
    total += Math.min(Number(deductions.bigDiseaseMedical) / 12, 80000 / 12);
  }

  if (deductions.housingRent) {
    const rentMap = { '一线': 1500, '二线': 1100, '三线': 800 };
    total += rentMap[deductions.housingRent] || 800;
  }

  return total;
}

/**
 * 获取城市列表。
 * @returns {array} 城市列表
 */
function getCityList() {
  const preferredCities = ['北京', '上海', '广州', '深圳'];
  return preferredCities.filter(city => CITY_CONFIGS[city]);
}

/**
 * 获取城市配置。
 * @param {string} city - 城市名称
 * @returns {object} 城市配置
 */
function getCityConfig(city) {
  return CITY_CONFIGS[city] || CITY_CONFIGS['默认'];
}

module.exports = {
  calculateTax,
  calcSocialInsurance,
  calcHousingFund,
  calcCumulativeTax,
  getCityList,
  getCityConfig
};
