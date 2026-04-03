/**
 * 单位换算配置与计算工具。
 */
const CATEGORY_CONFIG = [
  {
    key: 'length',
    name: '长度',
    type: 'linear',
    defaultFrom: 'm',
    defaultTo: 'km',
    units: [
      { code: 'mm', name: '毫米', symbol: 'mm', factor: 0.001 },
      { code: 'cm', name: '厘米', symbol: 'cm', factor: 0.01 },
      { code: 'm', name: '米', symbol: 'm', factor: 1 },
      { code: 'km', name: '千米', symbol: 'km', factor: 1000 },
      { code: 'in', name: '英寸', symbol: 'in', factor: 0.0254 },
      { code: 'ft', name: '英尺', symbol: 'ft', factor: 0.3048 }
    ]
  },
  {
    key: 'weight',
    name: '重量',
    type: 'linear',
    defaultFrom: 'kg',
    defaultTo: 'g',
    units: [
      { code: 'mg', name: '毫克', symbol: 'mg', factor: 0.000001 },
      { code: 'g', name: '克', symbol: 'g', factor: 0.001 },
      { code: 'kg', name: '千克', symbol: 'kg', factor: 1 },
      { code: 't', name: '吨', symbol: 't', factor: 1000 },
      { code: 'lb', name: '磅', symbol: 'lb', factor: 0.45359237 }
    ]
  },
  {
    key: 'temperature',
    name: '温度',
    type: 'temperature',
    defaultFrom: 'c',
    defaultTo: 'f',
    units: [
      { code: 'c', name: '摄氏度', symbol: '°C' },
      { code: 'f', name: '华氏度', symbol: '°F' },
      { code: 'k', name: '开尔文', symbol: 'K' }
    ]
  },
  {
    key: 'area',
    name: '面积',
    type: 'linear',
    defaultFrom: 'm2',
    defaultTo: 'km2',
    units: [
      { code: 'cm2', name: '平方厘米', symbol: 'cm²', factor: 0.0001 },
      { code: 'm2', name: '平方米', symbol: 'm²', factor: 1 },
      { code: 'ha', name: '公顷', symbol: 'ha', factor: 10000 },
      { code: 'km2', name: '平方千米', symbol: 'km²', factor: 1000000 },
      { code: 'acre', name: '英亩', symbol: 'acre', factor: 4046.8564224 }
    ]
  },
  {
    key: 'volume',
    name: '体积',
    type: 'linear',
    defaultFrom: 'l',
    defaultTo: 'ml',
    units: [
      { code: 'ml', name: '毫升', symbol: 'mL', factor: 0.001 },
      { code: 'l', name: '升', symbol: 'L', factor: 1 },
      { code: 'm3', name: '立方米', symbol: 'm³', factor: 1000 },
      { code: 'gal', name: '美制加仑', symbol: 'gal', factor: 3.785411784 }
    ]
  },
  {
    key: 'time',
    name: '时间',
    type: 'linear',
    defaultFrom: 'min',
    defaultTo: 's',
    units: [
      { code: 'ms', name: '毫秒', symbol: 'ms', factor: 0.001 },
      { code: 's', name: '秒', symbol: 's', factor: 1 },
      { code: 'min', name: '分钟', symbol: 'min', factor: 60 },
      { code: 'h', name: '小时', symbol: 'h', factor: 3600 },
      { code: 'day', name: '天', symbol: 'day', factor: 86400 }
    ]
  },
  {
    key: 'speed',
    name: '速度',
    type: 'linear',
    defaultFrom: 'ms',
    defaultTo: 'kmh',
    units: [
      { code: 'ms', name: '米每秒', symbol: 'm/s', factor: 1 },
      { code: 'kmh', name: '千米每小时', symbol: 'km/h', factor: 0.2777777778 },
      { code: 'mph', name: '英里每小时', symbol: 'mph', factor: 0.44704 },
      { code: 'knot', name: '节', symbol: 'kn', factor: 0.5144444444 }
    ]
  },
  {
    key: 'data',
    name: '数据',
    type: 'linear',
    defaultFrom: 'mb',
    defaultTo: 'kb',
    units: [
      { code: 'b', name: '字节', symbol: 'B', factor: 1 },
      { code: 'kb', name: 'KB', symbol: 'KB', factor: 1024 },
      { code: 'mb', name: 'MB', symbol: 'MB', factor: 1048576 },
      { code: 'gb', name: 'GB', symbol: 'GB', factor: 1073741824 }
    ]
  }
];

