const { calcBMI, calcBMR, getHeightWeightTable } = require('../../utils/health');
const {
  enablePageShare,
  buildShareAppMessage,
  buildShareTimeline
} = require('../../utils/share');

Page({
  data: {
    tabs: ['BMI计算', '卡路里', '身高标准'],
    activeTab: 0,

    // 通用
    height: '',
    weight: '',

    // BMI
    bmiResult: null,

    // 卡路里
    age: '',
    genderOptions: ['男', '女'],
    genderIndex: 0,
    calorieGender: 'male',
    calorieResult: null,

    // 身高标准
    stdGender: 'male',
    heightWeightTable: []
  },

  onLoad() {
    enablePageShare();
    this.setData({
      heightWeightTable: getHeightWeightTable('male')
    });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.index });
  },

  onHeightInput(e) {
    this.setData({ height: e.detail.value });
  },

  onWeightInput(e) {
    this.setData({ weight: e.detail.value });
  },

  onAgeInput(e) {
    this.setData({ age: e.detail.value });
  },

  onGenderChange(e) {
    const calorieGender = e.detail.value === '0' ? 'male' : 'female';
    this.setData({
      genderIndex: e.detail.value,
      calorieGender
    });
  },

  calcBMI() {
    const height = parseFloat(this.data.height);
    const weight = parseFloat(this.data.weight);

    if (!height || !weight) {
      wx.showToast({ title: '请输入身高和体重', icon: 'none' });
      return;
    }

    const result = calcBMI(height, weight);
    this.setData({ bmiResult: result });
  },

  calcCalorie() {
    const height = parseFloat(this.data.height);
    const weight = parseFloat(this.data.weight);
    const age = parseInt(this.data.age);

    if (!height || !weight || !age) {
      wx.showToast({ title: '请输入完整信息', icon: 'none' });
      return;
    }

    const result = calcBMR(height, weight, age, this.data.calorieGender);
    this.setData({ calorieResult: result });
  },

  setGender(e) {
    const stdGender = e.currentTarget.dataset.gender;
    this.setData({
      stdGender,
      heightWeightTable: getHeightWeightTable(stdGender)
    });
  },

  goToIndex() {
    wx.redirectTo({ url: '/pages/index/index' });
  },

  goToTax() {
    wx.redirectTo({ url: '/pages/tax/index' });
  },

  goToLoan() {
    wx.redirectTo({ url: '/pages/loan/index' });
  },

  onShareAppMessage() {
    return buildShareAppMessage('pages/health/index');
  },

  onShareTimeline() {
    return buildShareTimeline('pages/health/index');
  }
});
