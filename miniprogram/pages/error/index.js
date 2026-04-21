// miniprogram/pages/error/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    activeTab: 'today',
    errorCount: 0,
    errors: [],
    loading: false
  },

  _isMounted: true,

  onLoad() {
    this.loadErrors();
  },
  onUnload() {
    this._isMounted = false; // 页面卸载时标记
  },
  
  onShow() {
    // 页面挂载标记，防止内存泄漏
    this._isMounted = true;

    if (this._returningFromChild) {
      this._returningFromChild = false;
    }
    // 检查脏标记：答题页答对/答错错题后会设置此标记
    if (wx.getStorageSync('error_list_dirty')) {
      wx.removeStorageSync('error_list_dirty');
      this.loadErrors();
    } else if (this.data.errors.length === 0) {
      // 初始加载或数据为空时也加载
      this.loadErrors();
    }
  },

  onUnload() {
    // 页面卸载时清理标记
    this._isMounted = false;
  },

  viewError(e) {
    this._returningFromChild = true;
    const questionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/quiz/index?id=${questionId}&mode=error`
    });
  },

  // 从云函数加载错题数据
  async loadErrors() {
    // 如果正在加载中，跳过（防止并发调用）
    if (this._loadingErrors) return;
    

    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      const res = await cloud.call('getQuestions', { mode: 'error', limit: 100 });

      if (res && res.list) {
        if (!this._isMounted) return;
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
    } finally {
      this._loadingErrors = false;
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
