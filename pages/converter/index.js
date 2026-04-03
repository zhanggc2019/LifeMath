const {
  getConverterCategories,
  getCategoryUnits,
  getCategoryDefaults,
  convertUnitValue,
  formatUnitValue,
  buildFormulaText
} = require('../../utils/converter');

Page({
  data: {
    categories: getConverterCategories(),
    activeCategoryKey: 'length',
    units: [],
    unitOptions: [],
    fromUnitIndex: 0,
    toUnitIndex: 0,
    fromUnit: null,
    toUnit: null,
    fromValue: '1',
    toValue: '',
    formulaText: ''
  },

  /**
   * 页面加载时初始化默认分类。
   */
  onLoad() {
    this.initCategory('length');
  },

  /**
   * 初始化某个单位分类及默认单位。
   * @param {string} categoryKey - 分类键
   */
  initCategory(categoryKey) {
    const units = getCategoryUnits(categoryKey);
    const defaults = getCategoryDefaults(categoryKey);
    const fromIndex = this.findUnitIndex(units, defaults.fromCode);
    const toIndex = this.findUnitIndex(units, defaults.toCode);

    this.setData(
      {
        activeCategoryKey: categoryKey,
        units,
        unitOptions: units.map(unit => `${unit.name} (${unit.symbol})`),
        fromUnitIndex: fromIndex,
        toUnitIndex: toIndex,
        fromUnit: units[fromIndex] || null,
        toUnit: units[toIndex] || null,
        fromValue: '1'
      },
      () => this.updateResult()
    );
  },

  /**
   * 根据单位代码查找其索引。
   * @param {Array<object>} units - 单位列表
   * @param {string} unitCode - 单位代码
   * @returns {number} 单位索引
   */
  findUnitIndex(units, unitCode) {
    const idx = units.findIndex(unit => unit.code === unitCode);
    return idx >= 0 ? idx : 0;
  },

  /**
   * 统一刷新换算结果与公式文本。
   */
  updateResult() {
    const { activeCategoryKey, fromValue, fromUnit, toUnit } = this.data;
    const numericValue = Number(fromValue);

    if (!fromUnit || !toUnit) {
      this.setData({ toValue: '', formulaText: '' });
      return;
    }

    if (fromValue === '' || Number.isNaN(numericValue)) {
      this.setData({ toValue: '', formulaText: '请输入有效数字' });
      return;
    }

    const converted = convertUnitValue(activeCategoryKey, numericValue, fromUnit.code, toUnit.code);
    const inputText = formatUnitValue(numericValue);
    const outputText = formatUnitValue(converted);

    this.setData({
      toValue: outputText,
      formulaText: buildFormulaText(inputText, outputText, fromUnit, toUnit)
    });
  },

  /**
   * 切换换算分类。
   * @param {object} e - 事件对象
   */
  onCategoryChange(e) {
    const categoryKey = e.currentTarget.dataset.key;
    if (!categoryKey || categoryKey === this.data.activeCategoryKey) return;
    this.initCategory(categoryKey);
  },

  /**
   * 输入换算源数值。
   * @param {object} e - 事件对象
   */
  onFromValueInput(e) {
    this.setData({ fromValue: e.detail.value }, () => this.updateResult());
  },

  /**
   * 切换来源单位。
   * @param {object} e - 事件对象
   */
  onFromUnitChange(e) {
    const index = Number(e.detail.value) || 0;
    this.setData(
      {
        fromUnitIndex: index,
        fromUnit: this.data.units[index] || null
      },
      () => this.updateResult()
    );
  },

  /**
   * 切换目标单位。
   * @param {object} e - 事件对象
   */
  onToUnitChange(e) {
    const index = Number(e.detail.value) || 0;
    this.setData(
      {
        toUnitIndex: index,
        toUnit: this.data.units[index] || null
      },
      () => this.updateResult()
    );
  },

  /**
   * 交换来源单位与目标单位。
   */
  swapUnits() {
    this.setData(
      {
        fromUnitIndex: this.data.toUnitIndex,
        toUnitIndex: this.data.fromUnitIndex,
        fromUnit: this.data.toUnit,
        toUnit: this.data.fromUnit
      },
      () => this.updateResult()
    );
  },

  /**
   * 重置当前分类的输入与单位选择。
   */
  resetConverter() {
    this.initCategory(this.data.activeCategoryKey);
  }
});
