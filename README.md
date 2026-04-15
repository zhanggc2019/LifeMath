# 计算器大全微信小程序

一个基于微信小程序的多功能计算工具，包含：
- 个税计算（综合所得年度累计预扣法）
- 贷款计算（商贷 / 公积金贷 / 组合贷）
- 健康计算（BMI、BMR、身高体重标准）
- 支持从页面右上角分享给微信好友、分享到朋友圈

## 功能总览

### 1. 个税计算
- 支持城市选择：北京、上海、广州、深圳
- 支持自定义社保基数、公积金基数、公积金比例、社保比例
- 支持专项附加扣除（子女教育、继续教育、住房贷款、住房租金、赡养老人、大病医疗）
- 采用年度累计预扣法，输出年度汇总和 1~12 月累计明细
- 由云函数 `tax` 计算，页面仅负责参数收集与渲染

### 2. 贷款计算
- 支持贷款类型：商业贷款、公积金贷款、组合贷款
- 支持还款方式：等额本息、等额本金
- 商贷支持按 `LPR + 加点(BP)` 自动换算执行利率（可手动更新 LPR 数值）
- 支持商业与公积金不同贷款年限（组合贷场景）
- 输出月供、总利息、总还款、首月明细、前 12 期还款计划
- 由云函数 `loan` 计算，页面仅负责参数收集与渲染

### 3. 健康计算
- BMI 计算与分类建议
- BMR 计算（Mifflin-St Jeor 公式）与不同活动水平建议热量
- 身高体重标准对照表（男女）
- 当前为本地计算（`utils/health.js`），未接入云函数

## 技术栈
- 微信小程序原生框架
- 微信云开发（Cloud Functions）
- JavaScript（CommonJS 模块）

## 目录结构

```text
wechat_demo/
├─ app.js
├─ app.json
├─ app.wxss
├─ sitemap.json
├─ pages/
│  ├─ index/          # 首页
│  ├─ tax/            # 个税页面（调用 tax 云函数）
│  ├─ loan/           # 贷款页面（调用 loan 云函数）
│  └─ health/         # 健康页面（本地计算）
├─ utils/
│  ├─ constants.js    # 税率、城市配置
│  ├─ tax.js          # 个税本地工具（用于城市配置等）
│  ├─ loan.js         # 贷款本地工具
│  └─ health.js       # 健康本地工具
└─ cloudfunctions/
   ├─ tax/
   │  ├─ index.js
   │  ├─ package.json
   │  └─ utils/
   │     ├─ constants.js
   │     ├─ tax.js
   │     └─ loan.js
   └─ loan/
      ├─ index.js
      ├─ package.json
      └─ utils/
         ├─ constants.js
         ├─ tax.js
         └─ loan.js
```

## 运行与部署

### 本地开发
1. 使用微信开发者工具导入项目根目录 `wechat_demo`。
2. 确认小程序基础库版本 >= 2.2.3（云开发能力要求）。
3. 运行预览页面：`首页 -> 个税 / 贷款 / 健康`。

### 云开发配置
`app.js` 中已初始化云开发：

```js
wx.cloud.init({
  env: 'cloud1-6g6fnldsd974dbe5',
  traceUser: true,
});
```

如需切换环境，请修改 `env` 为你的目标云环境 ID。

### 云函数部署
在微信开发者工具中分别上传并部署：
- `cloudfunctions/tax`
- `cloudfunctions/loan`

`package.json` 依赖：
- `wx-server-sdk ~2.6.3`

## 页面与云函数调用关系

### 个税页面
- 页面文件：`pages/tax/index.js`
- 云函数：`tax`
- 调用方式：`wx.cloud.callFunction({ name: 'tax', data })`

请求参数示例：

```json
{
  "income": 20000,
  "city": "北京",
  "socialBase": 20000,
  "housingBase": 20000,
  "socialRates": {
    "pension": 8,
    "medical": 2,
    "unemployment": 0.5,
    "maternity": 0,
    "workInjury": 0
  },
  "housingRate": 12,
  "deductions": {
    "childrenEducation": false,
    "continuingEducation": false,
    "bigDiseaseMedical": 0,
    "housingLoan": false,
    "housingRent": "",
    "elderlySupport": false
  }
}
```

### 贷款页面
- 页面文件：`pages/loan/index.js`
- 云函数：`loan`
- 调用方式：`wx.cloud.callFunction({ name: 'loan', data })`

请求参数示例（组合贷）：

```json
{
  "type": "combo",
  "commercial": {
    "principal": 1000000,
    "annualRate": 4.9,
    "months": 360,
    "repaymentType": "等额本息"
  },
  "gjj": {
    "principal": 300000,
    "annualRate": 3.1,
    "months": 240,
    "repaymentType": "等额本息"
  }
}
```

## 计算口径说明

### 个税口径
- 使用综合所得年度累计预扣法
- 税率档位为年度累计档位：`36000 / 144000 / 300000 / 420000 / 660000 / 960000`
- 本月应扣税额 = 累计应扣税额 - 上月累计已扣税额
- 城市基数使用最小/最大值限制（clamp）
- 社保比例支持以下输入方式：
  - 百分数：`8`、`0.5`、`0.2`
  - 小数：`0.08`、`0.005`、`0.002`
- 公积金比例支持：
  - 百分数：`12`
  - 小数：`0.12`

### 贷款口径
- 商贷执行利率：
  - `执行年利率 = 对应期限LPR + 加点(BP)`
  - `<= 5年` 使用 `1年期LPR`，`> 5年` 使用 `5年期以上LPR`
  - 默认 LPR：`1年期 3.00%`、`5年期以上 3.50%`（页面可手动调整）
- 公积金贷款默认参考（首套）：`<=5年 2.10%`、`>5年 2.60%`
- 等额本息：
  - 月供 = `P * [r(1+r)^n] / [(1+r)^n - 1]`
- 等额本金：
  - 每月本金固定 = `P / n`
  - 每月利息 = `剩余本金 * r`
- 组合贷：
  - 商贷与公积金分别计算后逐月合并
  - 支持不同年限，明细长度取两者最大值

### 健康口径
- BMI = `体重(kg) / 身高(m)^2`
- BMR（Mifflin-St Jeor）：
  - 男：`10*体重 + 6.25*身高 - 5*年龄 + 5`
  - 女：`10*体重 + 6.25*身高 - 5*年龄 - 161`

## 关键实现说明

### 云函数入口
- 个税：`cloudfunctions/tax/index.js`
- 贷款：`cloudfunctions/loan/index.js`

### 本地工具
- 个税：`utils/tax.js`
- 贷款：`utils/loan.js`
- 健康：`utils/health.js`

### 路由与页面
- 首页：`pages/index`
- 个税：`pages/tax`
- 贷款：`pages/loan`
- 健康：`pages/health`

## 常见问题

### 1. 页面提示“计算失败”
- 检查是否已部署云函数 `tax`、`loan`
- 检查 `app.js` 中 `env` 是否是当前环境
- 检查微信开发者工具是否开启云开发能力

### 2. 为什么健康模块不是云函数
- 当前健康计算使用本地 `utils/health.js`
- 如需统一到云函数，可新增 `cloudfunctions/health`

### 3. 个税比例如何输入
- 社保比例可以输入 `8` 或 `0.08`
- 失业/工伤常见输入 `0.5`、`0.2` 也会被正确识别为百分比

## 版本与维护建议
- 税率和城市基数建议按政策周期校准（年度维护）
- 如果后续全部模块云端化，建议：
  - 新增 `health` 云函数
  - 页面仅保留输入校验与展示逻辑
  - 统一在云端维护口径与参数默认值
