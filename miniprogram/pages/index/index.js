Page({
  data: {
    menus: [
      { name: '专项刷题', icon: '/images/icons/chapter.png', bgColor: '#EEF3FF' },
      { name: '题型刷题', icon: '/images/icons/type.png', bgColor: '#FDF2F2' },
      { name: '乱序刷题', icon: '/images/icons/random.png', bgColor: '#F2F9F2' },
      { name: '我的收藏', icon: '/images/icons/favorite.png', bgColor: '#FFF9E6' },
      { name: '我的错题', icon: '/images/icons/error.png', bgColor: '#F5F5F5' },
      { name: '未做习题', icon: '/images/icons/todo.png', bgColor: '#F2F2F2' },
      { name: '刷知识点', icon: '/images/icons/history.png', bgColor: '#F0F7FF' },
      { name: '考试记录', icon: '/images/icons/notes.png', bgColor: '#F9F2FD' }
    ]
  },

  onMenuClick(e) {
    const name = e.currentTarget.dataset.name;
    if (name === '专项刷题') {
      wx.navigateTo({ url: '/pages/category/index' });
    } else if (name === '题型刷题') {
      wx.navigateTo({ url: '/pages/type/index' }); // 跳转至题型刷题
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  startQuiz() {
    // 跳转至默认的开始刷题页面
    wx.showToast({ title: '准备开始练习', icon: 'none' });
  },

  toExam() {
    // 跳转至模拟考试页面
    wx.showToast({ title: '正在进入模拟考试', icon: 'none' });
  }
})