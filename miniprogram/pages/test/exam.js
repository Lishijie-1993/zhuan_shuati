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
    loading: true,
    snapshotId: null
  },

  // 提交锁：防止并发交卷导致的数据覆写冲突
  _submitLock: false,

  onLoad(options) {
    console.log('[exam] onLoad options:', options);

    // 解析传入的参数
    let paperId = options.id || options.paperId;
    let paperTitle = options.title || '模拟考试';

    // 如果标题是编码的，进行解码
    if (paperTitle && paperTitle !== '模拟考试') {
      try {
        paperTitle = decodeURIComponent(paperTitle);
      } catch (e) {
        console.log('[exam] 标题解码失败，使用原始值:', paperTitle);
      }
    }

    console.log('[exam] 解析后的 paperId:', paperId, 'paperTitle:', paperTitle);

    this.setData({
      paperId: paperId,
      paperTitle: paperTitle,
      snapshotId: null
    });

    this.loadQuestions(paperId);
    this.startTimer();

    wx.setNavigationBarTitle({ title: paperTitle });

    wx.enableAlertBeforeUnload({
      message: "考试正在进行中，退出将不保存进度，确定退出吗？"
    });
  },

  // 页面显示时触发，用于处理切后台后恢复的情况
  onShow() {
    // 如果定时器没有运行，重新启动（处理从后台恢复的情况）
    if (!this.timer && !this.data.isSubmitting && !this.data.loading) {
      this.startTimer();
    }
  },

  // 页面隐藏时触发，用于处理切后台的情况
  onHide() {
    // 暂停定时器，防止切后台时积压回调
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
        const durationSeconds = (res.duration || 90) * 60;
        this.setData({
          questions: res.questions,
          timeLeft: durationSeconds,
          timerText: this.formatTimeText(durationSeconds),
          loading: false,
          snapshotId: res.snapshotId || paperId
        });
        // 保存 duration 供后续使用
        this.examDuration = durationSeconds;
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
        { id: 'A', text: '专职' }, { id: 'B', text: '兼职' }, { id: 'C', text: '临时' }, { id: 'D', text: '派驻' }
      ], answer: 'A' },
      { id: '102', type: 'multiple', title: '以下属于特种作业人员的有（ ）。', options: [
        { id: 'A', text: '电工' }, { id: 'B', text: '焊工' }, { id: 'C', text: '起重信号工' }, { id: 'D', text: '普通力工' }
      ], answer: ['A', 'B', 'C'] },
      { id: '103', type: 'judge', title: '安全生产责任制是施工单位安全管理的核心。', options: [
        { id: 'A', text: '正确' }, { id: 'B', text: '错误' }
      ], answer: 'A' }
    ];
    this.examDuration = 90 * 60; // 默认90分钟
    this.setData({ 
      questions: mockQuestions, 
      loading: false,
      timeLeft: this.examDuration,
      timerText: this.formatTimeText(this.examDuration)
    });
    wx.showToast({ title: '使用模拟题目', icon: 'none' });
  },

  startTimer() {
    // 防止重复启动定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // 记录考试开始时间，用于计算实际经过的时间
    this.examStartTime = Date.now();

    this.timer = setInterval(() => {
      // 计算实际经过的时间（不受后台暂停影响）
      const elapsedSeconds = Math.floor((Date.now() - this.examStartTime) / 1000);
      const timeLeft = this.examDuration - elapsedSeconds;

      if (timeLeft <= 0) {
        clearInterval(this.timer);
        this.timer = null;
        this.autoSubmit();
        return;
      }

      let min = Math.floor(timeLeft / 60);
      let sec = timeLeft % 60;
      this.setData({
        timeLeft: timeLeft,
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
          // 使用安全的提交方法，防止并发冲突
          this.safeProcessResult();
        }
      }
    });
  },

  // 安全的提交方法（带提交锁，防止并发冲突）
  safeProcessResult() {
    // 检查是否正在提交中，防止并发提交
    if (this._submitLock) {
      console.warn('检测到重复提交请求，已忽略');
      return;
    }

    // 设置提交锁
    this._submitLock = true;
    
    // 设置UI状态
    this.setData({ isSubmitting: true });

    // 执行实际的提交逻辑
    this.processResult()
      .catch(err => {
        console.error('提交过程出现异常:', err);
        // 确保异常情况下也释放锁
        this._submitLock = false;
        this.setData({ isSubmitting: false });
      })
      .finally(() => {
        // processResult 完成后释放锁（正常情况由 processResult 内部处理）
        // 这里做双重保险
        setTimeout(() => {
          this._submitLock = false;
        }, 1000);
      });
  },

  autoSubmit() {
    wx.showToast({ title: '考试时间到，已自动交卷', icon: 'none' });
    // 自动交卷也使用提交锁，防止与手动交卷冲突
    this.safeProcessResult();
  },

  async processResult() {
    // 再次检查提交锁，双重保险
    if (this._processingResult) {
      console.warn('检测到重复处理，已忽略');
      return;
    }
    this._processingResult = true;

    try {
      // 清理定时器并置空
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

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
      const totalTime = this.examDuration || this.data.timeLeft;
      const timeUsed = Math.max(0, totalTime - this.data.timeLeft);

      wx.showLoading({ title: '正在阅卷...' });

      try {
        const res = await cloud.submitPaper(
          this.data.snapshotId || this.data.paperId,
          this.data.userAnswers
        );

        wx.hideLoading();
        wx.disableAlertBeforeUnload();

        if (res && res.success) {
          wx.redirectTo({
            url: `/pages/test/result?score=${res.score}&correct=${res.correctCount}&total=${res.totalQuestions}&paperId=${this.data.paperId}&recordId=${this.data.snapshotId || this.data.paperId}`
          });
        } else {
          console.warn('云函数返回失败，使用本地结果:', res);
          await this.createLocalRecord(score, correctCount, totalQuestions, timeUsed);
          wx.redirectTo({
            url: `/pages/test/result?score=${score}&correct=${correctCount}&total=${totalQuestions}&paperId=${this.data.paperId}&recordId=${this.data.snapshotId || this.data.paperId}`
          });
        }
      } catch (err) {
        console.error('提交试卷失败:', err);
        wx.hideLoading();
        wx.disableAlertBeforeUnload();
        await this.createLocalRecord(score, correctCount, totalQuestions, timeUsed);
        wx.redirectTo({
          url: `/pages/test/result?score=${score}&correct=${correctCount}&total=${totalQuestions}&paperId=${this.data.paperId}&recordId=${this.data.snapshotId || this.data.paperId}`
        });
      }
    } finally {
      // 释放处理锁
      this._processingResult = false;
      this._submitLock = false;
      this.setData({ isSubmitting: false });
    }
  },

  // 创建本地兜底记录（当云函数失败时）
  async createLocalRecord(score, correctCount, totalQuestions, timeUsed) {
    try {
      const db = wx.cloud.database();
      await db.collection('user_exam_records').add({
        data: {
          user_id: 'local_' + Date.now(),
          paper_id: this.data.paperId,
          paper_title: this.data.paperTitle || '模拟考试',
          snapshot_id: 'local_' + Date.now(),
          score: score,
          answers: this.data.userAnswers,
          question_ids: this.data.questions.map(q => q.id),
          start_time: new Date(Date.now() - timeUsed * 1000),
          submit_time: new Date(),
          status: 'completed',
          time_used: timeUsed,
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('本地兜底记录创建成功');
    } catch (err) {
      console.error('创建本地兜底记录失败:', err);
    }
  },

  onUnload() {
    // 清理定时器并置空，防止内存泄漏
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
});
