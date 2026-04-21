// miniprogram/pages/index/index.js
Page({
  /**
   * 页面的初始数据 
   */
  data: {
    menus: [
      { name: '专项刷题', icon: '/images/icons/chapter.png', bgColor: '#EEF3FF' }, 
      { name: '题型刷题', icon: '/images/icons/type.png', bgColor: '#FDF2F2' }, 
      { name: '乱序刷题', icon: '/images/icons/random.png', bgColor: '#F2F9F2' }, 
      { name: '模拟考试', icon: '/images/icons/exam.png', bgColor: '#E6F7FF' }, // 新增：模拟考试
      { name: '我的收藏', icon: '/images/icons/favorite.png', bgColor: '#FFF9E6' }, 
      { name: '我的错题', icon: '/images/icons/error.png', bgColor: '#F5F5F5' }, 
      { name: '刷知识点', icon: '/images/icons/history.png', bgColor: '#F0F7FF' }, 
      { name: '考试记录', icon: '/images/icons/notes.png', bgColor: '#F9F2FD' } 
    ],
    // 【修复5】动态计算距离考试的天数
    daysUntilExam: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    // 【修复5】动态计算距离考试的天数（首次加载也触发）
    this._calculateDaysUntilExam();
  },

  /**
   * 生命周期函数--监听页面显示
   * 每次切回首页都重新计算倒计时，确保跨午夜时天数自动更新
   */
  onShow() {
    this._calculateDaysUntilExam();
  },

  /**
   * 计算距离考试的天数
   * 考试时间：2026年10月24日
   */
  _calculateDaysUntilExam() {
    const examDate = new Date('2026-10-24');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);
    
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.setData({
      daysUntilExam: diffDays > 0 ? diffDays : 0
    });
  },

  /**
   * 菜单点击事件处理 
   */
  onMenuClick(e) {
    const name = e.currentTarget.dataset.name; 
    
    if (name === '专项刷题') {
      // 进入专项刷题（章节练习）入口 
      wx.navigateTo({ url: '/pages/category/index' });
    } else if (name === '题型刷题') {
      // 进入按题型筛选的练习入口 
      wx.navigateTo({ url: '/pages/type/index' });
    } else if (name === '乱序刷题') {
      // 进入全题库随机乱序模式 
      wx.navigateTo({ url: '/pages/random/index' }); 
    } else if (name === '模拟考试') {
      // 跳转至模拟考试试卷列表页
      this.toExam();
    } else if (name === '我的收藏') {
      // 查看已收藏的题目
      wx.navigateTo({ 
        url: '/pages/favorite/index',
        fail: () => {
          wx.showToast({ title: '收藏页面跳转失败', icon: 'none' });
        }
      });
    } else if (name === '我的错题') {
      // 查看练习过程中的错题记录
      wx.navigateTo({ 
        url: '/pages/error/index',
        fail: () => {
          wx.showToast({ title: '错题页面跳转失败', icon: 'none' });
        }
      });
    } else if (name === '考试记录') {
      // 如果有历史记录页，跳转至此
      wx.navigateTo({ url: '/pages/history/index' });
    } else if (name === '刷知识点') {
      wx.navigateTo({ 
        url: '/pages/point/index', // 跳转到我们刚才写好的知识点页面
        fail: (err) => {
          console.error('跳转失败：', err);
          wx.showToast({ title: '页面路径未配置', icon: 'none' });
        }
      });
    } 
    // -----------------------
    else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  /**
   * 开始刷题点击事件
   * 逻辑修改：与“专项刷题”保持一致，跳转至分类选择页 
   */
  startQuiz() {
    // 统一入口，跳转至专项刷题/分类页面
    wx.navigateTo({ 
      url: '/pages/category/index',
      success: () => {
        console.log('成功进入刷题入口');
      }
    });
  },

  /**
   * 模拟考试点击事件
   * 修改：直接跳转至试卷列表页面
   */
  toExam() {
    wx.navigateTo({ 
      url: '/pages/test/index', // 跳转至试卷选择列表页
      fail: (err) => {
        console.error('跳转失败：', err);
        wx.showToast({ title: '页面正在准备中', icon: 'none' });
      }
    });
  }
})