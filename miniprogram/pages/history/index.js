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

  // 标记是否已完成首次加载
  _initialLoaded: false,

  onLoad() {
    this.loadHistory();
  },

  // 历史记录页面：只在首次加载时获取数据，返回时保持滚动位置
  onShow() {
    // 如果已完成首次加载，从子页面返回时不再刷新，避免滚动位置重置
    // 用户可以通过下拉刷新来手动刷新数据
    if (!this._initialLoaded) {
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

        // 标记首次加载完成
        this._initialLoaded = true;
      } else {
        this.setData({ loading: false, hasMore: false });
        // 标记首次加载完成（即使没有数据）
        this._initialLoaded = true;
      }

      wx.hideLoading();
    } catch (err) {
      console.error('加载考试记录失败:', err);
      this.setData({ loading: false, hasMore: false });
      // 标记首次加载完成（即使失败）
      this._initialLoaded = true;
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
