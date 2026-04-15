const SHARE_CONFIG = {
  'pages/index/index': {
    title: '计算器大全｜个税、贷款、健康、单位换算',
    timelineTitle: '计算器大全：个税、贷款、健康、单位换算一站式搞定'
  },
  'pages/tax/index': {
    title: '个税计算器｜支持专项扣除与累计预扣',
    timelineTitle: '个税计算器：支持专项扣除与累计预扣'
  },
  'pages/loan/index': {
    title: '贷款计算器｜商贷、公积金、组合贷',
    timelineTitle: '贷款计算器：商贷、公积金、组合贷都能算'
  },
  'pages/health/index': {
    title: '健康计算器｜BMI、热量、身高标准',
    timelineTitle: '健康计算器：BMI、热量、身高标准一键查看'
  },
  'pages/converter/index': {
    title: '单位换算器｜长度、重量、温度等常用换算',
    timelineTitle: '单位换算器：长度、重量、温度等常用换算'
  }
};

function normalizePath(route) {
  return route.startsWith('/') ? route : `/${route}`;
}

function getShareConfig(route) {
  return SHARE_CONFIG[route] || SHARE_CONFIG['pages/index/index'];
}

function enablePageShare() {
  if (!wx.showShareMenu) {
    console.warn('wx.showShareMenu is unavailable');
    return;
  }

  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
    fail(error) {
      console.warn('showShareMenu failed:', error);
    }
  });
}

function buildShareAppMessage(route) {
  const config = getShareConfig(route);
  return {
    title: config.title,
    path: normalizePath(route)
  };
}

function buildShareTimeline(route) {
  const config = getShareConfig(route);
  return {
    title: config.timelineTitle || config.title
  };
}

module.exports = {
  enablePageShare,
  buildShareAppMessage,
  buildShareTimeline
};
