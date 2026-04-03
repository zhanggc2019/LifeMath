/**
 * 健康计算工具
 */

/**
 * 计算BMI
 * @param {number} height 身高(cm)
 * @param {number} weight 体重(kg)
 * @returns {object} BMI结果
 */
function calcBMI(height, weight) {
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const roundedBmi = Math.round(bmi * 10) / 10;

  let category, color, description;
  if (bmi < 18.5) {
    category = '偏瘦';
    color = '#ffb347';
    description = '体重过低，建议适当增重';
  } else if (bmi < 24) {
    category = '正常';
    color = '#07c160';
    description = '继续保持健康的生活方式';
  } else if (bmi < 28) {
    category = '超重';
    color = '#ff9f43';
    description = '注意饮食，加强锻炼';
  } else {
    category = '肥胖';
    color = '#ff6b6b';
    description = '建议咨询医生，制定减重计划';
  }

  // 理想体重范围
  const minWeight = Math.round(18.5 * heightM * heightM * 10) / 10;
  const maxWeight = Math.round(24 * heightM * heightM * 10) / 10;

  return {
    bmi: roundedBmi,
    category,
    color,
    description,
    minWeight,
    maxWeight,
    weight
  };
}

/**
 * 计算基础代谢率 (BMR)
 * 使用 Mifflin-St Jeor 方程
 * @param {number} height 身高(cm)
 * @param {number} weight 体重(kg)
 * @param {number} age 年龄
 * @param {string} gender 性别 'male' | 'female'
 * @returns {object} 代谢结果
 */
function calcBMR(height, weight, age, gender) {
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // 活动系数
  const activityLevels = [
    { name: '久坐', factor: 1.2, desc: '几乎不运动' },
    { name: '轻度', factor: 1.375, desc: '每周1-3天运动' },
    { name: '中度', factor: 1.55, desc: '每周3-5天运动' },
    { name: '高度', factor: 1.725, desc: '每周6-7天运动' },
    { name: '极高度', factor: 1.9, desc: '运动员/体力劳动者' }
  ];

  const dailyCalories = activityLevels.map(level => ({
    ...level,
    calories: Math.round(bmr * level.factor)
  }));

  return {
    bmr: Math.round(bmr),
    dailyCalories
  };
}

/**
 * 获取身高体重标准对照表
 * @param {string} gender 性别 'male' | 'female'
 * @returns {array} 对照表数据
 */
function getHeightWeightTable(gender) {
  // 男性标准体重表 (kg)
  const maleTable = [
    { height: 155, minWeight: 49, maxWeight: 58 },
    { height: 160, minWeight: 54, maxWeight: 63 },
    { height: 165, minWeight: 58, maxWeight: 69 },
    { height: 170, minWeight: 63, maxWeight: 75 },
    { height: 175, minWeight: 68, maxWeight: 81 },
    { height: 180, minWeight: 73, maxWeight: 87 },
    { height: 185, minWeight: 78, maxWeight: 93 },
    { height: 190, minWeight: 83, maxWeight: 99 }
  ];

  // 女性标准体重表 (kg)
  const femaleTable = [
    { height: 145, minWeight: 40, maxWeight: 48 },
    { height: 150, minWeight: 44, maxWeight: 53 },
    { height: 155, minWeight: 47, maxWeight: 57 },
    { height: 160, minWeight: 50, maxWeight: 61 },
    { height: 165, minWeight: 54, maxWeight: 65 },
    { height: 170, minWeight: 57, maxWeight: 69 },
    { height: 175, minWeight: 60, maxWeight: 73 },
    { height: 180, minWeight: 63, maxWeight: 77 }
  ];

  return gender === 'male' ? maleTable : femaleTable;
}

module.exports = {
  calcBMI,
  calcBMR,
  getHeightWeightTable
};
