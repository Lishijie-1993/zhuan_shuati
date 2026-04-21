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
    if (wx.getStorageSync('error_list_dirty')) {
      this.loadErrors();
      wx.removeStorageSync('error_list_dirty'); // 刷新完清除脏标记
    }
  },


  viewError(e) {
    const questionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/quiz/index?id=${questionId}&mode=error`
    });
  },

  // 从云函数加载错题数据
  async loadErrors() {
    // 如果正在加载中，跳过
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      const res = await cloud.call('getQuestions', { mode: 'error', limit: 100 });

      if (res && res.list) {
        this.setData({
          errors: res.list,
          errorCount: res.total || res.list.length,
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

  retryErrors() {
    wx.navigateTo({
      url: '/pages/quiz/index?mode=error'
    });
  }
});
