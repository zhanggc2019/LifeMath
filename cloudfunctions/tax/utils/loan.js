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

  const details = [];
  for (let i = 0; i < commercialParams.months; i++) {
    details.push({
      month: i + 1,
      payment: Math.round((commercial.details[i].payment + gjj.details[i].payment) * 100) / 100,
      principal: Math.round((commercial.details[i].principal + gjj.details[i].principal) * 100) / 100,
      interest: Math.round((commercial.details[i].interest + gjj.details[i].interest) * 100) / 100,
      balance: Math.max(0, Math.round((commercial.details[i].balance + gjj.details[i].balance) * 100) / 100)
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
    monthlyPayment: Math.round((commercial.monthlyPayment + gjj.monthlyPayment) * 100) / 100,
    firstPayment: Math.round((commercial.firstPayment + gjj.firstPayment) * 100) / 100,
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
