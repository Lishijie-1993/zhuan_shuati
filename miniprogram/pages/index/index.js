Page({
  /**
   * 页面的初始数据 
   */
  data: {
    menus: [
      { name: '专项刷题', icon: '/images/icons/chapter.png', bgColor: '#EEF3FF' }, 
      { name: '题型刷题', icon: '/images/icons/type.png', bgColor: '#FDF2F2' }, 
      { name: '乱序刷题', icon: '/images/icons/random.png', bgColor: '#F2F9F2' }, 
      { name: '我的收藏', icon: '/images/icons/favorite.png', bgColor: '#FFF9E6' }, 
      { name: '我的错题', icon: '/images/icons/error.png', bgColor: '#F5F5F5' }, 
      { name: '刷知识点', icon: '/images/icons/history.png', bgColor: '#F0F7FF' }, 
      { name: '考试记录', icon: '/images/icons/notes.png', bgColor: '#F9F2FD' } 
    ]
  },

  /**
   * 菜单点击事件处理 
   */
  onMenuClick(e) {
    const name = e.currentTarget.dataset.name; 
    
    if (name === '专项刷题') {
      wx.navigateTo({ url: '/pages/category/index' });
    } else if (name === '题型刷题') {
      wx.navigateTo({ url: '/pages/type/index' });
    } else if (name === '乱序刷题') {
      // 新增：跳转至乱序刷题页面
      wx.navigateTo({ url: '/pages/random/index' }); 
    } else if (name === '我的收藏') {
      wx.navigateTo({ 
        url: '/pages/favorite/index',
        fail: () => {
          wx.showToast({ title: '请先创建收藏页面', icon: 'none' });
        }
      });
    } else if (name === '我的错题') {
      // 跳转至“我的错题”页面
      wx.navigateTo({ 
        url: '/pages/error/index',
        fail: () => {
          wx.showToast({ title: '请检查是否已创建 error 页面', icon: 'none' });
        }
      });
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  /**
   * 开始刷题点击事件 [cite: 92]
   */
  startQuiz() {
    // 跳转至默认的开始刷题页面 [cite: 92]
    wx.showToast({ title: '准备开始练习', icon: 'none' });
  },

  /**
   * 模拟考试点击事件 [cite: 93]
   */
  toExam() {
    // 跳转至模拟考试页面 [cite: 93]
    wx.showToast({ title: '正在进入模拟考试', icon: 'none' });
  }
})