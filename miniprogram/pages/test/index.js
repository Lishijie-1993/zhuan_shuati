// miniprogram/pages/test/index.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    paperList: [],
    loading: true
  },

  onLoad() {
    // 仅在 onLoad 时请求数据，onShow 不再重复请求
    this.fetchPaperList();
  },

  // onShow 仅用于页面从其他页面返回时刷新状态，不需要重新请求数据
  // 数据刷新交给下拉刷新或其他用户触发的操作

  fetchPaperList() {
    // 如果正在加载中或已有数据且不需要刷新，跳过
    if (this.data.loading === false && this.data.paperList.length > 0) {
      return;
    }

    // 模拟数据作为兜底
    const mockData = [
      { id: 1, title: '水利安全员A证模拟考试卷一', questionCount: 100, duration: 90, totalScore: 100 },
      { id: 2, title: '水利安全员B证模拟考试卷二', questionCount: 100, duration: 90, totalScore: 100 }
    ];

    // 尝试从云端获取
    this.loadFromCloud().then(cloudData => {
      if (cloudData && cloudData.length > 0) {
        this.setData({
          paperList: cloudData,
          loading: false
        });
      } else {
        // 兜底使用模拟数据
        this.setData({
          paperList: mockData,
          loading: false
        });
      }
    }).catch(() => {
      this.setData({
        paperList: mockData,
        loading: false
      });
    });
  },

  async loadFromCloud() {
    try {
      // 尝试调用云函数获取试卷列表
      const res = await cloud.call('listPapers');
      if (res && res.list) {
        return res.list;
      }
      return null;
    } catch (err) {
      console.error('获取试卷列表失败:', err);
      return null;
    }
  },

  startExam(e) {
    const paperId = e.currentTarget.dataset.id;
    const paperTitle = e.currentTarget.dataset.title || '模拟考试';
    wx.navigateTo({
      url: `/pages/test/exam?id=${paperId}&title=${encodeURIComponent(paperTitle)}`
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
