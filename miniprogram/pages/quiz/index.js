// pages/quiz/index.js
const cloud = require('../../utils/cloud.js');
const { STORAGE_KEYS } = require('../../utils/constants.js');

Page({
  data: {
    chapterTitle: '第1章 金属非金属矿山概述',
    mode: 'answer',
    isAutoNext: false,
    currentIndex: 0,
    totalQuestions: 0,
    correctAnswer: '',
    userAnswer: null,
    userAnswers: {},  // 支持多选题的答案存储
    isFavorited: false,
    analysisText: '',
    options: [],
    currentQuestionText: '',
    questions: []
  },

  onLoad(options) {
    if (options.mode === 'error') {
      // 错题练习模式
      this.setData({
        chapterTitle: '错题练习',
        mode: 'error'
      });
      wx.setNavigationBarTitle({ title: '错题练习' });
    } else if (options.title) {
      const decodedTitle = decodeURIComponent(options.title);
      this.setData({
        chapterTitle: decodedTitle
      });
      wx.setNavigationBarTitle({ title: decodedTitle });
    }

    // 如果有指定题目ID，加载单题
    if (options.id) {
      this.loadSingleQuestion(options.id);
    } else {
      this.loadQuestions();
    }
  },

  onShow() {
    this.checkFavoriteStatus();
  },

  // 加载单题
  async loadSingleQuestion(questionId) {
    try {
      wx.showLoading({ title: '加载中...' });

      const res = await cloud.call('getQuestions', { mode: 'byIds', ids: [questionId] });

      if (res && res.list && res.list.length > 0) {
        const questions = res.list;
        const firstQ = questions[0];

        this.setData({
          questions,
          totalQuestions: questions.length,
          currentQuestionText: firstQ.content,
          options: firstQ.options,
          correctAnswer: firstQ.correctAnswer,
          analysisText: firstQ.analysis,
          currentIndex: 0,
          userAnswer: null,
          userAnswers: {}
        });

        this.checkFavoriteStatus();
      }

      wx.hideLoading();
    } catch (err) {
      console.error('加载题目失败:', err);
      wx.hideLoading();
    }
  },

  // 加载题目列表
  async loadQuestions() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 根据模式决定调用方式
      const mode = this.data.mode === 'error' ? 'error' : 'normal';
      const res = await cloud.getQuestions(
        this.data.mode === 'error' ? null : this.data.chapterTitle,
        mode
      );

      if (res && res.list && res.list.length > 0) {
        const questions = res.list;
        const firstQ = questions[0];

        this.setData({
          questions,
          totalQuestions: questions.length,
          currentQuestionText: firstQ.content,
          options: firstQ.options,
          correctAnswer: firstQ.correctAnswer,
          analysisText: firstQ.analysis,
          currentIndex: 0,
          userAnswer: null,
          userAnswers: {}
        });

        this.checkFavoriteStatus();
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

  // 加载模拟数据（云函数不可用时）
  loadMockData() {
    const mockQuestions = [
      {
        id: 'q1',
        type: 'single',
        content: '根据矿床充水主要含水层的类型，将固体矿床划分为以孔隙含水层为主的充水矿床、以裂隙含水层为主的充水矿床和以岩溶含水层为主的充水矿床。下列选项中属于构造裂隙含水层型矿坑涌水特点的是（ ）。',
        options: [
          { id: 'A', text: '涌水量介于100~500m³/h' },
          { id: 'B', text: '水压大，水量丰富，一般为500~1000m³/h' },
          { id: 'C', text: '静储量大，动储量小，一般为80~500m³/h' },
          { id: 'D', text: '以静储量为主，动储量变化范围大，可由每小时10m³至数万立方米' }
        ],
        correctAnswer: 'C',
        analysis: '裂隙水赋存于岩石裂隙中的地下水，其特点正是水量一般不大，但水压往往较大。'
      }
    ];

    this.setData({
      questions: mockQuestions,
      totalQuestions: mockQuestions.length,
      currentQuestionText: mockQuestions[0].content,
      options: mockQuestions[0].options,
      correctAnswer: mockQuestions[0].correctAnswer,
      analysisText: mockQuestions[0].analysis,
      userAnswer: null,
      userAnswers: {}
    });

    this.checkFavoriteStatus();
  },

  // 获取当前题目（带安全检查）
  getCurrentQuestion() {
    const { questions, currentIndex } = this.data;
    if (!questions || questions.length === 0) return null;
    if (currentIndex < 0 || currentIndex >= questions.length) return null;
    return questions[currentIndex];
  },

  // 检查收藏状态
  checkFavoriteStatus() {
    if (this.data.questions.length === 0) return;

    try {
      const favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || [];
      const currentQ = this.getCurrentQuestion();
      if (!currentQ) return;

      const isFavorited = favorites.some(item => item.id === currentQ.id);
      this.setData({ isFavorited });
    } catch (e) {
      console.error('读取收藏状态失败:', e);
    }
  },

  toggleAutoNext() {
    this.setData({ isAutoNext: !this.data.isAutoNext });
    wx.showToast({
      title: this.data.isAutoNext ? '已开启自动下一题' : '已切换为手动模式',
      icon: 'none'
    });
  },

  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode,
      userAnswer: null,
      userAnswers: {}
    });
  },

  // 选择选项（支持多选题）
  selectOption(e) {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    const selectedId = e.currentTarget.dataset.id;

    // 判断是否是多选题
    const isMultipleChoice = currentQ.type === 'multiple';

    if (isMultipleChoice) {
      // 多选题处理
      this.handleMultipleChoice(selectedId, currentQ);
    } else {
      // 单选题/判断题处理
      this.handleSingleChoice(selectedId, currentQ);
    }
  },

  // 处理多选题选择
  handleMultipleChoice(selectedId, currentQ) {
    // 背题模式下不处理
    if (this.data.mode === 'recite') return;

    const questionId = currentQ.id;
    let userAnswers = { ...this.data.userAnswers };
    let currentAns = userAnswers[questionId];

    // 确保是数组
    if (!Array.isArray(currentAns)) currentAns = [];

    // 切换选中状态
    const idx = currentAns.indexOf(selectedId);
    if (idx > -1) {
      // 取消选中
      currentAns.splice(idx, 1);
    } else {
      // 选中
      currentAns.push(selectedId);
    }

    // 排序保持一致
    userAnswers[questionId] = currentAns.sort();

    this.setData({ userAnswers });
  },

  // 处理单选题/判断题选择
  handleSingleChoice(selectedId, currentQ) {
    // 背题模式或已作答则忽略
    if (this.data.mode === 'recite' || this.data.userAnswer) {
      return;
    }

    this.setData({ userAnswer: selectedId });

    // 答题正确，记录并报告
    if (selectedId === this.data.correctAnswer) {
      // 同步进度到服务器
      cloud.syncProgress(
        this.data.chapterTitle,
        this.data.currentIndex,
        1
      );
    } else {
      // 答错，记录错题
      cloud.reportError(currentQ.id, selectedId);
    }

    // 自动下一题
    if (this.data.mode === 'answer' && this.data.isAutoNext && selectedId === this.data.correctAnswer) {
      setTimeout(() => { this.nextQuestion(); }, 800);
    }
  },

  // 提交多选题答案
  submitMultipleChoice() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    const questionId = currentQ.id;
    const userAns = this.data.userAnswers[questionId] || [];

    // 判断是否答对（比较排序后的数组）
    const correctArr = this.normalizeAnswerArray(currentQ.correctAnswer);
    const userArr = userAns.sort();

    const isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);

    // 记录进度
    if (isCorrect) {
      cloud.syncProgress(this.data.chapterTitle, this.data.currentIndex, 1);
    } else {
      cloud.reportError(currentQ.id, userAns.join(','));
    }

    // 显示结果
    this.setData({ userAnswer: userArr.length > 0 ? userArr.join(',') : '' });

    // 自动下一题
    if (this.data.isAutoNext) {
      setTimeout(() => { this.nextQuestion(); }, 800);
    }
  },

  // 标准化答案数组
  normalizeAnswerArray(answer) {
    if (!answer) return [];
    if (Array.isArray(answer)) return answer.map(a => String(a).trim().toUpperCase()).sort();
    if (typeof answer === 'string') {
      if (answer.includes(',')) {
        return answer.split(',').map(s => s.trim().toUpperCase()).sort();
      }
      return answer.split('').map(s => s.trim().toUpperCase()).filter(s => s).sort();
    }
    return [String(answer).toUpperCase()];
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  prevQuestion() {
    if (this.data.questions.length === 0) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    if (this.data.currentIndex > 0) {
      const newIndex = this.data.currentIndex - 1;
      this.setData({
        currentIndex: newIndex,
        userAnswer: null,
        userAnswers: {}
      }, () => {
        this.updateQuestionData();
      });
    } else {
      wx.showToast({ title: '已经是第一题了', icon: 'none' });
    }
  },

  nextQuestion() {
    if (this.data.questions.length === 0) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    if (this.data.currentIndex < this.data.totalQuestions - 1) {
      const newIndex = this.data.currentIndex + 1;
      this.setData({
        currentIndex: newIndex,
        userAnswer: null,
        userAnswers: {}
      }, () => {
        this.updateQuestionData();
      });
    } else {
      wx.showToast({ title: '已经是最后一题了', icon: 'none' });
    }
  },

  // 更新当前题目数据
  updateQuestionData() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    this.setData({
      currentQuestionText: currentQ.content,
      options: currentQ.options,
      correctAnswer: currentQ.correctAnswer,
      analysisText: currentQ.analysis || '暂无解析'
    });

    // 同步进度
    cloud.syncProgress(this.data.chapterTitle, this.data.currentIndex, 0);

    // 检查收藏状态
    this.checkFavoriteStatus();
  },

  onAnalysis() {
    if (this.data.mode === 'answer' && !this.data.userAnswer) {
      this.setData({ userAnswer: 'SHOW_ANALYSIS' });
    }
    wx.showToast({ title: '查看详细解析', icon: 'none' });
  },

  async onFavorite() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    try {
      const action = this.data.isFavorited ? 'remove' : 'add';
      const res = await cloud.toggleFavorite(currentQ.id, action);

      if (res) {
        this.setData({ isFavorited: !this.data.isFavorited });

        if (action === 'add') {
          wx.showToast({ title: '收藏成功', icon: 'success' });
        } else {
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        }
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  }
});
