// pages/quiz/index.js
const cloud = require('../../utils/cloud.js');
const { STORAGE_KEYS, getUserScopedKey } = require('../../utils/constants.js');

// 答题历史记录最大存储条数，超过后清理旧数据
const MAX_HISTORY_SIZE = 500;

Page({
  data: {
    chapterTitle: '第1章 金属非金属矿山概述',
    mode: 'answer',
    isAutoNext: false,
    currentIndex: 0,
    totalQuestions: 0,
    correctAnswer: '',
    userAnswer: null,  // 用户最终确认的答案（单选题：字符串，多选题：逗号分隔字符串）
    userAnswers: {},  // 所有题目的选择状态（对象：{ questionId: answer }）
    isFavorited: false,
    analysisText: '',
    options: [],
    currentQuestionText: '',
    currentQuestionId: '',  // 当前题目ID，用于追踪
    currentQuestionType: '',  // 当前题目类型
    // 注意：questions 数组不再存储在 data 中，避免 setData 巨型数组性能问题
    // 题目列表存储在内存变量 _questions 中
    statusBarHeight: 20,  // 状态栏高度，默认值
    // 答题历史记录，用于保留每道题的答案
    answerHistory: {},  // { questionId: { answer: 'A', timestamp: 123456 } }
    // 已答题目列表（用于快速判断是否已答）
    answeredQuestions: {},  // { questionId: true }
    // 是否显示解析（独立于 userAnswer，避免触发答案高亮）
    showAnalysis: false
  },

  // 答题历史记录相关变量
  _answerHistory: {},
  // 题目列表存储在内存中，不通过 setData 传递
  _questions: [],
  // 当前题目索引（内存变量）
  _currentIndex: 0,
  // syncProgress 防抖定时器
  _syncProgressTimer: null,
  // 防抖延迟时间（毫秒）
  _SYNC_DEBOUNCE_MS: 2000,
  // 答对计数累加器（用于解决 clearTimeout 后参数被覆盖的问题）
  // 用户答对时 +1，翻页时不变化，定时器触发时用累加值同步后归零
  _syncCorrectAccum: 0,

  onLoad(options) {
    // 标记页面已挂载，用于防止内存泄漏
    this._isMounted = true;

    // 获取状态栏高度，用于自定义导航栏
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 20;

    this.setData({ statusBarHeight });

    // 从本地缓存恢复答题历史
    this._restoreAnswerHistory();

    if (options.mode === 'error') {
      // 错题练习模式
      this.setData({
        chapterTitle: '错题练习',
        mode: 'error'
      });
      wx.setNavigationBarTitle({ title: '错题练习' });
    } else if (options.mode === 'random') {
      // 乱序练习模式
      this.setData({
        chapterTitle: decodeURIComponent(options.title || '乱序练习'),
        mode: 'answer'
      });
      wx.setNavigationBarTitle({ title: '乱序练习' });
    } else if (options.title) {
      const decodedTitle = decodeURIComponent(options.title);
      this.setData({
        chapterTitle: decodedTitle
      });
      wx.setNavigationBarTitle({ title: decodedTitle });
    }

    // 保存当前模式，用于 loadQuestions 判断
    this._currentMode = options.mode || 'normal';

    // 如果有指定题目ID，加载单题
    if (options.id) {
      this.loadSingleQuestion(options.id);
    } else {
      this.loadQuestions();
    }
  },

  onUnload() {
    // 页面卸载时清理所有定时器，防止内存泄漏
    this._isMounted = false;
    if (this._autoNextTimer) {
      clearTimeout(this._autoNextTimer);
      this._autoNextTimer = null;
    }
    if (this._syncProgressTimer) {
      clearTimeout(this._syncProgressTimer);
      this._syncProgressTimer = null;
    }
    // 保存答题历史到本地缓存
    this._saveAnswerHistory();
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
        // 存储到内存变量，不通过 setData 传递
        this._questions = res.list;
        this._currentIndex = 0;

        const firstQ = this._questions[0];
        const savedAnswer = this._getHistoryAnswer(firstQ.id);
        const isMulti = firstQ.type === 'multiple';

        // 【修复1】统一初始化：单选题也用 userAnswers 存储，用于 WXS 显示选中态
        // 【修复2】userAnswer 只在"确认答案"后才设置，避免答案提前暴露
        const initialAnswer = savedAnswer ? (isMulti ? savedAnswer.join(',') : savedAnswer) : null;

        this.setData({
          totalQuestions: this._questions.length,
          currentQuestionText: firstQ.content,
          options: firstQ.options,
          correctAnswer: firstQ.correctAnswer,
          analysisText: firstQ.analysis,
          currentQuestionId: firstQ.id,
          currentQuestionType: firstQ.type,
          currentIndex: 0,
          userAnswer: initialAnswer,  // 恢复历史答案，但不立即显示（需要在答题模式下确认）
          userAnswers: { [firstQ.id]: savedAnswer || (isMulti ? [] : null) },  // 单选题存 null，多选题存 []
          showAnalysis: false
        });

        this.checkFavoriteStatus();
      }

      wx.hideLoading();
    } catch (err) {
      console.error('加载题目失败:', err);
      wx.hideLoading();
    }
  },

  // 加载题目列表（优化：题目存储在内存变量中，不通过 setData）
  async loadQuestions() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 根据模式决定调用方式
      // 【修复2】使用 this._currentMode 来正确判断乱序模式
      const apiMode = this._currentMode === 'error' ? 'error' : (this._currentMode === 'random' ? 'random' : 'normal');
      const chapterTitle = apiMode === 'error' || apiMode === 'random' ? null : this.data.chapterTitle;

      const res = await cloud.getQuestions(chapterTitle, apiMode);

      if (res && res.list && res.list.length > 0) {
        // 【修复2】如果是乱序模式，对返回的题目进行本地随机打乱
        if (this._currentMode === 'random') {
          res.list = this._shuffleArray(res.list);
        }

        // 存储到内存变量，不通过 setData 传递
        this._questions = res.list;
        this._currentIndex = 0;

        const firstQ = this._questions[0];
        const savedAnswer = this._getHistoryAnswer(firstQ.id);
        const isMulti = firstQ.type === 'multiple';

        // 【修复1】统一初始化：单选题也用 userAnswers 存储，用于 WXS 显示选中态
        // 【修复2】userAnswer 只在"确认答案"后才设置，避免答案提前暴露
        const initialAnswer = savedAnswer ? (isMulti ? savedAnswer.join(',') : savedAnswer) : null;

        this.setData({
          totalQuestions: this._questions.length,
          currentQuestionText: firstQ.content,
          options: firstQ.options,
          correctAnswer: firstQ.correctAnswer,
          analysisText: firstQ.analysis,
          currentQuestionId: firstQ.id,
          currentQuestionType: firstQ.type,
          currentIndex: 0,
          userAnswer: initialAnswer,
          userAnswers: { [firstQ.id]: savedAnswer || (isMulti ? [] : null) },
          showAnalysis: false
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

  // 数组随机打乱（Fisher-Yates 算法）
  _shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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

    // 存储到内存变量，不通过 setData 传递
    this._questions = mockQuestions;
    this._currentIndex = 0;

    const firstQ = this._questions[0];
    const savedAnswer = this._getHistoryAnswer(firstQ.id);
    const isMulti = firstQ.type === 'multiple';

    const initialAnswer = savedAnswer ? (isMulti ? savedAnswer.join(',') : savedAnswer) : null;

    this.setData({
      totalQuestions: this._questions.length,
      currentQuestionText: firstQ.content,
      options: firstQ.options,
      correctAnswer: firstQ.correctAnswer,
      analysisText: firstQ.analysis,
      currentQuestionId: firstQ.id,
      currentQuestionType: firstQ.type,
      currentIndex: 0,
      userAnswer: initialAnswer,
      userAnswers: { [firstQ.id]: savedAnswer || (isMulti ? [] : null) },
      showAnalysis: false
    });

    this.checkFavoriteStatus();
  },

  // 从本地缓存恢复答题历史
  _restoreAnswerHistory() {
    try {
      const userScopedKey = getUserScopedKey('answerHistory');
      const saved = wx.getStorageSync(userScopedKey);
      if (saved && typeof saved === 'object') {
        this._answerHistory = saved;
        this.setData({ answerHistory: saved });
      }
    } catch (e) {
      console.error('恢复答题历史失败:', e);
    }
  },

  // 保存答题历史到本地缓存
  _saveAnswerHistory() {
    try {
      // 【修复4】定期清理旧数据，防止 Storage 堆积
      this._cleanupOldHistory();

      const userScopedKey = getUserScopedKey('answerHistory');
      wx.setStorageSync(userScopedKey, this._answerHistory);
    } catch (e) {
      console.error('保存答题历史失败:', e);
    }
  },

  // 清理旧的历史记录，防止 Storage 堆积
  _cleanupOldHistory() {
    const keys = Object.keys(this._answerHistory);

    // 如果记录数量超过限制，开始清理
    if (keys.length > MAX_HISTORY_SIZE) {
      // 按时间戳排序（从旧到新）
      const sortedKeys = keys.sort((a, b) => {
        const timeA = this._answerHistory[a].timestamp || 0;
        const timeB = this._answerHistory[b].timestamp || 0;
        return timeA - timeB;
      });

      // 删除最旧的 20% 记录
      const deleteCount = Math.floor(MAX_HISTORY_SIZE * 0.2);
      for (let i = 0; i < deleteCount; i++) {
        delete this._answerHistory[sortedKeys[i]];
      }

      console.log(`清理了 ${deleteCount} 条旧的历史记录，剩余 ${Object.keys(this._answerHistory).length} 条`);
    }
  },

  // 记录答案到历史
  _recordAnswer(questionId, answer, isMultiple = false) {
    if (!questionId) return;
    this._answerHistory[questionId] = {
      answer: answer,
      isMultiple: isMultiple,
      timestamp: Date.now()
    };
    // 标记已答
    const answeredQuestions = { ...this.data.answeredQuestions, [questionId]: true };
    this.setData({
      answerHistory: this._answerHistory,
      answeredQuestions
    });
  },

  // 获取历史答案
  _getHistoryAnswer(questionId) {
    const record = this._answerHistory[questionId];
    if (record) {
      return record.isMultiple ? (record.answer || []) : record.answer;
    }
    return null;
  },

  // 防抖同步进度（修复：使用累加计数器，避免 clearTimeout 后参数被覆盖）
  // 答对 -> _syncCorrectAccum++ -> 设 2s 定时器
  // 翻页/其他 -> 不改变 _syncCorrectAccum -> 设/重设 2s 定时器
  // 定时器触发 -> 用累加值同步 -> 清零累加器
  // 无论翻页多快，累加的"答对数"都不会丢失
  _debouncedSyncProgress(correct = 0) {
    // 累加答对计数（只增不减，直到定时器触发后归零）
    if (correct > 0) {
      this._syncCorrectAccum += correct;
    }

    // 重设/新建 2 秒防抖定时器
    if (this._syncProgressTimer) {
      clearTimeout(this._syncProgressTimer);
    }

    this._syncProgressTimer = setTimeout(() => {
      this._syncProgressTimer = null;
      if (this._isMounted !== false && this._syncCorrectAccum > 0) {
        // 用累加值同步，答对了几道就同步几道
        cloud.syncProgress(this.data.chapterTitle, this.data.currentIndex, this._syncCorrectAccum)
          .catch(err => console.error('同步进度失败:', err))
          .finally(() => {
            // 同步完成后归零，等待下一轮累加
            this._syncCorrectAccum = 0;
          });
      }
    }, this._SYNC_DEBOUNCE_MS);
  },

  // 获取当前题目（从内存变量读取，不经过 setData）
  getCurrentQuestion() {
    if (!this._questions || this._questions.length === 0) return null;
    if (this._currentIndex < 0 || this._currentIndex >= this._questions.length) return null;
    return this._questions[this._currentIndex];
  },

  // 检查收藏状态（使用用户隔离的存储）
  checkFavoriteStatus() {
    if (!this._questions || this._questions.length === 0) return;

    try {
      // 使用用户隔离的存储键，防止多用户数据串号
      const userScopedKey = getUserScopedKey('favorites');
      const favorites = wx.getStorageSync(userScopedKey) || [];
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
      userAnswers: {},
      showAnalysis: false
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

    const questionId = currentQ.id || this.data.currentQuestionId;
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
  async handleSingleChoice(selectedId, currentQ) {
    // 背题模式或已确认则忽略
    if (this.data.mode === 'recite') return;

    // 【修复3】如果已确认答案，则不允许修改
    if (this.data.userAnswer) {
      return;
    }

    const questionId = currentQ.id || this.data.currentQuestionId;

    // 【修复3】只更新 userAnswers 用于显示选中态，不设置 userAnswer
    // userAnswer 只在"确认答案"后才设置
    this.setData({
      userAnswers: { ...this.data.userAnswers, [questionId]: selectedId }
    });
  },

  // 确认单选题答案
  confirmSingleChoice() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    const questionId = currentQ.id || this.data.currentQuestionId;
    const userSelected = this.data.userAnswers[questionId];

    // 必须先选择一个答案才能确认
    if (!userSelected) {
      wx.showToast({ title: '请先选择一个答案', icon: 'none' });
      return;
    }

    // 【修复3】确认答案：设置 userAnswer，触发答案判定
    this.setData({ userAnswer: userSelected });

    // 记录答案到历史
    this._recordAnswer(questionId, userSelected, false);

    // 答对时，使用防抖方法同步进度
    if (userSelected === this.data.correctAnswer) {
      this._debouncedSyncProgress(1);

      if (this.data.mode === 'error') {
        wx.setStorageSync('error_list_dirty', true);
      }
    } else {
      // 答错，记录错题
      cloud.reportError(questionId, userSelected).catch(err => console.error('记录错题失败:', err));
      wx.setStorageSync('error_list_dirty', true);
    }

    // 自动下一题
    if (this.data.mode === 'answer' && this.data.isAutoNext && userSelected === this.data.correctAnswer) {
      this._autoNextTimer = setTimeout(() => {
        if (this._isMounted !== false) {
          this.nextQuestion();
        }
      }, 800);
    }
  },

  // 提交多选题答案
  submitMultipleChoice() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    const questionId = currentQ.id || this.data.currentQuestionId;
    const userAns = this.data.userAnswers[questionId] || [];

    // 判断是否答对（比较排序后的数组）
    const correctArr = this.normalizeAnswerArray(currentQ.correctAnswer);
    const userArr = userAns.sort();

    const isCorrect = JSON.stringify(correctArr) === JSON.stringify(userArr);

    // 记录答案到历史（用于保留翻页时的答案）
    this._recordAnswer(questionId, userArr, true);

    // 答对时，使用防抖方法同步进度（限制调用频率）
    if (isCorrect) {
      this._debouncedSyncProgress(1);
    } else {
      // 答错，记录错题
      cloud.reportError(questionId, userArr.join(','))
        .catch(err => console.error('记录错题失败:', err));
    }

    // 显示结果
    this.setData({ userAnswer: userArr.length > 0 ? userArr.join(',') : '' });

    // 自动下一题（使用实例变量追踪定时器）
    if (this.data.isAutoNext) {
      this._autoNextTimer = setTimeout(() => {
        // 页面可能已卸载，需要检查
        if (this._isMounted !== false) {
          this.nextQuestion();
        }
      }, 800);
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

  // 上一题（保留当前题目答案历史）
  prevQuestion() {
    // 【修复3】清除自动下一题的计时器，防止与手动翻页冲突
    if (this._autoNextTimer) {
      clearTimeout(this._autoNextTimer);
      this._autoNextTimer = null;
    }

    if (this._questions.length === 0) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    if (this._currentIndex > 0) {
      // 保存当前题目状态到内存中的 userAnswers
      this._syncCurrentAnswerToUserAnswers();

      this._currentIndex = this._currentIndex - 1;
      const prevQ = this._questions[this._currentIndex];

      // 获取上一题的之前答案（如果有的话）
      const prevAnswer = this._getHistoryAnswer(prevQ.id);
      const isMulti = prevQ.type === 'multiple';

      // 【修复2】合并 userAnswers：保留其他题目的答案，只更新当前题
      const newUserAnswers = { ...this.data.userAnswers, [prevQ.id]: prevAnswer || (isMulti ? [] : null) };

      this.setData({
        currentIndex: this._currentIndex,
        currentQuestionId: prevQ.id,
        currentQuestionType: prevQ.type,
        userAnswer: prevAnswer ? (isMulti ? prevAnswer.join(',') : prevAnswer) : null,
        userAnswers: newUserAnswers,
        showAnalysis: false
      }, () => {
        this.updateQuestionData();
      });
    } else {
      wx.showToast({ title: '已经是第一题了', icon: 'none' });
    }
  },

  // 下一题（保留当前题目答案历史）
  nextQuestion() {
    // 【修复3】清除自动下一题的计时器，防止与手动翻页冲突
    if (this._autoNextTimer) {
      clearTimeout(this._autoNextTimer);
      this._autoNextTimer = null;
    }

    if (this._questions.length === 0) {
      wx.showToast({ title: '暂无题目', icon: 'none' });
      return;
    }
    if (this._currentIndex < this._questions.length - 1) {
      // 保存当前题目状态到内存中的 userAnswers
      this._syncCurrentAnswerToUserAnswers();

      this._currentIndex = this._currentIndex + 1;
      const nextQ = this._questions[this._currentIndex];

      // 获取下一题的之前答案（如果有的话）
      const nextAnswer = this._getHistoryAnswer(nextQ.id);
      const isMulti = nextQ.type === 'multiple';

      // 【修复2】合并 userAnswers：保留其他题目的答案，只更新当前题
      const newUserAnswers = { ...this.data.userAnswers, [nextQ.id]: nextAnswer || (isMulti ? [] : null) };

      this.setData({
        currentIndex: this._currentIndex,
        currentQuestionId: nextQ.id,
        currentQuestionType: nextQ.type,
        userAnswer: nextAnswer ? (isMulti ? nextAnswer.join(',') : nextAnswer) : null,
        userAnswers: newUserAnswers,
        showAnalysis: false
      }, () => {
        this.updateQuestionData();
      });
    } else {
      wx.showToast({ title: '已经是最后一题了', icon: 'none' });
    }
  },

  // 将当前题目的答案同步到 userAnswers（用于切换题目时保存状态）
  _syncCurrentAnswerToUserAnswers() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    const questionId = currentQ.id || this.data.currentQuestionId;
    const isMulti = currentQ.type === 'multiple';

    // 单选题：优先使用 userAnswers[questionId] 中已有的临时选择
    // 多选题：使用 userAnswers[questionId] 数组
    let currentAnswer;
    if (isMulti) {
      currentAnswer = this.data.userAnswers[questionId] || [];
    } else {
      // 单选题：优先使用 userAnswers 中的临时选择（用户已选但未确认）
      // 只有当 userAnswers[questionId] 不存在时，才使用 userAnswer（已确认的答案）
      currentAnswer = this.data.userAnswers[questionId] || this.data.userAnswer;
    }

    // 只有当有答案时才更新
    if (currentAnswer) {
      // 创建一个新的 userAnswers 对象，避免直接修改
      const newUserAnswers = { ...this.data.userAnswers, [questionId]: currentAnswer };
      this.setData({ userAnswers: newUserAnswers });
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

    // 检查收藏状态
    this.checkFavoriteStatus();
  },

  onAnalysis() {
    // 【修复6】使用独立的 showAnalysis 变量，不影响 userAnswer
    this.setData({ showAnalysis: true });
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
  },

  // 报告题目错误
  onReportError() {
    const currentQ = this.getCurrentQuestion();
    if (!currentQ) return;

    wx.showModal({
      title: '纠错',
      content: '如果发现题目有误，请填写具体问题，我们会尽快核实处理。',
      confirmText: '确定',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // TODO: 可以调用云函数提交纠错
          wx.showToast({ title: '感谢反馈', icon: 'success' });
        }
      }
    });
  }
});
