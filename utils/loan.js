/**
 * 贷款计算工具
 */

/**
 * 等额本金计算
 */
function calcEqualPrincipal(principal, annualRate, months) {
  const monthlyRate = annualRate / 12;
  let totalInterest = 0;
  let balance = principal;
  const details = [];

  for (let i = 0; i < months; i++) {
    const principalPaid = principal / months;
    const interest = balance * monthlyRate;
    const payment = principalPaid + interest;
    balance -= principalPaid;
    totalInterest += interest;

    details.push({
      month: i + 1,
      payment: Math.round(payment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100)
    });
  }

  return {
    type: '等额本金',
    principal,
    annualRate,
    months,
    monthlyPayment: Math.round((principal / months + principal * monthlyRate) * 100) / 100,
    firstPayment: Math.round((principal / months + principal * monthlyRate) * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round((principal + totalInterest) * 100) / 100,
    details
  };
}

/**
 * 等额本息计算
 */
function calcEqualPrincipalInterest(principal, annualRate, months) {
  const monthlyRate = annualRate / 12;
  const factor = Math.pow(1 + monthlyRate, months);
  const monthlyPayment = principal * (monthlyRate * factor) / (factor - 1);

  let balance = principal;
  const details = [];

  for (let i = 0; i < months; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyPayment - interest;
    balance -= principalPaid;

    details.push({
      month: i + 1,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.max(0, Math.round(balance * 100) / 100)
    });
  }

  const totalInterest = monthlyPayment * months - principal;

  return {
    type: '等额本息',
    principal,
    annualRate,
    months,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    firstPayment: Math.round(monthlyPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round((principal + totalInterest) * 100) / 100,
    details
  };
}

/**
 * 商业贷款计算
 */
function calcCommercialLoan(params) {
  const { principal, annualRate, months, type } = params;

  if (type === '等额本金') {
    return calcEqualPrincipal(principal, annualRate, months);
  } else {
    return calcEqualPrincipalInterest(principal, annualRate, months);
  }
}

/**
 * 公积金贷款计算
 */
function calcGJJLoan(params) {
  const { principal, annualRate, months, type } = params;

  if (type === '等额本金') {
    return calcEqualPrincipal(principal, annualRate, months);
  } else {
    return calcEqualPrincipalInterest(principal, annualRate, months);
  }
}

/**
 * 组合贷款计算
 */
function calcComboLoan(commercialParams, gjjParams) {
  const commercial = calcCommercialLoan(commercialParams);
  const gjj = calcGJJLoan(gjjParams);

  /**
   * 获取指定月份的还款明细，不存在时返回0值占位。
   * @param {array} details - 还款明细数组
   * @param {number} index - 月份索引
   * @returns {object} 月度明细
   */
  function getMonthDetail(details, index) {
    return details[index] || { payment: 0, principal: 0, interest: 0, balance: 0 };
  }

  const details = [];
  const totalMonths = Math.max(commercial.details.length, gjj.details.length);

  for (let i = 0; i < totalMonths; i++) {
    const commercialDetail = getMonthDetail(commercial.details, i);
    const gjjDetail = getMonthDetail(gjj.details, i);

    details.push({
      month: i + 1,
      payment: Math.round((commercialDetail.payment + gjjDetail.payment) * 100) / 100,
      principal: Math.round((commercialDetail.principal + gjjDetail.principal) * 100) / 100,
      interest: Math.round((commercialDetail.interest + gjjDetail.interest) * 100) / 100,
      balance: Math.max(0, Math.round((commercialDetail.balance + gjjDetail.balance) * 100) / 100)
    });
  }

  return {
    type: '组合贷款',
    commercial: {
      principal: commercial.principal,
      annualRate: commercial.annualRate,
      result: commercial
    },
    gjj: {
      principal: gjj.principal,
      annualRate: gjj.annualRate,
      result: gjj
    },
    monthlyPayment: details.length ? details[0].payment : 0,
    firstPayment: details.length ? details[0].payment : 0,
    totalInterest: Math.round((commercial.totalInterest + gjj.totalInterest) * 100) / 100,
    totalPayment: Math.round((commercial.totalPayment + gjj.totalPayment) * 100) / 100,
    details
  };
}

module.exports = {
  calcEqualPrincipal,
  calcEqualPrincipalInterest,
  calcCommercialLoan,
  calcGJJLoan,
  calcComboLoan
};
