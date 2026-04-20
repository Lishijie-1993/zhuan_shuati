Page({
  /**
   * 页面的初始数据
   */
  data: {
    chapterTitle: '第1章 金属非金属矿山概述',
    mode: 'answer', // answer: 答题模式, recite: 背题模式
    isAutoNext: false, // 是否开启自动下一题（手动/自动切换）
    currentIndex: 0, // 当前题号索引（0开始）
    totalQuestions: 164,
    correctAnswer: 'C', // 当前题目的正确答案
    userAnswer: null, // 用户在答题模式下选择的答案
    isFavorited: false, // 当前题目是否已收藏
    analysisText: '裂隙水赋存于岩石裂隙中的地下水，其特点正是水量一般不大，但水压往往较大。当裂隙水与其他水源没有水力联系时，由于缺乏水源补给，其涌水量会逐渐减少，乃至疏干。相反，如果与其他水源存在水力联系，涌水量则会因得到补给而逐步增加，这种情况容易导致突水事故的发生。因此，题目描述的特点与裂隙水完全相符。',
    options: [
      { id: 'A', text: '涌水量介于100~500m³/h' },
      { id: 'B', text: '水压大，水量丰富，一般为500~1000m³/h' },
      { id: 'C', text: '静储量大，动储量小，一般为80~500m³/h' },
      { id: 'D', text: '以静储量为主，动储量变化范围大，可由每小时10m³至数万立方米' }
    ],
    // ✅ 新增：当前题目的完整文本（用于收藏时保存）
    currentQuestionText: '根据矿床充水主要含水层的类型，将固体矿床划分为以孔隙含水层为主的充水矿床、以裂隙含水层为主的充水矿床和以岩溶含水层为主的充水矿床。下列选项中属于构造裂隙含水层型矿坑涌水特点的是（ ）。'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.title) {
      const decodedTitle = decodeURIComponent(options.title);
      this.setData({
        chapterTitle: decodedTitle
      });
      // 动态设置页面导航栏标题
      wx.setNavigationBarTitle({
        title: decodedTitle
      });
    }
    // 页面加载时检查当前题目收藏状态
    this.checkFavoriteStatus();
  },

  /**
   * 生命周期函数--监听页面显示（✅ 关键：确保从收藏页返回时能刷新状态）
   */
  onShow() {
    // 每次页面显示时重新检查收藏状态，避免缓存不一致
    this.checkFavoriteStatus();
  },

  /**
   * 检查当前题目的收藏状态
   */
  checkFavoriteStatus() {
    try {
      const favorites = wx.getStorageSync('my_favorites') || [];
      // 使用"章节名+索引"作为临时唯一ID，实际开发建议使用题目本身的唯一ID
      const questionId = `${this.data.chapterTitle}_${this.data.currentIndex}`;
      const isFavorited = favorites.some(item => item.id === questionId);
      this.setData({ isFavorited });
    } catch (e) {
      console.error('读取收藏状态失败:', e);
      this.setData({ isFavorited: false });
    }
  },

  /**
   * 切换 手动/自动 模式
   */
  toggleAutoNext() {
    this.setData({
      isAutoNext: !this.data.isAutoNext
    });
    wx.showToast({
      title: this.data.isAutoNext ? '已开启自动下一题' : '已切换为手动模式',
      icon: 'none'
    });
  },

  /**
   * 切换 答题/背题 模式
   */
  switchMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ 
      mode,
      userAnswer: null // 切换模式时清空已选答案，保证重新练习
    });
  },

  /**
   * 用户点击选项 (答题模式专用)
   */
  selectOption(e) {
    // 如果是背题模式，或者当前题目已经点击过答案，则不再触发
    if (this.data.mode === 'recite' || this.data.userAnswer) {
      return;
    }

    const selectedId = e.currentTarget.dataset.id;
    this.setData({
      userAnswer: selectedId
    });

    // 自动下一题逻辑：
    // 如果处于答题模式、开启了自动下一题、且用户答对了
    if (this.data.mode === 'answer' && this.data.isAutoNext && selectedId === this.data.correctAnswer) {
      // 延迟一段时间跳转，让用户看一眼选对的绿色反馈
      setTimeout(() => {
        this.nextQuestion();
      }, 800); 
    }
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 底部操作：上一题
   */
  prevQuestion() {
    if (this.data.currentIndex > 0) {
      this.setData({
        currentIndex: this.data.currentIndex - 1,
        userAnswer: null // 切换题目重置用户答案
      }, () => {
        // 切换题目后重新检查收藏状态
        this.checkFavoriteStatus();
      });
    } else {
      wx.showToast({
        title: '已经是第一题了',
        icon: 'none'
      });
    }
  },

  /**
   * 底部操作：点击解析
   */
  onAnalysis() {
    // 强制显示解析（针对答题模式下想提前看解析的情况）
    if(this.data.mode === 'answer' && !this.data.userAnswer) {
      this.setData({ userAnswer: 'SHOW_ANALYSIS' }); // 伪造一个状态来触发WXML中的解析显示
    }
    wx.showToast({
      title: '查看详细解析',
      icon: 'none'
    });
  },

  /**
   * 底部操作：收藏/取消收藏题目 ✅ 核心修复
   */
  onFavorite() {
    try {
      // ✅ 统一使用 'my_favorites' 作为 Storage Key
      let favorites = wx.getStorageSync('my_favorites') || [];
      const questionId = `${this.data.chapterTitle}_${this.data.currentIndex}`;
      const isNowFavorited = !this.data.isFavorited;

      if (isNowFavorited) {
        // ✅ 执行收藏：构造完整题目对象（确保收藏页能正常渲染）
        const favoriteItem = {
          id: questionId,                          // ✅ 唯一标识（用于去重和查找）
          chapterTitle: this.data.chapterTitle,    // ✅ 章节标题
          questionText: this.data.currentQuestionText || this.data.options[0]?.text || '', // ✅ 题目文本（收藏页WXML依赖此字段）
          options: this.data.options,              // ✅ 选项数组（收藏页渲染选项依赖）
          correctAnswer: this.data.correctAnswer,  // ✅ 正确答案
          analysisText: this.data.analysisText || '暂无解析', // ✅ 解析文本
          timestamp: Date.now()                    // ✅ 收藏时间（可选，便于排序）
        };
        
        // ✅ 防止重复收藏（双重保险）
        const exists = favorites.some(item => item.id === questionId);
        if (!exists) {
          favorites.push(favoriteItem);
          wx.setStorageSync('my_favorites', favorites);
          wx.showToast({ title: '收藏成功', icon: 'success' });
        } else {
          wx.showToast({ title: '已收藏过该题', icon: 'none' });
        }
      } else {
        // ✅ 取消收藏：从数组中移除
        const beforeLength = favorites.length;
        favorites = favorites.filter(item => item.id !== questionId);
        
        if (favorites.length < beforeLength) {
          wx.setStorageSync('my_favorites', favorites);
          wx.showToast({ title: '已取消收藏', icon: 'none' });
        }
      }

      // ✅ 更新页面收藏按钮状态
      this.setData({ isFavorited: isNowFavorited });
      
    } catch (e) {
      console.error('收藏操作失败:', e);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  },

  /**
   * 底部操作：下一题
   */
  nextQuestion() {
    if (this.data.currentIndex < this.data.totalQuestions - 1) {
      this.setData({
        currentIndex: this.data.currentIndex + 1,
        userAnswer: null // 切换题目重置用户答案
      }, () => {
        // 切换题目后重新检查收藏状态
        this.checkFavoriteStatus();
      });
    } else {
      wx.showToast({
        title: '已经是最后一题了',
        icon: 'none'
      });
    }
  }
})