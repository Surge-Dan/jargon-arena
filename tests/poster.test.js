const test = require('node:test');
const assert = require('node:assert/strict');

let posterApi;
try {
  posterApi = require('../assets/poster.js');
} catch (_error) {
  posterApi = null;
}

test('uses a 1080 by 1440 share poster and safe Xiaohongshu copy lengths', () => {
  assert.ok(posterApi, 'poster module should exist');
  assert.equal(posterApi.POSTER_WIDTH, 1080);
  assert.equal(posterApi.POSTER_HEIGHT, 1440);

  const copy = posterApi.buildShareCopy({ rank: { name: '返璞归真人话掌门' }, overall: 96 });
  assert.ok(copy.title.length <= 20);
  assert.ok(copy.content.length <= 1000);
  assert.match(copy.tags, /黑话段位局/);
});
