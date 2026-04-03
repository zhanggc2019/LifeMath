// 云函数入口文件
const cloud = require('wx-server-sdk');
const { calcCommercialLoan, calcGJJLoan, calcComboLoan } = require('./utils/loan');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

/**
 * 将输入值转换为数字。
 * @param {number|string} value - 输入值
 * @returns {number} 转换后的数字
 */
function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/**
 * 构造标准贷款参数对象。
 * @param {object} payload - 贷款输入参数
 * @returns {object} 标准化参数
 */
function buildLoanParams(payload = {}) {
  return {
    principal: toNumber(payload.principal),
    annualRate: toNumber(payload.annualRate) / 100,
    months: toNumber(payload.months),
    type: payload.repaymentType || payload.type || '等额本息'
  };
}

// 云函数入口
exports.main = async (event, context) => {
  const { type, commercial, gjj } = event || {};

  try {
    let result;

    if (type === 'commercial') {
      result = calcCommercialLoan(buildLoanParams(commercial));
    } else if (type === 'gjj') {
      result = calcGJJLoan(buildLoanParams(gjj));
    } else if (type === 'combo') {
      result = calcComboLoan(
        buildLoanParams(commercial),
        buildLoanParams(gjj)
      );
    } else {
      return { success: false, error: '不支持的贷款类型' };
    }

    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
