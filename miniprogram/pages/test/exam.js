Page({
  data: {
    paperId: null,
    questions: [], // 题目数据
    currentIndex: 0, // 当前题号
    userAnswers: {}, // 格式: { q_id: "A" } 或 { q_id: ["A", "B"] }
    timeLeft: 5400, // 90分钟
    timerText: "90:00",
    isSubmitting: false
  },

  onLoad(options) {
    const { id } = options;
    this.setData({ paperId: id });
    this.loadQuestions(id);
    this.startTimer();
    
    // 考试安全：开启返回确认
    wx.enableAlertBeforeUnload({
      message: "考试正在进行中，退出将不保存进度，确定退出吗？"
    });
  },

  // 模拟从后端获取数据
  loadQuestions(id) {
    // 实际开发时换成 wx.request
    const mockQuestions = [
      { id: 101, type: 'single', title: '根据《水利工程建设安全生产管理规定》，施工单位应当设立安全生产管理机构，配备（ ）安全生产管理人员。', options: [
        { key: 'A', content: '专职' }, { key: 'B', content: '兼职' }, { key: 'C', content: '临时' }, { key: 'D', content: '派驻' }
      ], answer: 'A' },
      { id: 102, type: 'multiple', title: '以下属于特种作业人员的有（ ）。', options: [
        { key: 'A', content: '电工' }, { key: 'B', content: '焊工' }, { key: 'C', content: '起重信号工' }, { key: 'D', content: '普通力工' }
      ], answer: ['A', 'B', 'C'] },
      { id: 103, type: 'judge', title: '安全生产责任制是施工单位安全管理的核心。', options: [
        { key: 'A', content: '正确' }, { key: 'B', content: '错误' }
      ], answer: 'A' }
    ];
    this.setData({ questions: mockQuestions });
  },

  // 倒计时逻辑
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

  // 选择选项逻辑
  selectOption(e) {
    const { key } = e.currentTarget.dataset;
    const { questions, currentIndex, userAnswers } = this.data;
    const currentQ = questions[currentIndex];
    let currentAns = userAnswers[currentQ.id];

    if (currentQ.type === 'multiple') {
      // 多选逻辑
      if (!Array.isArray(currentAns)) currentAns = [];
      const idx = currentAns.indexOf(key);
      if (idx > -1) {
        currentAns.splice(idx, 1);
      } else {
        currentAns.push(key);
      }
      userAnswers[currentQ.id] = currentAns.sort();
    } else {
      // 单选和判断逻辑
      userAnswers[currentQ.id] = key;
    }

    this.setData({ userAnswers });
  },

  // 题目导航
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

  // 提交考试
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
    // 停止倒计时
    clearInterval(this.timer);
    // 这里可以计算分数或发送给后端
    wx.showLoading({ title: '正在阅卷...' });
    
    setTimeout(() => {
      wx.hideLoading();
      // 跳转到结果页（你需要新建此页面）
      wx.redirectTo({
        url: `/pages/test/result?id=${this.data.paperId}`
      });
    }, 1500);
  },

  onUnload() {
    clearInterval(this.timer);
  }
});