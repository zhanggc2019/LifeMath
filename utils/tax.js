const { TAX_RATES, CITY_CONFIGS } = require('./constants');

/**
 * 计算个税 - 累计预扣法
 * @param {number} income - 月税前工资
 * @param {object} socialConfig - 社保配置 { base, rates }
 * @param {object} housingConfig - 公积金配置 { base, rate }
 * @param {object} deductions - 专项附加扣除
 * @param {string} city - 城市名称
 * @returns {object} 计算结果
 */
function calculateTax(income, socialConfig, housingConfig, deductions, city = '默认') {
  const cityConfig = getCityConfig(city);
  const socialBase = clamp(
    socialConfig.base,
    cityConfig.socialBaseMin,
    cityConfig.socialBaseMax
  );
  const housingBase = clamp(
    housingConfig.base,
    cityConfig.housingBaseMin,
    cityConfig.housingBaseMax
  );

  // 计算月度社保
  const socialInsurance = calcSocialInsurance(socialBase, socialConfig.rates);

  // 计算月度公积金
  const housingFund = calcHousingFund(housingBase, housingConfig.rate);

  // 月度专项附加扣除（按月）
  const monthlySpecialDeductions = calcMonthlySpecialDeductions(deductions);

  // 每月扣款
  const monthlyDeduction = socialInsurance.total + housingFund.total;

  // 生成12个月明细（累计预扣法）
  const monthlyDetails = [];
  let cumulativeTax = 0; // 累计已预扣税额

  for (let i = 1; i <= 12; i++) {
    // 累计收入
    const cumulativeIncome = income * i;

    // 累计扣除
    const cumulativeDeduction = monthlyDeduction * i + monthlySpecialDeductions * i + 5000 * i;

    // 累计应纳税所得额
    const cumulativeTaxableIncome = Math.max(0, cumulativeIncome - cumulativeDeduction);

    // 累计预扣税额
    const cumulativeTaxToPay = calcCumulativeTax(cumulativeTaxableIncome);

    // 本月应预扣税额 = 累计预扣税额 - 已累计预扣税额
    const monthTax = cumulativeTaxToPay - cumulativeTax;
    cumulativeTax = cumulativeTaxToPay;

    // 本月到手
    const monthAfterTax = income - monthlyDeduction - monthTax;

    monthlyDetails.push({
      month: i,
      cumulativeIncome: cumulativeIncome,
      cumulativeDeduction: cumulativeDeduction,
      cumulativeTaxableIncome: cumulativeTaxableIncome,
      tax: monthTax,
      afterTax: monthAfterTax
    });
  }

  // 年度汇总
  const annualTax = cumulativeTax;
  const annualAfterTax = income * 12 - monthlyDeduction * 12 - annualTax;

  // 月度应纳税所得额（首月）
  const firstMonthTaxableIncome = Math.max(0, income - monthlyDeduction - monthlySpecialDeductions - 5000);

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
 * 计算累计预扣税额
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
 * 计算月度社保
 */
function calcSocialInsurance(base, rates) {
  const pension = base * (rates.pension || 0.08);
  const medical = base * (rates.medical || 0.02);
  const unemployment = base * (rates.unemployment || 0.005);
  const maternity = base * (rates.maternity || 0);
  const workInjury = base * (rates.workInjury || 0);

  const total = pension + medical + unemployment + maternity + workInjury;

  return { base, pension, medical, unemployment, maternity, workInjury, total };
}

/**
 * 计算月度公积金
 */
function calcHousingFund(base, rate) {
  const total = base * rate;
  return { base, rate, total };
}

/**
 * 将数值限制在指定区间内。
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * 计算月度专项附加扣除
 */
function calcMonthlySpecialDeductions(deductions) {
  let total = 0;

  if (deductions.childrenEducation) total += 2000;
  if (deductions.continuingEducation) total += 400;
  if (deductions.housingLoan) total += 1000;
  if (deductions.elderlySupport) total += 2000;

  if (deductions.bigDiseaseMedical) {
    total += Math.min(deductions.bigDiseaseMedical / 12, 80000 / 12);
  }

  if (deductions.housingRent) {
    const rentMap = { '一线': 1500, '二线': 1100, '三线': 800 };
    total += rentMap[deductions.housingRent] || 800;
  }

  return total;
}

/**
 * 获取城市列表
 */
function getCityList() {
  const preferredCities = ['北京', '上海', '广州', '深圳'];
  return preferredCities.filter(city => CITY_CONFIGS[city]);
}

/**
 * 获取城市配置
 */
function getCityConfig(city) {
  return CITY_CONFIGS[city] || CITY_CONFIGS['默认'];
}

module.exports = {
  calculateTax,
  calcSocialInsurance,
  calcHousingFund,
  getCityList,
  getCityConfig
};
