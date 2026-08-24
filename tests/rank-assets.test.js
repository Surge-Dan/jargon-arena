const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

let assets;
try {
  assets = require('../assets/rank-assets.js');
} catch (_error) {
  assets = null;
}

test('maps eight named tiers to distinct local svg emblems', () => {
  assert.ok(assets, 'rank assets module should exist');
  assert.equal(assets.RANK_ASSETS.length, 8);
  assert.deepEqual(assets.RANK_ASSETS.map((rank) => rank.tier), ['黑铁', '青铜', '白银', '黄金', '铂金', '钻石', '大师', '王者']);
  assert.equal(new Set(assets.RANK_ASSETS.map((rank) => rank.assetPath)).size, 8);
  assets.RANK_ASSETS.forEach((rank) => {
    const absolutePath = path.join(__dirname, '..', rank.assetPath.replace('./', ''));
    const svg = fs.readFileSync(absolutePath, 'utf8');
    assert.match(svg, /<svg/);
    assert.match(svg, new RegExp(`data-rank=["']${rank.id}["']`));
  });
});
