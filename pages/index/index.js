const {
  enablePageShare,
  buildShareAppMessage,
  buildShareTimeline
} = require('../../utils/share');

Page({
  onLoad() {
    enablePageShare();
  },

  /**
   * 跳转到个税计算页面。
   */
  goToTax() {
    wx.redirectTo({ url: '/pages/tax/index' });
  },

  /**
   * 跳转到贷款计算页面。
   */
  goToLoan() {
    wx.redirectTo({ url: '/pages/loan/index' });
  },

  /**
   * 跳转到健康计算页面。
   */
  goToHealth() {
    wx.redirectTo({ url: '/pages/health/index' });
  },

  /**
   * 跳转到单位换算页面。
   */
  goToConverter() {
    wx.redirectTo({ url: '/pages/converter/index' });
  },

  onShareAppMessage() {
    return buildShareAppMessage('pages/index/index');
  },

  onShareTimeline() {
    return buildShareTimeline('pages/index/index');
  }
});
