(function attachQuestionBank(root) {
  const dimensions = ['decode', 'context', 'culture', 'filter', 'translate'];

  function makeWeights(primary, quality, related, extras) {
    const weights = Object.fromEntries(dimensions.map((dimension) => [dimension, 0]));
    weights[primary] = quality;
    (related || []).forEach((dimension) => {
      weights[dimension] = Math.max(weights[dimension], Math.min(4, Math.round(quality / 2)));
    });
    Object.entries(extras || {}).forEach(([dimension, value]) => {
      weights[dimension] = value;
    });
    return weights;
  }

  function makeQuestion(config) {
    return {
      id: config.id,
      stage: config.stage,
      dimension: config.dimension,
      difficulty: config.difficulty || 'standard',
      categoryLabel: config.categoryLabel,
      stem: config.stem,
      explanation: config.explanation,
      options: config.choices.map((choice) => ({
        text: choice[0],
        feedback: choice[1],
        weights: makeWeights(config.dimension, choice[2], config.related, choice[3]),
      })),
    };
  }

  const rawQuestions = [
    // 基础校准：10 选 8
    {
      id: 'cal-decode-01', stage: 'calibration', dimension: 'decode', categoryLabel: '术语校准',
      stem: '领导说“这件事需要找个抓手”，最接近的意思是？',
      explanation: '抓手指能推动目标落地的具体动作、资源、机制或负责人。', related: ['translate'],
      choices: [
        ['把会议室门把手换得顺手一点', '字面很诚实，会议通常没这么直接。', 0],
        ['把方案包装成一个更响亮的概念', '概念可以响，事情未必动。', 1],
        ['找一个推进项目的方法', '方向对了，但还可以说清由谁、何时推进。', 3],
        ['明确能推进目标的动作、资源和负责人', '抓手落地，手终于抓到东西了。', 4, { translate: 4 }],
      ],
    },
    {
      id: 'cal-context-01', stage: 'calibration', dimension: 'context', categoryLabel: '语境校准',
      stem: '群里收到“这个问题我们后面再对齐”，你第一反应应该是？',
      explanation: '“后面再对齐”最容易把责任和时间一起推迟，需要补齐下一步。', related: ['filter', 'translate'],
      choices: [
        ['等对方哪天想起来再说', '“后面”没有日期，通常等不到自动发生。', 0],
        ['回复一个“收到”表示配合', '礼貌完成了，事情还没开始。', 1],
        ['问一下大概什么时候再聊', '时间开始清楚了，但还缺负责人和产出。', 3],
        ['确认谁在何时组织、要对齐出什么结论', '你把模糊时间改成了可执行动作。', 4, { translate: 4, filter: 3 }],
      ],
    },
    {
      id: 'cal-culture-01', stage: 'calibration', dimension: 'culture', categoryLabel: '梗文化校准',
      stem: '同事说“今天 CPU 有点干烧”，更可能是在表达什么？',
      explanation: '这里把大脑比作处理器，通常表示信息过载或脑力被连续占用。', related: ['context'],
      choices: [
        ['办公电脑散热器坏了', '真冒烟的话，先断电，不要继续刷梗。', 0],
        ['今天工作效率特别高', '高负荷不等于高效率。', 1],
        ['事情太多，脑子有点转不过来', '梗的基本语义已经接住了。', 3],
        ['信息持续轰炸，大脑高负荷但没有有效产出', '不仅懂梗，还懂“干烧”的无效消耗感。', 4],
      ],
    },
    {
      id: 'cal-filter-01', stage: 'calibration', dimension: 'filter', categoryLabel: '废话校准',
      stem: '哪句话最像“听起来全对，但没有行动项”？',
      explanation: '抽象方向并不一定错，问题在于它没有负责人、时间和交付物。', related: ['translate'],
      choices: [
        ['周三前由小林提交接口字段表', '这是明确行动项，不是废话。', 0],
        ['今天下班前确认需求负责人', '动作、时间、产出都比较清楚。', 1],
        ['本周优先完成首页首屏改版', '还有细节可补，但已经能开始做。', 3],
        ['持续夯实基础，全面提升协同效率', '方向永远正确，下一步永远失踪。', 4, { translate: 3 }],
      ],
    },
    {
      id: 'cal-translate-01', stage: 'calibration', dimension: 'translate', categoryLabel: '人话校准',
      stem: '把“建立用户心智，打造内容抓手”翻译成人话，哪句最好？',
      explanation: '用户心智可以落到记忆与认知，内容抓手需要变成具体内容和传播动作。', related: ['decode', 'filter'],
      choices: [
        ['围绕用户心智继续建设内容抓手', '原句换了个顺序，翻译任务失败。', 0],
        ['把内容做得更有温度和力量', '听着顺了，做什么仍然不清楚。', 1],
        ['做一批让用户记住我们的内容', '已经从概念走向目标。', 3],
        ['确定一个核心记忆点，并用可分享内容反复强化', '目标和动作都落地了。', 4, { decode: 3, filter: 3 }],
      ],
    },
    {
      id: 'cal-decode-02', stage: 'calibration', dimension: 'decode', categoryLabel: '术语校准',
      stem: '评审里说“大家把颗粒度拉齐”，真正想解决什么？',
      explanation: '颗粒度指讨论或描述的细致程度，拉齐是让参与者处在相近层级。', related: ['context'],
      choices: [
        ['把页面字号统一改小', '字变小了，讨论层级没有变。', 0],
        ['所有需求都拆到最细', '不是越细越好，而是细到同一个层级。', 1],
        ['让大家讨论相同的问题', '方向接近，但核心是细节深度一致。', 3],
        ['让战略、方案和细节不要混在一个层级争论', '这就是颗粒度拉齐的实际价值。', 4],
      ],
    },
    {
      id: 'cal-context-02', stage: 'calibration', dimension: 'context', categoryLabel: '语境校准',
      stem: '老板说“你先做个初版，我们再看”，更稳妥的处理是？',
      explanation: '“初版”没有天然标准，需要主动确认范围和判断标准。', related: ['translate'],
      choices: [
        ['直接做完整版本，免得返工', '范围没确认，做得越满返工可能越大。', 0],
        ['随便做一版，反正还要改', '初版不是草率版。', 1],
        ['先问什么时候要', '时间重要，但仍缺范围和评价标准。', 3],
        ['确认初版包含什么、用来判断什么、何时给反馈', '你给“再看”装上了验收标准。', 4, { translate: 4 }],
      ],
    },
    {
      id: 'cal-culture-02', stage: 'calibration', dimension: 'culture', categoryLabel: '职场文化校准',
      stem: '团队说要“赛马”，通常指的不是哪一种马？',
      explanation: '赛马机制通常让多组方案并行竞争，再根据结果选择。', related: ['decode'],
      choices: [
        ['真的组织骑马团建', '除非公司业务是马场。', 0],
        ['每个人都加速干活', '快不是赛马机制的全部。', 1],
        ['多个人同时做同一件事', '并行是表象，还要有比较与选择。', 3],
        ['让多组方案并行，用统一标准选出更优路径', '赛道、选手和终点线都齐了。', 4],
      ],
    },
    {
      id: 'cal-filter-02', stage: 'calibration', dimension: 'filter', categoryLabel: '废话校准',
      stem: '听到“我们要沉淀方法论，形成可复制闭环”，最关键的追问是？',
      explanation: '方法论需要来源于真实验证，并明确适用条件和复用方式。', related: ['translate'],
      choices: [
        ['方法论要不要做成 50 页 PPT', '页数不会自动提高复用率。', 0],
        ['闭环图要不要画成圆的', '图形问题再次无辜躺枪。', 1],
        ['谁来整理这份方法论', '负责人重要，还需要验证来源和使用场景。', 3],
        ['哪次实践验证过、适用什么场景、由谁在何时整理', '方法论终于有了证据和边界。', 4, { translate: 4 }],
      ],
    },
    {
      id: 'cal-translate-02', stage: 'calibration', dimension: 'translate', categoryLabel: '人话校准',
      stem: '“我们先小步快跑，沉淀可复用的方法论”最靠谱的翻译是？',
      explanation: '核心是先做小范围实验，再根据结果提炼可重复使用的流程。', related: ['filter'],
      choices: [
        ['马上跑起来，再形成方法论闭环', '黑话套黑话，译者宣布罢工。', 0],
        ['先做快一点，然后写总结', '速度有了，范围和复用条件还没说。', 1],
        ['先做一个小版本，再总结经验', '已经接近完整人话。', 3],
        ['先验证一个最小方案，再把有效步骤和适用条件写清', '实验、证据和复用方式都到位。', 4, { filter: 4 }],
      ],
    },

    // 术语破译支线
    {
      id: 'decode-01', stage: 'branch', dimension: 'decode', difficulty: 'foundation', categoryLabel: '术语破译',
      stem: '“先把相关团队拉通”最接近什么动作？', explanation: '拉通强调建立跨团队的信息、责任与协作连接。', related: ['translate'],
      choices: [['把人都拉进一个群', '进群只是连接，不是协作。', 1], ['发一封抄送所有人的邮件', '看见了不等于达成一致。', 1], ['让相关团队开一次会', '会议是手段，还缺结论。', 3], ['确认共同目标、接口人、依赖和时间', '拉通终于不是通讯录扩容。', 4, { translate: 4 }]],
    },
    {
      id: 'decode-02', stage: 'branch', dimension: 'decode', difficulty: 'foundation', categoryLabel: '术语破译',
      stem: '“这个项目的卡点在哪里”是在问什么？', explanation: '卡点是阻碍项目继续推进的关键问题。', related: ['context'],
      choices: [['问项目卡片放在哪里', '卡点不是卡片。', 0], ['问谁最近比较忙', '忙可能相关，但不是卡点定义。', 1], ['问项目为什么变慢', '已经接近阻碍问题。', 3], ['问哪个依赖或决策正在阻止下一步', '阻塞位置被精准定位。', 4]],
    },
    {
      id: 'decode-03', stage: 'branch', dimension: 'decode', difficulty: 'advanced', categoryLabel: '术语破译',
      stem: '“把风险前置”最准确的理解是？', explanation: '风险前置是尽早识别、验证和处理高不确定问题。', related: ['filter'],
      choices: [['把风险写在 PPT 第一页', '位置前置不等于处理前置。', 1], ['先把所有风险都列出来', '识别是第一步，还要验证和处理。', 3], ['提前告诉大家项目可能失败', '预警有用，但不能代替动作。', 2], ['尽早验证高风险假设并准备应对方案', '这才是真正让风险发生得更早、成本更低。', 4, { filter: 3 }]],
    },
    {
      id: 'decode-04', stage: 'branch', dimension: 'decode', difficulty: 'advanced', categoryLabel: '术语破译',
      stem: '“抓大放小”在项目管理里更接近什么？', explanation: '优先处理影响目标的关键问题，对低影响细节控制投入。', related: ['context'],
      choices: [['大需求认真做，小需求不做', '大小不是按需求名称判断。', 1], ['领导关心的都算大事', '这叫向权力对焦，不是向目标对焦。', 1], ['只讨论战略，不讨论细节', '战略也需要落到关键细节。', 2], ['优先解决高影响问题，低影响细节控制成本', '资源分配终于有了判断标准。', 4]],
    },
    {
      id: 'decode-05', stage: 'branch', dimension: 'decode', difficulty: 'advanced', categoryLabel: '术语破译',
      stem: '“我们先把目标对焦”与“对齐”最大的区别是？', explanation: '对焦更强调从多个目标中聚焦关键目标；对齐更强调多人形成一致理解。', related: ['context'],
      choices: [['没有区别，都是开会', '有时确实都以开会收场，但语义不同。', 1], ['对焦是做 PPT，对齐是发纪要', '工具不是概念本身。', 0], ['对焦更像选重点，对齐更像达成一致', '核心差异已经说清。', 4], ['对焦只给领导用，对齐给普通员工用', '黑话没有这种权限分级。', 1]],
    },

    // 语境雷达支线
    {
      id: 'context-01', stage: 'branch', dimension: 'context', difficulty: 'foundation', categoryLabel: '语境拆弹',
      stem: '跨部门同事说“原则上支持”，这句话通常还缺什么？', explanation: '原则支持不等于资源承诺，需要确认条件、资源和时间。', related: ['filter'],
      choices: [['什么都不缺，已经同意了', '“原则上”经常是条件还没谈完。', 0], ['缺一句谢谢', '礼貌重要，资源更重要。', 1], ['缺一次正式会议', '会议可能需要，但不是唯一答案。', 2], ['缺支持条件、投入资源和确认时间', '原则终于开始向现实靠近。', 4, { filter: 3 }]],
    },
    {
      id: 'context-02', stage: 'branch', dimension: 'context', difficulty: 'foundation', categoryLabel: '语境拆弹',
      stem: '评审结束时领导说“我没有意见”，你最不该默认什么？', explanation: '没有意见可能是认可，也可能是暂不展开，需要结合决策权和后续动作判断。', related: ['filter'],
      choices: [['默认方案已经最终批准', '没有异议不一定等于正式批准。', 4], ['确认接下来是否按此版本执行', '这是稳妥的闭环动作。', 0], ['把结论写进会议纪要', '记录有助于减少语境歧义。', 1], ['询问是否还有决策条件', '主动确认比猜测可靠。', 1]],
    },
    {
      id: 'context-03', stage: 'branch', dimension: 'context', difficulty: 'advanced', categoryLabel: '语境拆弹',
      stem: '老板说“这事不复杂，你来牵头”，最值得先确认的是？', explanation: '“不复杂”不代表边界清楚，“牵头”也不代表拥有全部资源和决策权。', related: ['filter', 'translate'],
      choices: [['老板是不是觉得我能力强', '可能，但这不能帮你推进。', 1], ['我能不能自己决定所有事情', '先问清权限是对的，但还不完整。', 3], ['需要拉多少人进群', '群规模不是项目边界。', 1], ['目标、范围、资源、决策权和交付时间', '牵头之前先确认方向盘真的在手里。', 4, { filter: 4, translate: 3 }]],
    },
    {
      id: 'context-04', stage: 'branch', dimension: 'context', difficulty: 'advanced', categoryLabel: '语境拆弹',
      stem: '同事在群里回复“先按这个走吧”，哪种理解最稳妥？', explanation: '这通常是临时推进意见，不天然等于最终决策。', related: ['translate'],
      choices: [['方案永久定稿，谁改谁背锅', '“先”字已经提醒你不是永久。', 0], ['对方不想再讨论了', '可能有疲惫，但不能只猜情绪。', 2], ['可以推进，但要记录适用范围和复盘点', '临时决策有了边界。', 4], ['今天先不工作了', '句子不是这个意思。', 0]],
    },
    {
      id: 'context-05', stage: 'branch', dimension: 'context', difficulty: 'advanced', categoryLabel: '语境拆弹',
      stem: '绩效沟通里出现“影响力还可以再打开一点”，最可能需要追问什么？', explanation: '模糊反馈需要还原成具体行为、场景与期望变化。', related: ['translate', 'filter'],
      choices: [['是不是让我多发朋友圈', '影响力不是社交平台曝光量。', 0], ['是不是对我不满意', '情绪猜测不能替代事实。', 1], ['哪些项目里表现不够明显', '场景开始具体了。', 3], ['哪些行为没达到什么标准，下阶段要改变什么', '绩效黑话被拆成了可验证行为。', 4, { translate: 4, filter: 3 }]],
    },

    // 梗文化考古支线
    {
      id: 'culture-01', stage: 'branch', dimension: 'culture', difficulty: 'foundation', categoryLabel: '梗文化考古',
      stem: '“内卷”最初进入职场语境后，通常描述什么？', explanation: '内卷常指投入不断增加，但整体收益或有效增长没有同步增加的竞争。', related: ['context'],
      choices: [['公司装修用了卷帘门', '字面考古失败。', 0], ['大家都很努力', '努力本身不等于内卷。', 1], ['竞争越来越激烈', '说到了竞争，但还缺低效和收益停滞。', 3], ['投入持续加码、规则逼迫跟进，但整体收益没有增加', '卷的结构性问题被说清了。', 4]],
    },
    {
      id: 'culture-02', stage: 'branch', dimension: 'culture', difficulty: 'foundation', categoryLabel: '梗文化考古',
      stem: '职场里说“摸鱼”，通常不包括哪一种情况？', explanation: '摸鱼一般指工作时间内主动降低投入或处理非工作事项，不等于合理休息。', related: ['context'],
      choices: [['开会时偷偷逛购物软件', '标准摸鱼动作。', 1], ['假装忙碌但没有推进任务', '表演性工作也是一种摸鱼。', 1], ['午休时间真正休息二十分钟', '合理休息不应该被自动算作摸鱼。', 4], ['工作窗口旁边藏着小说页面', '经典多窗口生存术。', 1]],
    },
    {
      id: 'culture-03', stage: 'branch', dimension: 'culture', difficulty: 'advanced', categoryLabel: '梗文化考古',
      stem: '“背锅侠”这个梗真正指向的职场问题是？', explanation: '它指责任分配与决策权不匹配，或事后把系统问题归给单一个体。', related: ['filter'],
      choices: [['厨房岗位分工不清', '锅是真的，侠不是这个侠。', 0], ['谁犯错谁承担责任', '正常责任承担不叫背锅。', 1], ['项目失败后需要有人说明情况', '说明情况和单独承担不是一回事。', 2], ['责任被转移给缺少决策权或证据链的人', '背锅的结构性来源被识别出来。', 4, { filter: 3 }]],
    },
    {
      id: 'culture-04', stage: 'branch', dimension: 'culture', difficulty: 'advanced', categoryLabel: '梗文化考古',
      stem: '“已老实，求放过”在工作群里更像哪种情绪？', explanation: '这个梗常以自嘲方式表达连续受挫、降低期待或不想再被追加任务。', related: ['context'],
      choices: [['正式申请离职', '情绪可能很重，但梗本身不等于法律动作。', 1], ['表示自己已经完全认错', '“老实”往往是自嘲，不一定承认过错。', 2], ['连续被现实教育后的自嘲式服软', '语气和情绪都接住了。', 4], ['请求群管理员解除禁言', '有时可能，但不是常见核心语义。', 1]],
    },
    {
      id: 'culture-05', stage: 'branch', dimension: 'culture', difficulty: 'advanced', categoryLabel: '梗文化考古',
      stem: '“班味很重”通常在吐槽什么？', explanation: '班味描述长期工作节奏、疲惫感和组织语言渗入个人状态后的整体气质。', related: ['context'],
      choices: [['衣服上有办公室空调味', '嗅觉很具体，梗义不是。', 0], ['经常穿衬衫和工牌', '外观可能相关，但不止穿搭。', 2], ['下班后仍保持汇报语气', '已经抓到表现之一。', 3], ['疲惫、紧绷和组织话术共同形成的工作气质', '班味被拆成了可感知的状态。', 4]],
    },

    // 废话鉴别支线
    {
      id: 'filter-01', stage: 'branch', dimension: 'filter', difficulty: 'foundation', categoryLabel: '废话鉴别',
      stem: '“全链路赋能业务增长”最大的问题是什么？', explanation: '概念覆盖范围过大，却没有对象、动作、指标和责任。', related: ['translate'],
      choices: [['字数太少', '再多十个字也可能更空。', 0], ['听起来有点夸张', '直觉准确，但还可以指出缺失项。', 2], ['没有说明具体怎么增长', '抓到关键问题。', 3], ['缺少赋能对象、具体动作、衡量指标和负责人', '四个空位全部被照出来了。', 4, { translate: 4 }]],
    },
    {
      id: 'filter-02', stage: 'branch', dimension: 'filter', difficulty: 'foundation', categoryLabel: '废话鉴别',
      stem: '哪句话最像“把结果当成动作说了”？', explanation: '“提升”“增强”“打造”常描述目标状态，不代表已经说明如何行动。', related: ['translate'],
      choices: [['周五上线搜索词纠错功能', '动作和时间都很具体。', 0], ['新增两个用户访谈场次', '可以直接执行。', 0], ['提升用户满意度', '这是目标结果，不是行动方案。', 4], ['删除注册页两个非必填字段', '动作清晰，可验收。', 0]],
    },
    {
      id: 'filter-03', stage: 'branch', dimension: 'filter', difficulty: 'advanced', categoryLabel: '废话鉴别',
      stem: '“打造生态，形成增长飞轮”什么时候才不算空话？', explanation: '当参与者、价值交换、启动动作与反馈机制被明确时，生态和飞轮才可验证。', related: ['translate'],
      choices: [['当 PPT 里画出了一个圆环', '飞轮不是几何题。', 0], ['当行业里很多公司都这么说', '流行度不能替代机制。', 1], ['当增长目标写得足够高', '目标高度不等于路径成立。', 1], ['当参与者、价值交换、启动动作和反馈循环都明确', '概念终于有了结构和证据。', 4, { translate: 4 }]],
    },
    {
      id: 'filter-04', stage: 'branch', dimension: 'filter', difficulty: 'advanced', categoryLabel: '废话鉴别',
      stem: '“提升组织势能”最需要警惕哪种情况？', explanation: '抽象词可能掩盖真实问题，把资源、机制与责任缺口包装成状态问题。', related: ['context'],
      choices: [['大家不理解物理学', '势能在这里不是考试题。', 0], ['团队最近士气一般', '状态可能相关，但不能仅凭一句话判断。', 2], ['用抽象状态替代具体资源和机制问题', '最常见的包装风险被识别出来。', 4], ['公司没有更大的办公室', '空间大小不是组织势能。', 0]],
    },
    {
      id: 'filter-05', stage: 'branch', dimension: 'filter', difficulty: 'advanced', categoryLabel: '废话鉴别',
      stem: '“打一套组合拳”要成立，至少应该说明什么？', explanation: '组合拳意味着多个动作的顺序、协同关系和共同目标，而不是动作清单堆叠。', related: ['translate'],
      choices: [['至少三个动作，越多越像', '动作数量不是组合逻辑。', 1], ['每个动作都起一个名字', '命名无法替代关系。', 0], ['有哪些动作', '有清单，还缺协同机制。', 3], ['动作顺序、相互作用、负责人和共同结果', '拳法终于不是 PPT 动画。', 4, { translate: 4 }]],
    },

    // 人话翻译支线
    {
      id: 'translate-01', stage: 'branch', dimension: 'translate', difficulty: 'foundation', categoryLabel: '人话翻译',
      stem: '把“打通数据孤岛”翻译成人话，哪句更完整？', explanation: '数据孤岛问题需要明确哪些数据、谁需要、通过什么方式可用。', related: ['decode'],
      choices: [['把所有数据库连在一起', '技术连接不一定解决使用问题。', 1], ['让数据流动起来', '原概念换了一个动词。', 1], ['让不同部门能看到彼此的数据', '目标更清楚了。', 3], ['明确共享字段、权限和接口，让需要的人能使用同一份数据', '对象、方式和边界都说清了。', 4, { decode: 3 }]],
    },
    {
      id: 'translate-02', stage: 'branch', dimension: 'translate', difficulty: 'foundation', categoryLabel: '人话翻译',
      stem: '“这个方向还需要做深做透”最好翻译成什么？', explanation: '做深做透必须落到具体缺口和验收标准。', related: ['filter'],
      choices: [['继续深入，直到足够透彻', '同义反复也是一种黑话。', 0], ['投入更多时间继续做', '投入不是验收标准。', 1], ['补齐关键场景和异常流程', '开始具体了。', 3], ['列出当前缺失场景、验证数据和达到什么标准才算完成', '“深”和“透”都有了刻度。', 4, { filter: 4 }]],
    },
    {
      id: 'translate-03', stage: 'branch', dimension: 'translate', difficulty: 'advanced', categoryLabel: '人话翻译',
      stem: '“建立端到端闭环”最有效的人话版本是？', explanation: '端到端闭环需要从触发到结果反馈都能追踪并有人负责。', related: ['filter'],
      choices: [['把端和端连起来形成闭环', '术语原地踏步。', 0], ['覆盖全部用户流程', '范围有了，责任和反馈还没出现。', 2], ['从用户发起到处理完成都能追踪', '已经具备主要结构。', 3], ['明确每一步负责人、状态和结果反馈，异常能回到处理人', '闭环真正可以运行了。', 4, { filter: 4 }]],
    },
    {
      id: 'translate-04', stage: 'branch', dimension: 'translate', difficulty: 'advanced', categoryLabel: '人话翻译',
      stem: '“构建增长飞轮”如何改写才可以直接开工？', explanation: '飞轮要拆成可验证的起点、循环动作和反馈指标。', related: ['filter', 'decode'],
      choices: [['持续推动增长形成正循环', '愿景很圆，动作仍然失踪。', 0], ['先找到增长抓手', '抓手又来了，但还没落地。', 1], ['让新增用户带来更多新增用户', '机制方向出现了。', 3], ['验证分享入口能否提升邀请，并用邀请数据决定下一轮优化', '起点、动作、指标和下一轮都齐了。', 4, { filter: 4, decode: 3 }]],
    },
    {
      id: 'translate-05', stage: 'branch', dimension: 'translate', difficulty: 'advanced', categoryLabel: '人话翻译',
      stem: '“提升品牌生态位”最不绕的人话是？', explanation: '生态位可以落到目标人群如何识别和选择品牌。', related: ['decode'],
      choices: [['占据更好的生态位置', '换词失败。', 0], ['让品牌更有影响力', '仍然太宽。', 2], ['让目标用户更容易想起我们', '已经接近可感知目标。', 3], ['在特定场景里成为目标用户优先想到和选择的品牌', '人群、场景和结果都明确。', 4, { decode: 4 }]],
    },

    // 综合 Boss
    {
      id: 'boss-01', stage: 'boss', dimension: 'filter', difficulty: 'advanced', categoryLabel: '综合 Boss',
      stem: '会上有人说：“围绕核心场景做深价值，以内容抓手撬动增长飞轮。”你最好的接法是？',
      explanation: '面对高密度包装话术，先确认场景、动作、指标和责任，再讨论概念是否成立。', related: ['decode', 'context', 'translate'],
      choices: [['回复“非常认同，建议形成闭环”', '黑话完成了自我繁殖。', 0], ['请对方把这句话写进战略文档', '保存空话不会让它变实。', 1], ['问核心场景和增长指标是什么', '已经抓到两个关键缺口。', 3], ['确认服务谁、做什么内容、由谁负责、用什么数据判断增长', 'Boss 的四层包装被一次拆开。', 4, { decode: 4, context: 4, translate: 4 }]],
    },
    {
      id: 'boss-02', stage: 'boss', dimension: 'context', difficulty: 'advanced', categoryLabel: '综合 Boss',
      stem: '项目延期复盘时有人说“协同链路存在优化空间”，你应该如何把讨论拉回事实？',
      explanation: '复盘应定位具体事件、决策、依赖与责任边界，避免用抽象组织问题冲淡事实。', related: ['filter', 'translate'],
      choices: [['建议大家以后加强协同意识', '意识再次成为万能替罪羊。', 0], ['问是不是沟通不够频繁', '频率可能相关，但还不是事实链。', 2], ['回顾每个延期节点发生了什么', '事实开始出现。', 3], ['按时间线列出等待的依赖、决策人和原计划差异', '抽象问题被还原成可复盘证据。', 4, { filter: 4, translate: 3 }]],
    },
    {
      id: 'boss-03', stage: 'boss', dimension: 'translate', difficulty: 'advanced', categoryLabel: '综合 Boss',
      stem: '领导要求“既要快速响应，又要确保长期价值”，你如何确认优先级？',
      explanation: '面对正确但冲突的目标，需要明确当前阶段、取舍条件和决策权。', related: ['context', 'filter'],
      choices: [['两个都做到最好', '资源约束不接受口号。', 0], ['先快速做，长期以后再说', '直接替领导做了取舍。', 1], ['问哪个更重要', '问题正确，但还可以给决策框架。', 3], ['给出快方案与长期方案的成本收益，请领导确认当前阶段取舍', '冲突目标被转化成可决策选项。', 4, { context: 4, filter: 4 }]],
    },
    {
      id: 'boss-04', stage: 'boss', dimension: 'culture', difficulty: 'advanced', categoryLabel: '综合 Boss',
      stem: '同事说“别卷了，这只是一次内部汇报”，最准确的语境判断是？',
      explanation: '它通常在提醒投入与收益不匹配，但也需要区分合理质量要求与低效竞争。', related: ['context', 'filter'],
      choices: [['内部汇报不需要认真', '反内卷不等于反质量。', 1], ['大家都不应该做 PPT', '工具无罪，投入结构才是问题。', 1], ['同事只是想偷懒', '可能性存在，但不能只按动机判断。', 2], ['先确认汇报用途和标准，避免为不影响决策的细节追加投入', '文化梗最终落回资源与收益判断。', 4, { context: 4, filter: 4 }]],
    },

    // 晋级赛：每维一题
    {
      id: 'playoff-decode', stage: 'playoff', dimension: 'decode', difficulty: 'advanced', categoryLabel: '晋级赛',
      stem: '“机制”与“抓手”的区别，哪句更准确？', explanation: '机制是持续运行的规则关系，抓手是推动当前目标的具体支点。', related: ['translate'],
      choices: [['没有区别，只是不同部门爱用不同词', '相似不等于相同。', 1], ['机制更高级，抓手更基层', '不是组织层级关系。', 1], ['机制是长期规则，抓手是具体推进点', '核心差异已经说清。', 4], ['机制写制度，抓手做活动', '例子可能成立，但定义过窄。', 3]],
    },
    {
      id: 'playoff-context', stage: 'playoff', dimension: 'context', difficulty: 'advanced', categoryLabel: '晋级赛',
      stem: '对方说“回头我看一下”，怎样回应既不冒犯又能推进？', explanation: '为模糊承诺补时间与下一步，同时保留对方选择空间。', related: ['translate'],
      choices: [['好的，等你', '礼貌但没有推进条件。', 1], ['请务必今天看完', '推进了，也可能越过真实优先级。', 2], ['那我明天下午再来催你', '时间出现了，语气还可以更协作。', 3], ['我明天下午同步一次；若来不及，我们再调整时间', '有节点，也保留现实协商空间。', 4, { translate: 4 }]],
    },
    {
      id: 'playoff-culture', stage: 'playoff', dimension: 'culture', difficulty: 'advanced', categoryLabel: '晋级赛',
      stem: '“卷不动了，准备躺平”通常同时包含哪两层意思？', explanation: '它既可能表达资源耗尽，也可能是对低效竞争规则的拒绝。', related: ['context'],
      choices: [['身体累和想睡觉', '字面有一点，文化语境不止这些。', 1], ['工作太多和准备离职', '可能发生，但不是必然。', 2], ['投入疲惫，以及不愿继续参与低收益竞争', '两层结构都接住了。', 4], ['能力不足，以及放弃成长', '这是价值判断，不是梗义。', 0]],
    },
    {
      id: 'playoff-filter', stage: 'playoff', dimension: 'filter', difficulty: 'advanced', categoryLabel: '晋级赛',
      stem: '“战略性亏损”什么时候可能是合理说法？', explanation: '只有当短期损失对应明确长期目标、验证指标和止损条件时，战略性才可判断。', related: ['translate'],
      choices: [['只要公司说这是战略', '命名权不能替代证据。', 0], ['亏损金额不大时', '金额大小不是战略性的充分条件。', 1], ['为了长期目标暂时少赚钱', '方向正确，仍缺验证与边界。', 3], ['短期损失对应明确长期收益假设、验证指标和止损线', '战略终于有了可证伪条件。', 4, { translate: 4 }]],
    },
    {
      id: 'playoff-translate', stage: 'playoff', dimension: 'translate', difficulty: 'advanced', categoryLabel: '晋级赛',
      stem: '把“提升协同效率”改成一个今天就能执行的动作？', explanation: '有效翻译必须结合具体场景，把抽象结果转成下一步。', related: ['filter'],
      choices: [['大家提高协同意识', '结果继续假装成动作。', 0], ['减少一些会议', '可能有效，但缺少场景。', 2], ['统一项目文档', '动作具体，仍可以更可验收。', 3], ['今天确定唯一需求文档、更新人和每日同步时间', '协同效率被拆成三个可执行规则。', 4, { filter: 4 }]],
    },
  ];

  // 扩展牌库：覆盖真实职场语境，并为复测提供足够的差异化抽题空间。
  function expansion(config) {
    return {
      id: config.id,
      stage: config.stage,
      dimension: config.dimension,
      difficulty: config.difficulty || 'standard',
      categoryLabel: config.categoryLabel,
      stem: config.stem,
      explanation: config.explanation,
      related: config.related || [],
      choices: [
        [config.literal, '只接住了字面，牌桌信息还没翻开。', 0],
        [config.echo, '术语原样打回，声音很响但没有推进。', 1],
        [config.partial, '方向基本对，再补一张行动牌就完整了。', 3],
        [config.correct, '语义、语境和行动都落桌了。', 4, config.extras || {}],
      ],
    };
  }

  const expandedQuestions = [
    expansion({ id: 'cal-decode-03', stage: 'calibration', dimension: 'decode', categoryLabel: '术语校准', stem: '“把颗粒度再往下拆一层”真正要你做什么？', explanation: '颗粒度描述信息细致层级，必须明确拆到哪种可验收单位。', literal: '把表格字号调小', echo: '进一步细化颗粒度', partial: '把任务写得更具体', correct: '拆到可分配、可估时、可验收的最小任务', extras: { translate: 4 } }),
    expansion({ id: 'cal-context-03', stage: 'calibration', dimension: 'context', categoryLabel: '语境校准', stem: '领导回复“你先按自己的理解推进”，最稳妥的动作是？', explanation: '这通常意味着授权伴随风险，需要用书面假设锁住边界。', literal: '完全自由发挥', echo: '先推进再对齐', partial: '写下自己的理解', correct: '发出目标、范围和风险假设，确认后按节点推进', extras: { filter: 3, translate: 4 } }),
    expansion({ id: 'cal-filter-03', stage: 'calibration', dimension: 'filter', categoryLabel: '废话校准', stem: '“打一套品效合一的组合拳”缺的第一张牌是什么？', explanation: '组合拳要有共同目标、动作关系和衡量方式。', literal: '拳法名称', echo: '更完整的组合拳', partial: '列出准备做的活动', correct: '明确共同目标、动作顺序和统一效果指标', extras: { decode: 3 } }),
    expansion({ id: 'cal-translate-03', stage: 'calibration', dimension: 'translate', categoryLabel: '人话校准', stem: '把“赋能一线”翻成可验收任务，哪句最好？', explanation: '赋能要说清对象、能力、方式和结果。', literal: '给一线加油', echo: '持续做好赋能', partial: '给一线做培训', correct: '本周培训门店使用新工具，并以独立完成率验收', extras: { filter: 4 } }),

    expansion({ id: 'decode-06', stage: 'branch', dimension: 'decode', difficulty: 'foundation', categoryLabel: '术语破译', stem: '“沉淀最佳实践”至少需要什么？', explanation: '实践可复用必须包含适用条件、步骤和证据。', literal: '把聊天截图存下来', echo: '形成实践沉淀', partial: '写一份经验文档', correct: '记录适用场景、关键步骤、效果证据与禁用条件', extras: { filter: 3 } }),
    expansion({ id: 'decode-07', stage: 'branch', dimension: 'decode', difficulty: 'advanced', categoryLabel: '术语破译', stem: '“组织势能不足”最可能掩盖什么？', explanation: '抽象势能常把人、权、流程或信息问题揉成一团。', literal: '办公室楼层不够高', echo: '组织能量需要提升', partial: '团队能力不足', correct: '需要拆查缺人、缺权、缺流程还是缺信息', extras: { filter: 4 } }),
    expansion({ id: 'decode-08', stage: 'branch', dimension: 'decode', difficulty: 'advanced', categoryLabel: '术语破译', stem: '真正的“端到端负责人”应该拥有什么？', explanation: '端到端责任需要跨环节可见性、协调权和结果责任。', literal: '坐在工位最边上', echo: '拥有端到端意识', partial: '负责跟进全部群聊', correct: '看见全链路、协调关键依赖并对最终结果负责', extras: { context: 3 } }),
    expansion({ id: 'context-06', stage: 'branch', dimension: 'context', difficulty: 'foundation', categoryLabel: '语境读牌', stem: '评审里听到“方向没问题，细节再打磨”，下一句该问什么？', explanation: '方向通过不等于方案通过，需要找出阻塞上线的具体细节。', literal: '那就是通过了', echo: '我们继续打磨细节', partial: '哪些地方要优化', correct: '哪些问题会阻塞通过、由谁在何时确认', extras: { translate: 4 } }),
    expansion({ id: 'context-07', stage: 'branch', dimension: 'context', difficulty: 'advanced', categoryLabel: '语境读牌', stem: '跨部门说“资源确实比较紧张”，通常应该确认什么？', explanation: '资源紧张可能是拒绝，也可能是等待优先级授权。', literal: '对方最近很忙', echo: '理解资源紧张', partial: '什么时候有空', correct: '是无法承接、需要换优先级，还是要补决策人授权', extras: { filter: 3 } }),
    expansion({ id: 'context-08', stage: 'branch', dimension: 'context', difficulty: 'advanced', categoryLabel: '语境读牌', stem: '老板问“这个方案你自己有信心吗”，高质量回答是？', explanation: '信心题背后常是证据、风险和承诺边界。', literal: '有，必须有', echo: '整体方向有信心', partial: '说出成功概率', correct: '说明已有证据、最大风险和下一步验证节点', extras: { filter: 4, translate: 3 } }),
    expansion({ id: 'culture-06', stage: 'branch', dimension: 'culture', difficulty: 'foundation', categoryLabel: '梗文化考古', stem: '“已读乱回”为什么会成为职场梗？', explanation: '它讽刺形式上响应、实质上没有理解上下文。', literal: '消息软件坏了', echo: '回复方式很抽象', partial: '回答得不够准确', correct: '看似及时响应，实际没接住问题和上下文', extras: { context: 3 } }),
    expansion({ id: 'culture-07', stage: 'branch', dimension: 'culture', difficulty: 'advanced', categoryLabel: '梗文化考古', stem: '“活人感”在职场内容里通常反抗什么？', explanation: '活人感反抗过度包装、标准化与无瑕疵表演。', literal: '同事看起来没睡醒', echo: '内容要更像活人', partial: '表达更口语化', correct: '反抗过度包装和标准答案，保留真实判断与情绪', extras: { context: 3 } }),
    expansion({ id: 'culture-08', stage: 'branch', dimension: 'culture', difficulty: 'advanced', categoryLabel: '梗文化考古', stem: '“工位渡劫”是在玩什么情绪？', explanation: '它把持续压力夸张成修炼劫难，表达疲惫与自嘲。', literal: '工位漏电', echo: '上班像修仙', partial: '今天工作很难', correct: '用夸张修仙叙事消化持续压力和不可控感', extras: { context: 3 } }),
    expansion({ id: 'filter-06', stage: 'branch', dimension: 'filter', difficulty: 'foundation', categoryLabel: '废话鉴别', stem: '“进一步提升用户体验”为什么暂时不能开工？', explanation: '没有用户、场景、问题和验证指标。', literal: '因为体验看不见', echo: '还需继续提升体验', partial: '缺少设计稿', correct: '没说哪个用户在什么场景遇到什么问题、怎么验证改善', extras: { translate: 4 } }),
    expansion({ id: 'filter-07', stage: 'branch', dimension: 'filter', difficulty: 'advanced', categoryLabel: '废话鉴别', stem: '“战略级项目”最需要哪种证据，而不是哪种音量？', explanation: '战略性来自取舍、资源和可验证目标。', literal: '标题用最大字号', echo: '不断强调战略意义', partial: '得到更多领导支持', correct: '明确它替代了什么、获得什么资源、用什么结果验证', extras: { context: 3 } }),
    expansion({ id: 'filter-08', stage: 'branch', dimension: 'filter', difficulty: 'advanced', categoryLabel: '废话鉴别', stem: '一句话同时出现“抓手、闭环、赋能”，先检查什么？', explanation: '术语密度越高，越应检查行动与责任是否缺席。', literal: '是否还能加一个飞轮', echo: '概念是否足够完整', partial: '这些词用得准不准', correct: '是否存在明确对象、动作、负责人和验收结果', extras: { translate: 4 } }),
    expansion({ id: 'translate-06', stage: 'branch', dimension: 'translate', difficulty: 'foundation', categoryLabel: '人话翻译', stem: '“拉通产研运”最好落成哪一句？', explanation: '拉通不是拉群，而是统一输入、决策和交付接口。', literal: '把三方拉进一个群', echo: '强化产研运拉通', partial: '安排三方开会', correct: '统一需求入口、决策人、交付物和变更通知方式', extras: { filter: 4 } }),
    expansion({ id: 'translate-07', stage: 'branch', dimension: 'translate', difficulty: 'advanced', categoryLabel: '人话翻译', stem: '“扩大品牌声量”如何改成实验？', explanation: '声量需要明确人群、触点、行为指标和周期。', literal: '把音量开大', echo: '持续扩大声量', partial: '多发一些内容', correct: '面向目标人群投放两类内容，用搜索与收藏增量比较效果', extras: { filter: 4 } }),
    expansion({ id: 'translate-08', stage: 'branch', dimension: 'translate', difficulty: 'advanced', categoryLabel: '人话翻译', stem: '“提升复盘质量”最像行动项的是？', explanation: '复盘要从感想会变成事实、假设、动作和验证。', literal: '把复盘写长一点', echo: '持续优化复盘机制', partial: '增加复盘会议', correct: '按事实、原因、下次动作和负责人固定模板，并跟踪动作完成率', extras: { filter: 4 } }),

    expansion({ id: 'boss-05', stage: 'boss', dimension: 'decode', difficulty: 'advanced', categoryLabel: '综合 Boss', stem: '方案称“用 AI 赋能全链路，打造第二增长曲线”，你如何亮牌？', explanation: '技术、链路和增长都必须回到场景与证据。', literal: '先采购最贵模型', echo: '形成 AI 赋能闭环', partial: '挑一个 AI 场景试试', correct: '锁定具体用户任务、当前成本、试验指标和停止条件', extras: { context: 4, filter: 4, translate: 4 } }),
    expansion({ id: 'boss-06', stage: 'boss', dimension: 'context', difficulty: 'advanced', categoryLabel: '综合 Boss', stem: '会上三方都说“可以配合”，项目却没人启动，怎么破局？', explanation: '配合不是承诺，必须明确主责、依赖与决策。', literal: '再感谢一次大家支持', echo: '持续拉通形成合力', partial: '拉一个更大的群', correct: '指定唯一主责，逐项确认交付物、依赖和截止时间', extras: { filter: 4, translate: 4 } }),

    expansion({ id: 'playoff-decode-2', stage: 'playoff', dimension: 'decode', difficulty: 'advanced', categoryLabel: '晋级赛', stem: '“生态”成立的关键，不是哪一项？', explanation: '生态不是伙伴名单，而是多方持续交换价值。', literal: '合作方 Logo 足够多', echo: '生态概念足够宏大', partial: '参与方数量增长', correct: '各方有持续交换的价值、规则与留下来的理由', extras: { filter: 3 } }),
    expansion({ id: 'playoff-filter-2', stage: 'playoff', dimension: 'filter', difficulty: 'advanced', categoryLabel: '晋级赛', stem: '“降本增效”不沦为空话，必须同时说清什么？', explanation: '不能只报节省，还要说明代价、质量护栏和效果。', literal: '口号要足够坚定', echo: '持续推进降本增效', partial: '计划节省多少预算', correct: '减少什么成本、影响什么质量、由什么指标守住底线', extras: { translate: 4 } }),
    expansion({ id: 'playoff-translate-2', stage: 'playoff', dimension: 'translate', difficulty: 'advanced', categoryLabel: '晋级赛', stem: '把“形成业务增长合力”翻成一句可签字的话？', explanation: '合力要落到分工、共同指标和接口。', literal: '大家一起用力', echo: '共同形成增长合力', partial: '各团队完成自己的任务', correct: '市场负责获客、产品负责转化，共同以新增付费率验收', extras: { filter: 4, context: 3 } }),
  ];

  root.QuizQuestionBank = [...rawQuestions, ...expandedQuestions].map(makeQuestion);
})(typeof globalThis !== 'undefined' ? globalThis : this);
