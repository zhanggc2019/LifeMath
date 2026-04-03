const { getCityList, getCityConfig } = require('../../utils/tax');

Page({
  data: {
    income: '',
    cityList: getCityList(),
    cityIndex: 0,
    rentLevels: ['一线', '二线', '三线'],

    socialBase: '',
    socialRates: {
      pension: '8',
      medical: '2',
      unemployment: '0.5',
      maternity: '0',
      workInjury: '0'
    },

    housingBase: '',
    housingRate: '12',

    deductions: {
      childrenEducation: false,
      continuingEducation: false,
      bigDiseaseMedical: 0,
      housingLoan: false,
      housingRent: '',
      elderlySupport: false
    },
    result: null,
    showMonthlyDetails: false
  },

  /**
   * 页面加载时初始化当前城市配置。
   */
  onLoad() {
    this.applyCityConfig(this.data.cityIndex);
  },

  /**
   * 按城市应用默认社保比例与公积金比例。
   * @param {number|string} cityIndex - 城市索引
   */
  applyCityConfig(cityIndex) {
    const numericIndex = Number(cityIndex) || 0;
    const city = this.data.cityList[numericIndex];
    const config = getCityConfig(city);

    this.setData({
      cityIndex: numericIndex,
      socialRates: {
        pension: String((config.socialRates.pension * 100).toFixed(1)),
        medical: String((config.socialRates.medical * 100).toFixed(1)),
        unemployment: String((config.socialRates.unemployment * 100).toFixed(2)),
        maternity: String((config.socialRates.maternity * 100).toFixed(1)),
        workInjury: String((config.socialRates.workInjury * 100).toFixed(1))
      },
      housingRate: String((config.housingRate * 100).toFixed(1))
    });
  },

  onIncomeInput(e) {
    this.setData({ income: e.detail.value });
  },

  onCityChange(e) {
    this.applyCityConfig(e.detail.value);
  },

  onSocialBaseInput(e) {
    this.setData({ socialBase: e.detail.value });
  },

  onSocialRateInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      socialRates: { ...this.data.socialRates, [key]: e.detail.value }
    });
  },

  onHousingBaseInput(e) {
    this.setData({ housingBase: e.detail.value });
  },

  onHousingRateInput(e) {
    this.setData({ housingRate: e.detail.value });
  },

  onBigDiseaseInput(e) {
    this.setData({
      deductions: { ...this.data.deductions, bigDiseaseMedical: parseFloat(e.detail.value) || 0 }
    });
  },

  onRentChange(e) {
    const rent = ['一线', '二线', '三线'][e.detail.value];
    this.setData({
      deductions: { ...this.data.deductions, housingRent: rent }
    });
  },

  toggleDeduction(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      deductions: { ...this.data.deductions, [key]: !this.data.deductions[key] }
    });
  },

  goToIndex() {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  goToLoan() {
    wx.redirectTo({ url: '/pages/loan/index' });
  },

  goToHealth() {
    wx.redirectTo({ url: '/pages/health/index' });
  },

  formatNumber(num) {
    return Number(num).toFixed(2);
  },

  /**
   * 切换月度明细的展开状态。
   */
  toggleMonthlyDetails() {
    this.setData({
      showMonthlyDetails: !this.data.showMonthlyDetails
    });
  },

  /**
   * 将输入值转为数字，失败时使用默认值。
   * @param {string|number} value - 输入值
   * @param {number} fallback - 默认值
   * @returns {number} 转换结果
   */
  getNumberOrDefault(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  },

  /**
   * 计算完成后提示用户向下查看结果明细。
   */
  showCalculationHint() {
    wx.showToast({
      title: '计算成功，可点“查看每月明细”',
      icon: 'none',
      duration: 2200
    });
  },

  /**
   * 从错误对象中提取可读错误信息。
   * @param {object|string} error - 错误对象或字符串
   * @returns {string} 错误信息文本
   */
  getErrorMessage(error) {
    if (!error) return '';
    if (typeof error === 'string') return error;
    return error.errMsg || error.message || JSON.stringify(error);
  },

  /**
   * 将云函数错误映射为中文可读原因。
   * @param {string} errorMessage - 原始错误信息
   * @returns {string} 中文原因说明
   */
  mapCloudErrorReason(errorMessage) {
    const message = errorMessage || '';
    const codeMatch = message.match(/errCode[:：]?\s*(-?\d+)/i);
    const errCode = codeMatch ? codeMatch[1] : '';

    if (errCode.startsWith('-501')) {
      return '云环境或函数配置异常（常见是环境ID不匹配/函数未部署到当前环境）';
    }

    if (errCode === '-404011') {
      return '云函数不存在（请确认 tax 函数名和部署环境）';
    }

    if (message.includes('Environment invalid')) {
      return '云环境无效（请检查 app.js 的 env 与当前小程序环境）';
    }

    if (message.includes('permission') || message.includes('Permission')) {
      return '调用权限不足（请检查云开发权限配置）';
    }

    return '云函数调用失败';
  },

  /**
   * 展示云函数调用失败详情。
   * @param {object|string} error - 错误对象或字符串
   */
  showCloudError(error) {
    const rawMessage = this.getErrorMessage(error);
    const reason = this.mapCloudErrorReason(rawMessage);

    wx.showModal({
      title: '个税计算失败',
      content: `${reason}\n\n原始错误：${rawMessage || '无'}`,
      showCancel: false
    });
  },

  /**
   * 构造个税云函数请求参数。
   * @returns {object} 个税计算请求参数
   */
  buildTaxPayload() {
    const income = parseFloat(this.data.income) || 0;
    const city = this.data.cityList[this.data.cityIndex];
    const socialBase = parseFloat(this.data.socialBase) || income;
    const housingBase = parseFloat(this.data.housingBase) || income;

    return {
      income,
      city,
      socialBase,
      housingBase,
      socialRates: {
        pension: this.getNumberOrDefault(this.data.socialRates.pension, 8),
        medical: this.getNumberOrDefault(this.data.socialRates.medical, 2),
        unemployment: this.getNumberOrDefault(this.data.socialRates.unemployment, 0.5),
        maternity: this.getNumberOrDefault(this.data.socialRates.maternity, 0),
        workInjury: this.getNumberOrDefault(this.data.socialRates.workInjury, 0)
      },
      housingRate: this.getNumberOrDefault(this.data.housingRate, 12),
      deductions: this.data.deductions
    };
  },

  /**
   * 格式化个税云函数返回结果用于页面展示。
   * @param {object} result - 云函数返回的个税数据
   * @returns {object} 页面展示数据
   */
  formatTaxResult(result) {
    const monthlyDetails = Array.isArray(result.monthlyDetails) ? result.monthlyDetails : [];

    return {
      taxBefore: this.formatNumber(result.taxBefore),
      annualIncome: this.formatNumber((result.taxBefore || 0) * 12),
      socialInsuranceTotal: this.formatNumber(result.socialInsurance.total),
      housingFundTotal: this.formatNumber(result.housingFund.total),
      specialDeductionsTotal: this.formatNumber(result.specialDeductionsTotal),
      monthlyDeduction: this.formatNumber(result.monthlyDeduction),
      taxableIncome: this.formatNumber(result.taxableIncome),
      personalTax: this.formatNumber(result.personalTax),
      afterTaxIncome: this.formatNumber(result.afterTaxIncome),
      monthlyDetails: monthlyDetails.map(m => ({
        month: m.month,
        cumulativeIncome: this.formatNumber(m.cumulativeIncome),
        cumulativeDeduction: this.formatNumber(m.cumulativeDeduction),
        cumulativeTaxableIncome: this.formatNumber(m.cumulativeTaxableIncome),
        tax: this.formatNumber(m.tax),
        afterTax: this.formatNumber(m.afterTax)
      }))
    };
  },

  /**
   * 调用个税云函数并展示计算结果。
   */
  calculate() {
    if (!wx.cloud || !wx.cloud.callFunction) {
      wx.showToast({
        title: '云能力不可用，请检查基础库和云环境',
        icon: 'none'
      });
      return;
    }

    const payload = this.buildTaxPayload();

    if (!payload.income) {
      wx.showToast({ title: '请输入月税前工资', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '计算中...' });

    let finished = false;
    const timeoutId = setTimeout(() => {
      if (finished) return;
      finished = true;
      wx.hideLoading();
      wx.showToast({
        title: '请求超时，请检查云函数部署',
        icon: 'none'
      });
    }, 12000);

    wx.cloud.callFunction({
      name: 'tax',
      data: payload,
      success: (response) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        wx.hideLoading();

        try {
          const resultWrapper = response && response.result ? response.result : {};
          if (!resultWrapper.success || !resultWrapper.data) {
            this.showCloudError(resultWrapper.error || '个税云函数返回异常');
            return;
          }

          const formattedResult = this.formatTaxResult(resultWrapper.data);
          this.setData({ result: formattedResult, showMonthlyDetails: false }, () => {
            this.showCalculationHint();
          });
        } catch (error) {
          wx.showToast({
            title: error.message || '结果解析失败',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeoutId);
        wx.hideLoading();
        console.error('tax callFunction failed:', error);
        this.showCloudError(error);
      }
    });
  }
});
