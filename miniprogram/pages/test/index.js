Page({
  data: {
    paperList: [] // 初始为空，由后端提供
  },
  onLoad() {
    this.fetchPaperList();
  },
  fetchPaperList() {
    // 这里模拟请求后端数据库
    const mockData = [
      { id: 1, title: '水利安全员A证模拟考试卷一', questionCount: 100, duration: 90, totalScore: 100 },
      { id: 2, title: '水利安全员B证模拟考试卷二', questionCount: 100, duration: 90, totalScore: 100 }
    ];
    this.setData({ paperList: mockData });
  },
  startExam(e) {
    const paperId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/question/index?id=${paperId}&type=exam`
    });
  }
});