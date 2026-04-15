const {
  enablePageShare,
  buildShareAppMessage,
  buildShareTimeline
} = require('../../utils/share');

Page({
  data: {
    loanTypes: ['商业贷款', '公积金贷款', '组合贷款'],
    repaymentTypes: ['等额本息', '等额本金'],
    yearsList: [5, 10, 15, 20, 25, 30],

    lprConfig: {
      oneYear: '3.00',
      fiveYear: '3.50',
      updatedAt: '2026-03-20'
    },

    loanTypeIndex: 0,
    repaymentTypeIndex: 0,

    commercialAmount: '',
    commercialBasisPoints: '0',
    commercialBaseLpr: '3.50',
    commercialRate: '3.50',
    commercialYears: 30,
    commercialYearsIndex: 5,

    gjjAmount: '',
    gjjRate: '2.60',
    gjjYears: 30,
    gjjYearsIndex: 5,

    result: null
  },

  /**
   * 页面初始化时同步 LPR 与公积金默认利率。
   */
  onLoad() {
    enablePageShare();
    this.syncCommercialRateByLpr();
    this.syncGjjRateByYears(this.data.gjjYears);
  },

  setLoanType(e) {
    this.setData({ loanTypeIndex: e.currentTarget.dataset.index, result: null });
  },

  setRepaymentType(e) {
    this.setData({ repaymentTypeIndex: e.currentTarget.dataset.index, result: null });
  },

  onCommercialAmountInput(e) {
    this.setData({ commercialAmount: e.detail.value });
  },

  /**
   * 更新 LPR 输入并同步商贷执行利率。
   * @param {object} e - 输入事件
   */
  onLprInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData(
      {
        lprConfig: {
          ...this.data.lprConfig,
          [key]: e.detail.value
        }
      },
      () => this.syncCommercialRateByLpr()
    );
  },

  /**
   * 更新商贷 LPR 加点（BP）并同步执行利率。
   * @param {object} e - 输入事件
   */
  onCommercialBasisPointsInput(e) {
    this.setData(
      { commercialBasisPoints: e.detail.value },
      () => this.syncCommercialRateByLpr()
    );
  },

  onCommercialYearsChange(e) {
    const index = e.detail.value;
    this.setData({
      commercialYears: this.data.yearsList[index],
      commercialYearsIndex: index
    }, () => this.syncCommercialRateByLpr());
  },

  onGjjAmountInput(e) {
    this.setData({ gjjAmount: e.detail.value });
  },

  onGjjRateInput(e) {
    this.setData({ gjjRate: e.detail.value });
  },

  onGjjYearsChange(e) {
    const index = e.detail.value;
    this.setData({
      gjjYears: this.data.yearsList[index],
      gjjYearsIndex: index
    }, () => this.syncGjjRateByYears(this.data.gjjYears));
  },

  /**
   * 根据商贷年限获取对应的 LPR 基准利率。
   * @param {number} years - 贷款年限
   * @returns {number} LPR 基准利率（百分比）
   */
  getCommercialBaseLprByYears(years) {
    const numericYears = Number(years) || 0;
    const { oneYear, fiveYear } = this.data.lprConfig;
    const oneYearRate = parseFloat(oneYear) || 0;
    const fiveYearRate = parseFloat(fiveYear) || 0;
    return numericYears <= 5 ? oneYearRate : fiveYearRate;
  },

  /**
   * 按“LPR + 加点(BP)”规则刷新商贷执行年利率。
   */
  syncCommercialRateByLpr() {
    const baseLpr = this.getCommercialBaseLprByYears(this.data.commercialYears);
    const basisPoints = parseFloat(this.data.commercialBasisPoints) || 0;
    const finalRate = Math.max(0, baseLpr + basisPoints / 100);

    this.setData({
      commercialBaseLpr: finalRate ? baseLpr.toFixed(2) : '0.00',
      commercialRate: finalRate.toFixed(2)
    });
  },

  /**
   * 按首套公积金贷款口径设置默认利率。
   * @param {number} years - 公积金贷款年限
   */
  syncGjjRateByYears(years) {
    const numericYears = Number(years) || 0;
    const gjjRate = numericYears <= 5 ? '2.10' : '2.60';
    this.setData({ gjjRate });
  },

  formatNumber(num) {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  goToIndex() {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  goToTax() {
    wx.redirectTo({ url: '/pages/tax/index' });
  },

  goToHealth() {
    wx.redirectTo({ url: '/pages/health/index' });
  },

  /**
   * 构造贷款云函数请求参数。
   * @returns {object} 贷款计算请求参数
   */
  buildLoanPayload() {
    const { loanTypeIndex, repaymentTypeIndex, commercialAmount, commercialRate, commercialYears, gjjAmount, gjjRate, gjjYears } = this.data;
    const repaymentType = this.data.repaymentTypes[repaymentTypeIndex];
    const commercialMonths = commercialYears * 12;
    const gjjMonths = gjjYears * 12;
    const loanType = this.data.loanTypes[loanTypeIndex];

    if (loanType === '商业贷款') {
      return {
        type: 'commercial',
        commercial: {
          principal: parseFloat(commercialAmount) * 10000,
          annualRate: parseFloat(commercialRate),
          months: commercialMonths,
          repaymentType
        }
      };
    }

    if (loanType === '公积金贷款') {
      return {
        type: 'gjj',
        gjj: {
          principal: parseFloat(gjjAmount) * 10000,
          annualRate: parseFloat(gjjRate),
          months: gjjMonths,
          repaymentType
        }
      };
    }

    return {
      type: 'combo',
      commercial: {
        principal: parseFloat(commercialAmount) * 10000,
        annualRate: parseFloat(commercialRate),
        months: commercialMonths,
        repaymentType
      },
      gjj: {
        principal: parseFloat(gjjAmount) * 10000,
        annualRate: parseFloat(gjjRate),
        months: gjjMonths,
        repaymentType
      }
    };
  },

  /**
   * 校验当前贷款输入是否完整。
   * @returns {string} 错误信息，空字符串表示通过
   */
  validateLoanInput() {
    const { loanTypeIndex, commercialAmount, commercialRate, gjjAmount, gjjRate } = this.data;
    const loanType = this.data.loanTypes[loanTypeIndex];

    if (loanType === '商业贷款' && (!parseFloat(commercialAmount) || !parseFloat(commercialRate))) {
      return '请填写商业贷款金额和利率';
    }

    if (loanType === '公积金贷款' && (!parseFloat(gjjAmount) || !parseFloat(gjjRate))) {
      return '请填写公积金贷款金额和利率';
    }

    if (loanType === '组合贷款') {
      if (!parseFloat(commercialAmount) || !parseFloat(commercialRate) || !parseFloat(gjjAmount) || !parseFloat(gjjRate)) {
        return '请完整填写组合贷款信息';
      }
    }

    return '';
  },

  /**
   * 格式化贷款云函数结果用于页面展示。
   * @param {object} result - 云函数返回的贷款数据
   * @returns {object} 页面展示数据
   */
  formatLoanResult(result) {
    const details = Array.isArray(result.details) ? result.details : [];
    const firstMonth = details[0] || { payment: 0, principal: 0, interest: 0, balance: 0 };

    const formattedResult = {
      monthlyPayment: this.formatNumber(result.monthlyPayment),
      totalInterest: this.formatNumber(result.totalInterest),
      totalPayment: this.formatNumber(result.totalPayment),
      details: details.map(item => ({
        month: item.month,
        payment: this.formatNumber(item.payment),
        principal: this.formatNumber(item.principal),
        interest: this.formatNumber(item.interest),
        balance: this.formatNumber(item.balance)
      })),
      firstMonth: {
        payment: this.formatNumber(firstMonth.payment),
        principal: this.formatNumber(firstMonth.principal),
        interest: this.formatNumber(firstMonth.interest),
        balance: this.formatNumber(firstMonth.balance)
      }
    };

    return formattedResult;
  },

  /**
   * 调用贷款云函数并展示计算结果。
   */
  async calculate() {
    const validationError = this.validateLoanInput();
    if (validationError) {
      wx.showToast({ title: validationError, icon: 'none' });
      return;
    }

    const payload = this.buildLoanPayload();
    wx.showLoading({ title: '计算中...' });

    try {
      const response = await wx.cloud.callFunction({
        name: 'loan',
        data: payload
      });

      const resultWrapper = response && response.result ? response.result : {};
      if (!resultWrapper.success || !resultWrapper.data) {
        throw new Error(resultWrapper.error || '贷款云函数返回异常');
      }

      const result = resultWrapper.data;
      const loanType = this.data.loanTypes[this.data.loanTypeIndex];
      const formattedResult = this.formatLoanResult(result);

      if (loanType === '组合贷款') {
        formattedResult.commercialPrincipal = this.data.commercialAmount;
        formattedResult.gjjPrincipal = this.data.gjjAmount;
      }

      this.setData({ result: formattedResult });
    } catch (error) {
      wx.showToast({
        title: error.message || '计算失败，请稍后重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  onShareAppMessage() {
    return buildShareAppMessage('pages/loan/index');
  },

  onShareTimeline() {
    return buildShareTimeline('pages/loan/index');
  }
});
