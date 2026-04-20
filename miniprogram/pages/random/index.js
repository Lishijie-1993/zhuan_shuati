Page({
  data: {
    showPicker: false,
    selectedIndustry: '安全生产法律法规',
    selectedType: '公共科目',
    tempSelected: '安全生产法律法规',
    pickerValue: [0],
    // 复用科目配置数据
    allCategories: [
      { name: '安全生产法律法规', type: '公共科目', chapters: ['全科乱序练习'] },
      { name: '安全生产管理', type: '公共科目', chapters: ['全科乱序练习'] },
      { name: '安全生产技术基础', type: '公共科目', chapters: ['全科乱序练习'] },
      { name: '煤矿安全', type: '专业科目', chapters: ['全科乱序练习'] },
      { name: '建筑施工安全', type: '专业科目', chapters: ['全科乱序练习'] },
      { name: '金属非金属矿山安全', type: '专业科目', chapters: ['全科乱序练习'] },
      { name: '化工安全', type: '专业科目', chapters: ['全科乱序练习'] },
      { name: '金属冶炼安全', type: '专业科目', chapters: ['全科乱序练习'] },
      { name: '道路运输安全', type: '专业科目', chapters: ['全科乱序练习'] },
      { name: '其他安全', type: '专业科目', chapters: ['全科乱序练习'] }
    ],
    industryOptions: [],
    chapters: []
  },

  onLoad: function() {
    const options = this.data.allCategories.map(item => item.name);
    this.setData({ industryOptions: options });
    this.refreshPageData(this.data.selectedIndustry);
  },

  goBack() { wx.navigateBack({ delta: 1 }); },

  openPicker() {
    const currentIndex = this.data.industryOptions.indexOf(this.data.selectedIndustry);
    this.setData({
      showPicker: true,
      tempSelected: this.data.selectedIndustry,
      pickerValue: [currentIndex >= 0 ? currentIndex : 0]
    });
  },

  closePicker() { this.setData({ showPicker: false }); },

  onPickerChange(e) {
    const val = e.detail.value[0];
    this.setData({ tempSelected: this.data.industryOptions[val] });
  },

  confirmSelection() {
    const targetName = this.data.tempSelected;
    this.refreshPageData(targetName);
    this.setData({ selectedIndustry: targetName, showPicker: false });
  },

  refreshPageData(name) {
    const category = this.data.allCategories.find(item => item.name === name);
    if (category) {
      this.setData({ selectedType: category.type, chapters: category.chapters });
    }
  },

  // 开始乱序刷题
  startQuiz(e) {
    const title = this.data.selectedIndustry;
    wx.navigateTo({
      // 传入 mode=random 告知 quiz 页面需要打乱题目顺序
      url: `/pages/quiz/index?title=${encodeURIComponent(title)}&mode=random`
    });
  }
});