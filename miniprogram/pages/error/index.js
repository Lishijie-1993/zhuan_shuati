// miniprogram/pages/error/index.js
const { STORAGE_KEYS } = require('../../utils/constants.js');

Page({
  data: {
    activeTab: 'today',
    errorCount: 0
  },

  onLoad() {
    const list = wx.getStorageSync(STORAGE_KEYS.ERRORS) || [];
    this.setData({ errorCount: list.length });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  }
});
