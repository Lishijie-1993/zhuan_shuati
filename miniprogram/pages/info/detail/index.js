// pages/info/detail/index.js
Page({
  data: {
    article: {
      id: 1,
      title: '2026年中级注册安全工程师考试时间确定，报名即将开始',
      category: '考试动态',
      views: '2.3万',
      likes: '328',
      publishTime: '2026-04-20 10:30',
      coverImage: '/images/news/news1.png',
      content: `根据人力资源社会保障部办公厅发布的《关于2026年度专业技术人员职业资格考试工作计划及有关事项的通知》，2026年中级注册安全工程师考试时间已确定为10月17日、18日。

一、考试时间安排
2026年10月17日：
• 上午 9:00-11:30 安全生产法律法规
• 下午 14:00-16:30 安全生产管理

2026年10月18日：
• 上午 9:00-11:30 安全生产技术基础
• 下午 14:00-16:30 安全生产专业实务

二、报名时间
各省市报名时间预计从8月份开始，具体时间以当地人事考试中心通知为准。建议考生提前准备好以下材料：
• 有效身份证件
• 学历证书原件
• 从事安全生产业务工作年限证明
• 电子证件照片

三、备考建议
1. 制定合理的学习计划，建议每天保证2-3小时的有效学习时间。

2. 重点关注近年真题出题方向，特别是法律法规的更新内容。

3. 案例分析题需要多做练习，掌握答题技巧。

4. 建议参加模拟考试，检验学习效果。

四、注意事项
• 考试采用闭卷笔试形式
• 考试成绩实行4年为一个周期的滚动管理办法
• 免试部分科目的人员须在连续2个考试年度内通过应试科目

祝愿各位考生考试顺利！`
    },
    relatedArticles: [
      {
        id: 2,
        title: '《安全生产法》最新修订解读，这些变化与你息息相关',
        publishTime: '2026-04-20',
        coverImage: '/images/news/news2.png'
      },
      {
        id: 3,
        title: '备考攻略：如何高效利用最后一个月冲刺注安考试',
        publishTime: '2026-04-19',
        coverImage: '/images/news/news3.png'
      }
    ],
    isLiked: false,
    isCollected: false
  },

  onLoad(options) {
    const id = options.id;
    if (id) {
      this.loadArticle(id);
    }
  },

  // 加载文章详情
  loadArticle(id) {
    // 模拟加载
    console.log('加载文章:', id);
  },

  // 切换点赞
  toggleLike() {
    const isLiked = !this.data.isLiked;
    const likes = parseInt(this.data.article.likes) + (isLiked ? 1 : -1);
    
    this.setData({
      isLiked,
      ['article.likes']: likes.toString()
    });
    
    wx.showToast({
      title: isLiked ? '点赞成功' : '取消点赞',
      icon: 'none'
    });
  },

  // 切换收藏
  toggleCollect() {
    const isCollected = !this.data.isCollected;
    
    this.setData({ isCollected });
    
    wx.showToast({
      title: isCollected ? '收藏成功' : '取消收藏',
      icon: 'none'
    });
  },

  // 分享文章
  shareArticle() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 跳转文章
  goToArticle(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/info/detail/index?id=${id}`
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.article.title,
      path: `/pages/info/detail/index?id=${this.data.article.id}`,
      imageUrl: this.data.article.coverImage
    };
  }
});
