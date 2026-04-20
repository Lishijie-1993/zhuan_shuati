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
    isFavorited: false,
    analysisText: '',
    options: [],
    currentQuestionText: '',
    questions: []
  },

  onLoad(options) {
    if (options.title) {
      const decodedTitle = decodeURIComponent(options.title);
      this.setData({
        chapterTitle: decodedTitle
      });
      wx.setNavigationBarTitle({ title: decodedTitle });
    }
    
    // 加载题目
    this.loadQuestions();
  },

  onShow() {
    this.checkFavoriteStatus();
  },

  // 加载题目列表
  async loadQuestions() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      const res = await cloud.getQuestions(this.data.chapterTitle, 'normal');
      
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
          currentIndex: 0
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
      analysisText: mockQuestions[0].analysis
    });

    this.checkFavoriteStatus();
  },

  // 检查收藏状态
  checkFavoriteStatus() {
    if (this.data.questions.length === 0) return;
    
    try {
      const favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || [];
      const currentQ = this.data.questions[this.data.currentIndex];
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
      userAnswer: null
    });
  },

  selectOption(e) {
    if (this.data.mode === 'recite' || this.data.userAnswer) {
      return;
    }

    const selectedId = e.currentTarget.dataset.id;
    const currentQ = this.data.questions[this.data.currentIndex];
    
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

  goBack() {
    wx.navigateBack();
  },

  prevQuestion() {
    if (this.data.currentIndex > 0) {
      const newIndex = this.data.currentIndex - 1;
      this.setData({
        currentIndex: newIndex,
        userAnswer: null
      }, () => {
        this.updateQuestionData();
      });
    } else {
      wx.showToast({ title: '已经是第一题了', icon: 'none' });
    }
  },

  nextQuestion() {
    if (this.data.currentIndex < this.data.totalQuestions - 1) {
      const newIndex = this.data.currentIndex + 1;
      this.setData({
        currentIndex: newIndex,
        userAnswer: null
      }, () => {
        this.updateQuestionData();
      });
    } else {
      wx.showToast({ title: '已经是最后一题了', icon: 'none' });
    }
  },

  // 更新当前题目数据
  updateQuestionData() {
    const currentQ = this.data.questions[this.data.currentIndex];
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
    const currentQ = this.data.questions[this.data.currentIndex];
    if (!currentQ) return;

    try {
      const action = this.data.isFavorited ? 'remove' : 'add';
      const res = await cloud.toggleFavorite(currentQ.id, action);

      if (res) {
        // 更新本地存储
        let favorites = wx.getStorageSync(STORAGE_KEYS.FAVORITES) || [];
        
        if (action === 'add') {
          favorites.push({
            id: currentQ.id,
            chapterTitle: this.data.chapterTitle,
            questionText: currentQ.content,
            options: currentQ.options,
            correctAnswer: currentQ.correctAnswer,
            analysisText: currentQ.analysis || '暂无解析',
            timestamp: Date.now()
          });
          wx.showToast({ title: '收藏成功', icon: 'success' });
        } else {
          favorites = favorites.filter(item => item.id !== currentQ.id);
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        }
        
        wx.setStorageSync(STORAGE_KEYS.FAVORITES, favorites);
        this.setData({ isFavorited: !this.data.isFavorited });
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  }
});
