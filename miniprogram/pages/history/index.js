// miniprogram/pages/history/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    historyList: [],
    stats: {
      totalCount: 0,
      highScore: 0,
      avgScore: 0
    },
    loading: false,
    page: 1,
    hasMore: true
  },

  // 标记是否刚从子页面返回（用于 onShow 智能刷新判断）
  _returningFromChild: false,

  onLoad() {
    this.loadHistory();
  },

  // 历史记录页面：智能刷新策略
  // - 首次加载 onLoad -> 加载数据
  // - 从子页面返回 onShow -> 刷新数据（确保数据同步）
  // - 用户可以通过下拉刷新手动刷新
  onShow() {
    if (this._returningFromChild) {
      this._returningFromChild = false;
      // 从子页面返回时刷新数据，确保数据同步
      this.loadHistory();
    }
  },

  async loadHistory() {
    // 【修复点】：增加严谨的防抖和阻断逻辑
    if (this.data.loading) return;
    if (!this.data.hasMore && this.data.historyList.length > 0) return;

    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });

      const res = await cloud.getExamHistory(this.data.page);

      if (res && res.list) {
        const newList = this.data.page === 1 ? res.list : [...this.data.historyList, ...res.list];

        const totalCount = newList.length;
        const scores = newList.map(r => r.score).filter(s => s >= 0);
        const highScore = scores.length > 0 ? Math.max(...scores) : 0;
        const avgScore = scores.length > 0
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;

        this.setData({
          historyList: newList,
          stats: { totalCount, highScore, avgScore },
          loading: false,
          hasMore: res.hasNext,
          page: this.data.page + 1
        });
      } else {
        this.setData({ loading: false, hasMore: false });
      }

      wx.hideLoading();
    } catch (err) {
      console.error('加载考试记录失败:', err);
      this.setData({ loading: false, hasMore: false });
      wx.hideLoading();
    }
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.loadHistory();
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  viewDetail(e) {
    this._returningFromChild = true;
    const recordId = e.currentTarget.dataset.id;
    const record = this.data.historyList.find(r => r.id === recordId);
    if (record) {
      wx.navigateTo({
        url: `/pages/test/result?score=${record.score}&recordId=${recordId}&isHistory=true`
      });
    }
  },

  onPullDownRefresh() {
    // 【修复点】：同样补全状态重置
    this.setData({ 
      page: 1, 
      historyList: [], 
      hasMore: true, 
      loading: false 
    });
    this.loadHistory();
    setTimeout(() => { wx.stopPullDownRefresh(); }, 500);
  }
});
