(function attachRankAssets(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RankAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createRankAssets() {
  const tiers = ['黑铁', '青铜', '白银', '黄金', '铂金', '钻石', '大师', '王者'];
  const slugs = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'master', 'king'];
  return {
    RANK_ASSETS: tiers.map((tier, index) => ({ id: index + 1, tier, assetPath: `./assets/ranks/rank-${slugs[index]}.svg` })),
  };
});
