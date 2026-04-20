// pages/point/index.js
Page({
  data: {
    // 知识点列表，初始为空数组以展示骨架屏占位页
    knowledgeList: [],
    // 加载状态控制
    loading: true
  },

  onLoad(options) {
    this.fetchData();
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  fetchData() {
    // 目前保持为空，页面会显示"加载中/暂无内容"的骨架屏
  },

  onPullDownRefresh() {
    this.fetchData();
    wx.stopPullDownRefresh();
  }
});
