(function attachGrowthCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GrowthCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGrowthCore() {
  const MAX_RANK = 8;
  const XP_PER_RANK = 100;
  const DIMENSIONS = ['decode', 'context', 'culture', 'filter', 'translate'];

  function clampRank(rankId) {
    return Math.min(MAX_RANK, Math.max(1, Math.round(Number(rankId) || 1)));
  }

  function createGrowthState(baselineRankId, now) {
    const rankId = clampRank(baselineRankId);
    return {
      rankId,
      xp: 0,
      streak: 0,
      completedMissionIds: [],
      lastBaselineRankId: rankId,
      unlockedAt: now || new Date().toISOString(),
      updatedAt: now || new Date().toISOString(),
    };
  }

  function recommendMissions(missions, dimensions, completedIds, count) {
    const completed = new Set(Array.isArray(completedIds) ? completedIds : []);
    const wanted = Math.max(1, Number(count) || 3);
    const order = [...DIMENSIONS].sort((left, right) => (
      (Number(dimensions && dimensions[left]) || 0) - (Number(dimensions && dimensions[right]) || 0)
    ));
    const available = (Array.isArray(missions) ? missions : []).filter((mission) => !completed.has(mission.id));
    const selected = [];

    order.forEach((dimension) => {
      if (selected.length >= wanted) return;
      const mission = available.find((item) => item.dimension === dimension && !selected.includes(item));
      if (mission) selected.push(mission);
    });
    available.forEach((mission) => {
      if (selected.length < wanted && !selected.includes(mission)) selected.push(mission);
    });
    return selected.slice(0, wanted);
  }

  function completeMission(current, mission, now) {
    const state = { ...current, completedMissionIds: [...(current.completedMissionIds || [])] };
    if (!mission || !mission.id || state.completedMissionIds.includes(mission.id)) {
      return { state: current, rankUp: false, duplicate: true, previousRankId: current.rankId };
    }
    const previousRankId = clampRank(state.rankId);
    let rankId = previousRankId;
    let xp = Math.max(0, Number(state.xp) || 0) + Math.max(0, Number(mission.xp) || 0);
    while (xp >= XP_PER_RANK && rankId < MAX_RANK) {
      xp -= XP_PER_RANK;
      rankId += 1;
    }
    if (rankId === MAX_RANK) xp = Math.min(XP_PER_RANK, xp);
    state.rankId = rankId;
    state.xp = xp;
    state.streak = (Number(state.streak) || 0) + 1;
    state.completedMissionIds.push(mission.id);
    state.updatedAt = now || new Date().toISOString();
    return { state, rankUp: rankId > previousRankId, previousRankId, duplicate: false };
  }

  function syncBaseline(current, baselineRankId, now) {
    const baseline = clampRank(baselineRankId);
    const state = current ? { ...current, completedMissionIds: [...(current.completedMissionIds || [])] } : createGrowthState(baseline, now);
    if (baseline > clampRank(state.rankId)) {
      state.rankId = baseline;
      state.xp = 0;
      state.unlockedAt = now || new Date().toISOString();
    }
    state.lastBaselineRankId = baseline;
    state.updatedAt = now || new Date().toISOString();
    return state;
  }

  return { MAX_RANK, XP_PER_RANK, createGrowthState, recommendMissions, completeMission, syncBaseline };
});
