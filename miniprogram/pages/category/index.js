// miniprogram/pages/category/index.js
const { ALL_CATEGORIES } = require('../../utils/config.js');

Page({
  data: {
    showPicker: false,
    selectedIndustry: '安全生产法律法规',
    selectedType: '公共科目',
    tempSelected: '安全生产法律法规',
    pickerValue: [0],
    allCategories: ALL_CATEGORIES,
    industryOptions: [],
    chapters: []
  },

  onLoad: function() {
    const options = this.data.allCategories.map(item => item.name);
    
    this.setData({
      industryOptions: options
    });

    this.refreshPageData(this.data.selectedIndustry);
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  openPicker() {
    const currentIndex = this.data.industryOptions.indexOf(this.data.selectedIndustry);
    this.setData({
      showPicker: true,
      tempSelected: this.data.selectedIndustry,
      pickerValue: [currentIndex >= 0 ? currentIndex : 0]
    });
  },

  closePicker() {
    this.setData({ showPicker: false });
  },

  onPickerChange(e) {
    const val = e.detail.value[0];
    this.setData({
      tempSelected: this.data.industryOptions[val]
    });
  },

  confirmSelection() {
    const targetName = this.data.tempSelected;
    this.refreshPageData(targetName);
    
    this.setData({
      selectedIndustry: targetName,
      showPicker: false
    });

    wx.showToast({
      title: `已切换至: ${targetName}`,
      icon: 'none'
    });
  },

  refreshPageData(name) {
    const category = this.data.allCategories.find(item => item.name === name);
    if (category) {
      this.setData({
        selectedType: category.type,
        chapters: category.chapters
      });
    }
  },

  startQuiz(e) {
    const title = e.currentTarget.dataset.title;
    wx.navigateTo({
      url: `/pages/quiz/index?title=${encodeURIComponent(title)}`
    });
  }
});
