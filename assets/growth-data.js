(function attachGrowthMissions(root, factory) {
  const missions = factory();
  if (typeof module === 'object' && module.exports) module.exports = missions;
  root.GrowthMissions = missions;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGrowthMissions() {
  function challenge(id, dimension, title, ante, scenario, action, proof, choices) {
    return { id, dimension, type: 'challenge', title, ante, scenario, action, proof, xp: 35, options: choices };
  }
  function field(id, dimension, title, ante, action, proof) {
    return { id, dimension, type: 'field', title, ante, scenario: '把这手牌带进下一次真实协作。', action, proof, xp: 20, options: [] };
  }
  const common = [
    ['继续对齐，尽快形成闭环', false, '连招很顺，但信息量仍接近零。'],
    ['先确认目标、负责人、截止时间和验收口径', true, '四张明牌到位，这手可以推进。'],
    ['再拉个群，把相关同学都拉通', false, '桌子更大了，底牌还是没翻。'],
    ['提高颗粒度，沉淀方法论', false, '抽象词叠满，行动项清空。'],
  ];
  return [
    challenge('decode-raise-1', 'decode', '拆掉抓手套娃', '底注：35 XP', '对方说“以生态为抓手，形成增长飞轮”。', '选出最能让项目开工的追问。', '答对一次即可结算。', common),
    challenge('decode-raise-2', 'decode', '机制不是活动', '底注：35 XP', '一次直播被命名为“长效运营机制”。', '判断哪里概念偷牌。', '答对一次即可结算。', common),
    field('decode-field-1', 'decode', '术语落地三连', '底注：20 XP', '记录一个术语，并补齐对象、动作、指标。', '线下自证：完成后由你确认。'),
    challenge('context-raise-1', 'context', '听懂“再看看”', '底注：35 XP', '方案会后只收到一句“回头再看看”。', '选择既不冒犯又能确认优先级的回应。', '答对一次即可结算。', common),
    challenge('context-raise-2', 'context', '原则上到底几成', '底注：35 XP', '合作方说“原则上支持”。', '把条件牌和决策牌翻出来。', '答对一次即可结算。', common),
    field('context-field-1', 'context', '潜台词验真', '底注：20 XP', '把一次猜测改写成确认式提问。', '线下自证：完成后由你确认。'),
    challenge('culture-raise-1', 'culture', '班味不是香水', '底注：35 XP', '同事自嘲“班味腌入味了”。', '识别梗背后的真实处境。', '答对一次即可结算。', common),
    challenge('culture-raise-2', 'culture', '拒绝无效内卷', '底注：35 XP', '内部汇报要求每页重做十版。', '区分质量提升和低收益竞争。', '答对一次即可结算。', common),
    field('culture-field-1', 'culture', '热梗考古局', '底注：20 XP', '解释一个热梗在表达哪种群体情绪。', '线下自证：完成后由你确认。'),
    challenge('filter-raise-1', 'filter', '废话过牌器', '底注：35 XP', '“持续夯实基础，全面赋能业务”。', '找出缺失的信息。', '答对一次即可结算。', common),
    challenge('filter-raise-2', 'filter', '组合拳验真', '底注：35 XP', '方案列了九个动作，声称是一套组合拳。', '判断动作之间是否真有协同。', '答对一次即可结算。', common),
    field('filter-field-1', 'filter', '会议去水分', '底注：20 XP', '从会议纪要删掉一句无行动价值的话。', '线下自证：完成后由你确认。'),
    challenge('translate-raise-1', 'translate', '人话同声传译', '底注：35 XP', '“提升组织势能，拉通全链路协同”。', '翻成今天能开始的动作。', '答对一次即可结算。', common),
    challenge('translate-raise-2', 'translate', '颗粒度落桌', '底注：35 XP', '反馈只有一句“颗粒度不够”。', '追问到可验收层级。', '答对一次即可结算。', common),
    field('translate-field-1', 'translate', '三句人话汇报', '底注：20 XP', '用目标、取舍、下一步重写一次汇报。', '线下自证：完成后由你确认。'),
  ];
});
