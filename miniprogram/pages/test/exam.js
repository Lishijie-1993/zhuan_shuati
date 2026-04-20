// miniprogram/pages/test/exam.js
const cloud = require('../../utils/cloud.js');

Page({
  data: {
    paperId: null,
    paperTitle: '模拟考试',
    questions: [],
    currentIndex: 0,
    userAnswers: {},
    timeLeft: 5400,
    timerText: "90:00",
    isSubmitting: false,
    loading: true
  },

  onLoad(options) {
    const { id, title } = options;
    this.setData({
      paperId: id,
      paperTitle: title || '模拟考试'
    });
    this.loadQuestions(id);
    this.startTimer();

    wx.setNavigationBarTitle({ title: this.data.paperTitle });

    wx.enableAlertBeforeUnload({
      message: "考试正在进行中，退出将不保存进度，确定退出吗？"
    });
  },

  goBack() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出考试吗？退出后进度将不会保存',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  // 从云函数加载试卷题目
  async loadQuestions(paperId) {
    try {
      wx.showLoading({ title: '加载题目...' });

      const res = await cloud.startPaper(paperId);

      if (res && res.success && res.questions && res.questions.length > 0) {
        this.setData({
          questions: res.questions,
          timeLeft: (res.duration || 90) * 60,
          timerText: this.formatTimeText((res.duration || 90) * 60),
          loading: false
        });
      } else {
        this.loadMockData();
      }

      wx.hideLoading();
    } catch (err) {
      console.error('加载题目失败:', err);
      wx.hideLoading();
      this.loadMockData();
    }
  },

  formatTimeText(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  },

  loadMockData() {
    const mockQuestions = [
      { id: '101', type: 'single', title: '根据《水利工程建设安全生产管理规定》，施工单位应当设立安全生产管理机构，配备（ ）安全生产管理人员。', options: [
        { key: 'A', content: '专职' }, { key: 'B', content: '兼职' }, { key: 'C', content: '临时' }, { key: 'D', content: '派驻' }
      ], answer: 'A' },
      { id: '102', type: 'multiple', title: '以下属于特种作业人员的有（ ）。', options: [
        { key: 'A', content: '电工' }, { key: 'B', content: '焊工' }, { key: 'C', content: '起重信号工' }, { key: 'D', content: '普通力工' }
      ], answer: ['A', 'B', 'C'] },
      { id: '103', type: 'judge', title: '安全生产责任制是施工单位安全管理的核心。', options: [
        { key: 'A', content: '正确' }, { key: 'B', content: '错误' }
      ], answer: 'A' }
    ];
    this.setData({ questions: mockQuestions, loading: false });
    wx.showToast({ title: '使用模拟题目', icon: 'none' });
  },

  startTimer() {
    this.timer = setInterval(() => {
      if (this.data.timeLeft <= 0) {
        clearInterval(this.timer);
        this.autoSubmit();
        return;
      }
      let time = this.data.timeLeft - 1;
      let min = Math.floor(time / 60);
      let sec = time % 60;
      this.setData({
        timeLeft: time,
        timerText: `${min}:${sec < 10 ? '0' + sec : sec}`
      });
    }, 1000);
  },

  selectOption(e) {
    const { key } = e.currentTarget.dataset;
    const { questions, currentIndex, userAnswers } = this.data;
    const currentQ = questions[currentIndex];
    let currentAns = userAnswers[currentQ.id];

    if (currentQ.type === 'multiple') {
      if (!Array.isArray(currentAns)) currentAns = [];
      const idx = currentAns.indexOf(key);
      if (idx > -1) {
        currentAns.splice(idx, 1);
      } else {
        currentAns.push(key);
      }
      userAnswers[currentQ.id] = currentAns.sort();
    } else {
      userAnswers[currentQ.id] = key;
    }

    this.setData({ userAnswers });
  },

  prevQuestion() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 });
    }
  },

  nextQuestion() {
    if (this.data.currentIndex < this.data.questions.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 });
    }
  },

  submitExam() {
    wx.showModal({
      title: '确认交卷',
      content: '是否确认提交本次模拟考试？',
      confirmColor: '#007AFF',
      success: (res) => {
        if (res.confirm) {
          this.processResult();
        }
      }
    });
  },

  autoSubmit() {
    wx.showToast({ title: '考试时间到，已自动交卷', icon: 'none' });
    this.processResult();
  },

  processResult() {
    clearInterval(this.timer);
    let correctCount = 0;
    this.data.questions.forEach(q => {
      const userAns = this.data.userAnswers[q.id];
      if (q.type === 'multiple') {
        if (JSON.stringify(userAns || []) === JSON.stringify(q.answer)) {
          correctCount++;
        }
      } else {
        if (userAns === q.answer) {
          correctCount++;
        }
      }
    });

    const totalQuestions = this.data.questions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);

    wx.showLoading({ title: '正在阅卷...' });

    setTimeout(() => {
      wx.hideLoading();
      wx.disableAlertBeforeUnload();
      wx.redirectTo({
        url: `/pages/test/result?score=${score}&correct=${correctCount}&total=${totalQuestions}&paperId=${this.data.paperId}`
      });
    }, 1500);
  },

  onUnload() {
    clearInterval(this.timer);
  }
});
