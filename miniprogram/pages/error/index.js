// miniprogram/pages/error/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    activeTab: 'today',
    errorCount: 0,
    errors: [],
    loading: true
  },

  // 标记是否已完成首次加载
  _initialLoaded: false,

  onLoad() {
    this.loadErrors();
  },

  // 错题页面：只在首次加载时获取数据，返回时保持滚动位置
  onShow() {
    // 如果已完成首次加载，从子页面返回时不再刷新，避免滚动位置重置
    // 用户可以通过下拉刷新来手动刷新数据
    if (!this._initialLoaded) {
      this.loadErrors();
    }
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

      // 标记首次加载完成
      this._initialLoaded = true;

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

  viewError(e) {
    const questionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/quiz/index?id=${questionId}&mode=error`
    });
  },

  retryErrors() {
    wx.navigateTo({
      url: '/pages/quiz/index?mode=error'
    });
  }
});
