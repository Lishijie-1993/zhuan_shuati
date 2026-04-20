// miniprogram/pages/error/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    activeTab: 'today',
    errorCount: 0,
    errors: [],
    loading: true
  },

  onLoad() {
    this.loadErrors();
  },

  onShow() {
    this.loadErrors();
  },

  // 从云函数加载错题数据
  async loadErrors() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const res = await cloud.call('getQuestions', { mode: 'error' });
      
      if (res && res.list) {
        this.setData({
          errors: res.list,
          errorCount: res.list.length,
          loading: false
        });
      } else {
        this.setData({
          errors: [],
          errorCount: 0,
          loading: false
        });
      }
      
      wx.hideLoading();
    } catch (err) {
      console.error('加载错题失败:', err);
      this.setData({
        errors: [],
        errorCount: 0,
        loading: false
      });
      wx.hideLoading();
    }
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 查看错题详情
  viewError(e) {
    const questionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/quiz/index?id=${questionId}&mode=error`
    });
  },

  // 重新练习错题
  retryErrors() {
    wx.navigateTo({
      url: '/pages/quiz/index?mode=error'
    });
  }
});
