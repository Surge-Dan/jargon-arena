const test = require('node:test');
const assert = require('node:assert/strict');

let posterApi;
try {
  posterApi = require('../assets/poster.js');
} catch (_error) {
  posterApi = null;
}

test('uses a 1080 by 1440 poster and generates a rich result-specific share body', () => {
  assert.ok(posterApi, 'poster module should exist');
  assert.equal(posterApi.POSTER_WIDTH, 1080);
  assert.equal(posterApi.POSTER_HEIGHT, 1440);

  const copy = posterApi.buildShareCopy({
    rank: { tier: '铂金', name: '语境翻译官' },
    overall: 76,
    dimensions: { decode: 88, context: 91, culture: 72, filter: 64, translate: 55 },
    badges: [
      { label: '会议拆弹员', dimensionLabel: '语境雷达' },
      { label: '新词雷达站', dimensionLabel: '术语破译' },
    ],
    pokerStyle: '看得懂牌面，也听得见弦外音',
    rankGap: '把抽象方向改写成负责人、时间和验收标准',
    mission: '下一场会，追问一次“这件事怎么验收”',
  });
  assert.ok(copy.title.length <= 20);
  assert.ok(copy.content.length >= 320);
  assert.ok(copy.content.length <= 1000);
  ['抓手', '闭环', '颗粒度', '对齐', '赋能', '组合拳', '人话', '牌桌'].forEach((term) => {
    assert.match(copy.content, new RegExp(term));
  });
  assert.match(copy.content, /铂金/);
  assert.match(copy.content, /会议拆弹员/);
  assert.match(copy.tags, /黑话段位局/);
});
