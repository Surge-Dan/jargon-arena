(function attachQuizPoster(root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.QuizPoster = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createQuizPoster() {
  const POSTER_WIDTH = 1080;
  const POSTER_HEIGHT = 1440;

  function buildShareCopy(result) {
    const rank = result && result.rank ? result.rank : {};
    const rankName = rank.name || '黑话段位待鉴定';
    const tier = rank.tier || '未定级';
    const overall = Number(result && result.overall) || 0;
    const badges = Array.isArray(result && result.badges) ? result.badges : [];
    const badgeText = badges.map((badge) => badge.label).filter(Boolean).join('、') || '人话观察员';
    const dimensions = (result && result.dimensions) || {};
    const dimensionLabels = { decode: '术语破译', context: '语境雷达', culture: '梗文化', filter: '废话鉴别', translate: '人话翻译' };
    const dimensionRows = Object.keys(dimensionLabels).map((key) => ({ key, score: Number(dimensions[key]) || 0 }));
    const strongest = [...dimensionRows].sort((a, b) => b.score - a.score)[0];
    const weakest = [...dimensionRows].sort((a, b) => a.score - b.score)[0];
    const style = (result && result.pokerStyle) || '先看牌面，再听弦外音';
    const gap = (result && (result.rankGap || result.mission)) || '把抽象方向翻成负责人、时间与验收标准';
    return {
      title: `我在黑话牌桌打到${tier}`.slice(0, 20),
      content: `刚打完一局「黑话段位局」，系统给我翻牌：${tier} · ${rankName}，综合扫描 ${overall} 分，专精徽章是「${badgeText}」。这张互联网职场牌桌上，我的打法被判定为“${style}”：抓手可以有，但先说清抓什么；闭环可以画，但别拿圆圈当进度条；颗粒度可以往下拆，但不能把一个动作拆成八场会。\n\n五维牌面里，我最能打的是${dimensionLabels[strongest.key]}（${strongest.score}），最容易被偷鸡的是${dimensionLabels[weakest.key]}（${weakest.score}）。看来我已经能在“对齐一下—拉通一下—赋能一下—沉淀一下”的组合拳里活着走出会议室，但离真正的人话自由还有一手关键牌：${gap}。\n\n这局最抽象的地方，是它不只考你认不认识互联网黑话，还考你能不能听出潜台词、识别废话、把“打造全链路增长飞轮”翻成今天谁做什么。会说黑话不算王者，能判断什么时候该跟注、什么时候该追问、什么时候直接把牌翻成人话，才叫控桌。\n\n我现在宣布：以后再听到“原则上支持”，先问条件；听到“后面再对齐”，先定时间；听到“形成业务合力”，先找负责人。黑话不是原罪，拿黑话藏住问题才是。轮到你上桌了——看看你会被一句“提升组织势能”打懵，还是能把整桌的抓手、闭环、颗粒度、赋能和组合拳全部翻译成人话。`,
      tags: '#黑话段位局 #互联网职场 #职场黑话 #打工人嘴替 #人话翻译局',
    };
  }

  function wrapText(context, text, maxWidth) {
    const lines = [];
    let current = '';
    Array.from(String(text || '')).forEach((character) => {
      const next = current + character;
      if (current && context.measureText(next).width > maxWidth) {
        lines.push(current);
        current = character;
      } else {
        current = next;
      }
    });
    if (current) lines.push(current);
    return lines;
  }

  function drawRadar(context, dimensions, labels, centerX, centerY, radius) {
    const keys = ['decode', 'context', 'culture', 'filter', 'translate'];
    const points = keys.map((key, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / keys.length;
      return { key, angle, score: Math.max(0, Math.min(100, Number(dimensions[key]) || 0)) };
    });

    context.save();
    context.translate(centerX, centerY);
    context.strokeStyle = 'rgba(34,36,33,0.18)';
    context.lineWidth = 2;
    [0.25, 0.5, 0.75, 1].forEach((level) => {
      context.beginPath();
      points.forEach((point, index) => {
        const x = Math.cos(point.angle) * radius * level;
        const y = Math.sin(point.angle) * radius * level;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.closePath();
      context.stroke();
    });

    context.beginPath();
    points.forEach((point, index) => {
      const x = Math.cos(point.angle) * radius;
      const y = Math.sin(point.angle) * radius;
      context.moveTo(0, 0);
      context.lineTo(x, y);
      if (index === 0) context.moveTo(x, y);
    });
    context.stroke();

    context.beginPath();
    points.forEach((point, index) => {
      const scaled = radius * (point.score / 100);
      const x = Math.cos(point.angle) * scaled;
      const y = Math.sin(point.angle) * scaled;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = 'rgba(120,166,156,0.42)';
    context.strokeStyle = '#557b73';
    context.lineWidth = 5;
    context.fill();
    context.stroke();

    context.fillStyle = '#222421';
    context.font = '28px "Microsoft YaHei", sans-serif';
    context.textAlign = 'center';
    points.forEach((point) => {
      const labelRadius = radius + 56;
      const x = Math.cos(point.angle) * labelRadius;
      const y = Math.sin(point.angle) * labelRadius + 10;
      context.fillText(labels[point.key] || point.key, x, y);
    });
    context.restore();
  }

  function drawPoster(canvas, result) {
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    const context = canvas.getContext('2d');
    const rank = result.rank || { id: 1, name: '段位待鉴定', code: 'PENDING' };
    const badges = result.badges || [];
    const dimensions = result.dimensions || {};

    context.fillStyle = '#E8E1D3';
    context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
    context.fillStyle = '#222421';
    context.fillRect(0, 0, POSTER_WIDTH, 214);
    context.fillStyle = '#D3B75A';
    context.fillRect(0, 204, POSTER_WIDTH, 10);

    context.fillStyle = '#E8E1D3';
    context.font = '700 34px "Courier New", monospace';
    context.fillText('JARGON CLEARANCE / 黑话通行证', 76, 92);
    context.font = '24px "Microsoft YaHei", sans-serif';
    context.fillStyle = '#9A9B91';
    context.fillText(result.recordCode || 'LOCAL-ASSESSMENT', 76, 144);

    context.fillStyle = '#C85B45';
    context.font = '700 38px "Courier New", monospace';
    context.fillText(`LV.${rank.id}`, 76, 306);
    context.fillStyle = '#222421';
    context.font = '700 76px "STSong", "SimSun", serif';
    const titleLines = wrapText(context, rank.name, 900).slice(0, 2);
    titleLines.forEach((line, index) => context.fillText(line, 76, 402 + index * 86));

    context.font = '700 30px "Courier New", monospace';
    context.fillStyle = '#557b73';
    context.fillText(`综合扫描值 ${String(result.overall || 0).padStart(2, '0')} / 100`, 76, 574);

    drawRadar(context, dimensions, {
      decode: '术语破译', context: '语境雷达', culture: '梗文化', filter: '废话鉴别', translate: '人话翻译',
    }, 540, 850, 232);

    context.fillStyle = '#222421';
    context.font = '700 30px "Microsoft YaHei", sans-serif';
    context.fillText('专精徽章', 76, 1152);
    context.font = '26px "Microsoft YaHei", sans-serif';
    badges.slice(0, 2).forEach((badge, index) => {
      context.strokeStyle = index === 0 ? '#C85B45' : '#557b73';
      context.lineWidth = 3;
      context.strokeRect(76 + index * 430, 1186, 392, 70);
      context.fillText(badge.label, 104 + index * 430, 1231);
    });

    context.fillStyle = '#222421';
    context.font = '700 30px "STSong", "SimSun", serif';
    wrapText(context, result.quote || '最高境界不是会说黑话，而是知道什么时候不用说。', 900)
      .slice(0, 2)
      .forEach((line, index) => context.fillText(line, 76, 1328 + index * 42));
    context.font = '22px "Courier New", monospace';
    context.fillStyle = '#77786f';
    context.fillText('#黑话段位局  #互联网职场  #职场黑话', 76, 1402);

    return canvas;
  }

  function createPosterDataUrl(documentObject, result) {
    const canvas = documentObject.createElement('canvas');
    drawPoster(canvas, result);
    return { canvas, dataUrl: canvas.toDataURL('image/png') };
  }

  async function savePoster(rootObject, dataUrl) {
    const bridge = rootObject && rootObject.xhs && rootObject.xhs.miniTool;
    if (!bridge || typeof bridge.saveImageToPhotosAlbum !== 'function') {
      return { ok: false, mode: 'preview', message: '当前环境未提供相册保存能力，请使用图片预览保存。' };
    }

    try {
      let filePath = dataUrl;
      if (typeof bridge.writeTempFile === 'function') {
        const tempResult = await bridge.writeTempFile({ data: dataUrl });
        filePath = tempResult.filePath;
      }
      await bridge.saveImageToPhotosAlbum({ filePath });
      return { ok: true, mode: 'album', message: '高清通行证已保存到相册。' };
    } catch (error) {
      return { ok: false, mode: 'preview', message: (error && error.errMsg) || '保存失败，请使用图片预览截图。' };
    }
  }

  async function postPoster(rootObject, dataUrl, result) {
    const bridge = rootObject && rootObject.xhs && rootObject.xhs.miniTool;
    if (!bridge || typeof bridge.postNote !== 'function') {
      return { ok: false, mode: 'preview', message: '当前环境未提供发布能力，已为你生成分享图。' };
    }

    const copy = buildShareCopy(result);
    try {
      await bridge.postNote({
        title: copy.title,
        content: `${copy.content}\n${copy.tags}`,
        pageType: 'photo_publish',
        mediaInfo: { image_resources: [{ url: dataUrl }] },
        tags: copy.tags,
      });
      return { ok: true, mode: 'post', message: '已打开笔记发布页。' };
    } catch (error) {
      return { ok: false, mode: 'preview', message: (error && error.errMsg) || '打开发布页失败，已保留分享图。' };
    }
  }

  return {
    POSTER_HEIGHT,
    POSTER_WIDTH,
    buildShareCopy,
    createPosterDataUrl,
    drawPoster,
    postPoster,
    savePoster,
  };
});
