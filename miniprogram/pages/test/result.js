// pages/test/result.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    score: 0,
    correctCount: 0,
    totalCount: 0,
    accuracy: 0,
    paperTitle: '模拟考试',
    passed: false,
    recordId: null,
    isHistory: false
  },

  async onLoad(options) {
    const { score, correct, total, paperId, recordId, isHistory } = options;

    const scoreNum = parseInt(score) || 0;
    const correctNum = parseInt(correct) || 0;
    const totalNum = parseInt(total) || 0;
    const accuracyNum = totalNum > 0 ? Math.round((correctNum / totalNum) * 100) : 0;

    this.setData({
      score: scoreNum,
      correctCount: correctNum,
      totalCount: totalNum,
      accuracy: accuracyNum,
      passed: scoreNum >= 60,
      recordId: recordId || paperId,
      isHistory: isHistory === 'true'
    });

    // 首次完成考试，保存记录（由 exam.js 调用 submitPaper 已处理）
    // 此处仅处理从历史记录点击进入的场景
    if (isHistory === 'true' && recordId) {
      this.loadRecordDetail(recordId);
    }
  },

  // 加载历史记录详情
  async loadRecordDetail(recordId) {
    try {
      const res = await cloud.call('getExamHistory', { page: 1, limit: 100 });
      if (res && res.list) {
        const record = res.list.find(r => r.id === recordId || r.recordId === recordId);
        if (record) {
          this.setData({
            paperTitle: record.title || '模拟考试',
            score: record.score ?? this.data.score,
            passed: (record.score ?? 0) >= 60
          });
          wx.setNavigationBarTitle({ title: record.title || '考试结果' });
        }
      }
    } catch (err) {
      console.error('加载历史记录详情失败:', err);
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  doAgain() {
    wx.navigateBack({ delta: 1 });
  },

  viewAnalysis() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
