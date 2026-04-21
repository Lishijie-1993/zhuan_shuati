// miniprogram/pages/error/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    activeTab: 'today',
    errorCount: 0,
    errors: [],
    loading: true
  },

  // 标记是否刚从子页面返回（用于 onShow 智能刷新判断）
  _returningFromChild: false,

  onLoad() {
    this.loadErrors();
  },

  // 错题页面：智能刷新策略
  // - 首次加载 onLoad -> 加载数据
  // - 从子页面返回 onShow -> 刷新数据（确保数据同步）
  // - 用户可以通过下拉刷新手动刷新
  onShow() {
    if (this._returningFromChild) {
      this._returningFromChild = false;
      // 从子页面返回时刷新数据，确保数据同步
      this.loadErrors();
    }
  },

  // 导航到子页面时标记
  viewError(e) {
    this._returningFromChild = true;
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