/**
 * 获取页面展示的换算分类列表。
 * @returns {Array<{key: string, name: string}>} 分类列表
 */
function getConverterCategories() {
  return CATEGORY_CONFIG.map(({ key, name }) => ({ key, name }));
}

/**
 * 根据分类键获取完整配置。
 * @param {string} categoryKey - 分类键
 * @returns {object} 分类配置
 */
function getCategoryConfig(categoryKey) {
  return CATEGORY_CONFIG.find(item => item.key === categoryKey) || CATEGORY_CONFIG[0];
}

/**
 * 获取分类下所有可选单位。
 * @param {string} categoryKey - 分类键
 * @returns {Array<object>} 单位配置列表
 */
function getCategoryUnits(categoryKey) {
  return getCategoryConfig(categoryKey).units || [];
}

/**
 * 获取分类的默认“从/到”单位代码。
 * @param {string} categoryKey - 分类键
 * @returns {{fromCode: string, toCode: string}} 默认单位代码
 */
function getCategoryDefaults(categoryKey) {
  const config = getCategoryConfig(categoryKey);
  return {
    fromCode: config.defaultFrom,
    toCode: config.defaultTo
  };
}

/**
 * 将温度值先换算为摄氏度。
 * @param {number} value - 输入温度
 * @param {string} fromCode - 输入单位代码
 * @returns {number} 摄氏度
 */
function temperatureToCelsius(value, fromCode) {
  if (fromCode === 'c') return value;
  if (fromCode === 'f') return (value - 32) * (5 / 9);
  if (fromCode === 'k') return value - 273.15;
  return value;
}

/**
 * 将摄氏度换算为目标温度单位。
 * @param {number} celsius - 摄氏温度
 * @param {string} toCode - 目标单位代码
 * @returns {number} 目标温度
 */
function celsiusToTemperature(celsius, toCode) {
  if (toCode === 'c') return celsius;
  if (toCode === 'f') return celsius * (9 / 5) + 32;
  if (toCode === 'k') return celsius + 273.15;
  return celsius;
}

/**
 * 在同一分类下进行单位换算。
 * @param {string} categoryKey - 分类键
 * @param {number} value - 输入值
 * @param {string} fromCode - 输入单位代码
 * @param {string} toCode - 目标单位代码
 * @returns {number} 换算结果
 */
function convertUnitValue(categoryKey, value, fromCode, toCode) {
  const config = getCategoryConfig(categoryKey);
  const units = config.units || [];
  const fromUnit = units.find(unit => unit.code === fromCode);
  const toUnit = units.find(unit => unit.code === toCode);

  if (!fromUnit || !toUnit || !Number.isFinite(value)) {
    return NaN;
  }

  if (config.type === 'temperature') {
    const celsius = temperatureToCelsius(value, fromCode);
    return celsiusToTemperature(celsius, toCode);
  }

  const baseValue = value * fromUnit.factor;
  return baseValue / toUnit.factor;
}

/**
 * 格式化换算结果，避免无意义的尾随 0。
 * @param {number} value - 待格式化数值
 * @returns {string} 格式化后的字符串
 */
function formatUnitValue(value) {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '0';

  const abs = Math.abs(value);
  if (abs >= 1e12 || abs < 1e-8) {
    return value.toExponential(6).replace('+', '');
  }

  const fixed = value.toFixed(12);
  const normalized = fixed.replace(/\.?0+$/, '');
  return normalized === '-0' ? '0' : normalized;
}

/**
 * 构造“换算公式”展示文本。
 * @param {string} inputText - 输入值文本
 * @param {string} outputText - 输出值文本
 * @param {object} fromUnit - 输入单位对象
 * @param {object} toUnit - 输出单位对象
 * @returns {string} 公式文本
 */
function buildFormulaText(inputText, outputText, fromUnit, toUnit) {
  if (!inputText || !outputText || !fromUnit || !toUnit) {
    return '';
  }

  return `${inputText} ${fromUnit.symbol} = ${outputText} ${toUnit.symbol}`;
}

module.exports = {
  getConverterCategories,
  getCategoryUnits,
  getCategoryDefaults,
  convertUnitValue,
  formatUnitValue,
  buildFormulaText
};
