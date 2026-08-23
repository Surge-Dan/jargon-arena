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
    const rankName = result && result.rank ? result.rank.name : '黑话段位待鉴定';
    const overall = Number(result && result.overall) || 0;
    return {
      title: `我的黑话段位：${rankName}`.slice(0, 20),
      content: `刚测完黑话段位局：${rankName}，综合分 ${overall}。最高境界不是把话说复杂，而是知道什么时候该说人话。`,
      tags: '#黑话段位局 #互联网职场 #职场黑话',
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
