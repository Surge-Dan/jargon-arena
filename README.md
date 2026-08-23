# Jargon Arena · 黑话段位局

> 能听懂黑话，也敢把话说明白。

一个为小红书 Builder Hub 小工具设计的离线互动测评。它不测“班味”或人格，而是通过真实互联网职场语境，综合评估用户理解术语、识别潜台词、读懂文化梗、过滤空话和翻译成人话的能力，最终获得一个有晋级感的趣味段位。

## 发布信息

| 字段 | 建议内容 |
| --- | --- |
| 小工具名称 | 黑话段位局 |
| 简介 | 黑话能听懂，人话更高段 |
| 英文仓库名 | `jargon-arena` |
| 图标 | `branding/jargon-arena-icon.png` |
| 推荐权限 | 相册照片与视频、本地存储 |
| 运行方式 | 单页离线静态 H5 |

图标为 1:1 方形 PNG，四角不透明、无圆角，不放入运行 ZIP；发布时在 Builder Hub 单独上传。

## 完整功能清单

### 1. 自适应段位测评

- 44 道互联网职场黑话、组织语境和网络文化题
- 单次动态抽取 13–15 题，不同用户题目路线不完全相同
- 前 8 题完成基础校准，再根据强项和弱项进入两条专项支线
- 第 13 题进入综合会审；接近晋级线时自动追加 1–2 道晋级赛
- 每次重测优先抽取本机历史中未出现的题目
- 选项不是简单对错，每项都绑定五维 0–4 权重
- 每题有即时情绪反馈，结果页再输出结构化解释

### 2. 五维测评内核

| 维度 | 判断内容 |
| --- | --- |
| 术语破译 | 能否理解抓手、闭环、颗粒度等术语真正指向的结构 |
| 语境雷达 | 能否识别“再看看”“原则上支持”等表达的条件与潜台词 |
| 梗文化考古 | 能否理解内卷、摸鱼、班味等文化梗背后的共同处境 |
| 废话鉴别 | 能否发现抽象表达里缺失的对象、指标、责任与边界 |
| 人话翻译 | 能否把概念压缩成可执行、可验收的下一步 |

五个维度分别按本轮可得分归一化到 0–100，再等权计算综合分，避免某类题量较多就天然占优。

### 3. 八级段位与晋级感

1. 人话保护区原住民
2. 黑话村口观察员
3. 热词练习生
4. 会议室生还者
5. 语境翻译官
6. 抓手装配师
7. 组织语言架构师
8. 返璞归真人话掌门

最高段位不仅要求综合分达到 92，还要求“废话鉴别”和“人话翻译”同时过线：会说复杂话不是终点，能选择说清楚才是。

### 4. 完整结构化报告

- 段位名、段位编号、专属画像和一句话判词
- 五维雷达图、单维分数、对应能力解读
- 两枚最高维度专精徽章
- 会议现场表现、优势、固有雷区
- 针对性行动建议、适配工作环境、下一项晋级任务
- 第二次测评起展示五维变化对比

### 5. 用完不走的附加模块

- **段位图鉴**：浏览全部 8 个段位的档案、判词和晋级任务
- **黑话词典**：内置 36 个高频术语与文化梗，支持本地搜索和分类筛选
- **落地追问**：每个词不仅有释义，还有使用风险和一句可直接带进会议的追问
- **测评记录**：本地最多保留 8 次结果，可回看报告、比较变化或清空记录

### 6. 小红书分享链路

- Canvas 生成 1080×1440 高清竖版“黑话通行证”
- 海报包含段位、综合分、五维雷达、专精徽章、判词和话题标签
- 在小红书容器中调用 `writeTempFile` → `saveImageToPhotosAlbum` 保存相册
- 调用 `postNote` 进入图文笔记发布页
- 普通浏览器没有 Native 桥接时保留图片预览，不阻断报告浏览

## 视觉与产品哲思

视觉采用“职场文艺 × 轻电子扫描仪”：复印纸底纹、档案编号、方形印章、批注红、扫描青和工位通行证共同形成产品识别度。页面没有蓝紫渐变、霓虹、玻璃拟态、机器人或通用仪表盘卡片。

产品设计吸收了几类成熟思路，但不照搬外壳：

- **Steve Jobs 的减法**：主线只围绕“听懂—拆解—说清”展开，附加模块服务复用，不堆无关功能。
- **Don Norman 的可见反馈**：答题选中态、即时反馈、真实阶段、动态题量和报告加载都有明确状态。
- **游戏化晋级**：段位线、专项路线、Boss 和晋级赛让测评有过程感，而不是一次性算分。
- **人格报告的可读结构**：用画像、优势、风险与行动建议组织内容，但明确不把结果包装成心理学或职业能力诊断。
- **最高段位回归人话**：这是产品自己的价值判断，也是与普通“黑话词汇量测试”的核心区别。

## 移动端体验

- 所有页面统一预留系统状态栏和小红书原生顶部控件安全距离
- 顶部、答题、报告、图鉴、词典、历史、分享弹层全部使用同一安全区策略
- 重点操作不贴屏幕边缘，按钮触控尺寸不小于 48px
- 已覆盖 320×568、375×812、430×932 三档视口
- 支持键盘方向键选择、焦点样式、ARIA 单选组和减少动态效果偏好
- 纯本地运行，不上传答案或历史记录

## 技术架构

项目使用原生 HTML、CSS 和经典 JavaScript，无框架、无第三方依赖、无构建依赖、无外部网络请求。

```text
.
├── index.html
├── assets/
│   ├── main.js             # 页面状态、自适应流程与模块交互
│   ├── quiz-core.js        # 选题、计分、段位、徽章与题库校验
│   ├── question-bank.js    # 44 道题及五维权重
│   ├── content-data.js     # 八段位档案、36 词词典、维度文案
│   ├── storage.js          # 本地历史、去重、对比
│   ├── poster.js           # 高清海报与小红书 JSBridge
│   └── style.css           # 全页面视觉与移动适配
├── branding/
│   └── jargon-arena-icon.png
├── docs/superpowers/specs/
│   └── 2026-08-23-jargon-arena-rebuild-design.md
├── scripts/
│   ├── build-upload.ps1
│   └── preflight-upload.ps1
└── tests/
    ├── quiz-core.test.js
    ├── content-data.test.js
    ├── storage.test.js
    ├── poster.test.js
    ├── ui-smoke.py
    ├── upload-package.py
    └── static-server.cjs
```

## 本地运行

```powershell
node .\tests\static-server.cjs
```

浏览器打开 `http://127.0.0.1:4183`。

## 测试

运行全部 Node 单元测试：

```powershell
node --test .\tests\quiz-core.test.js .\tests\content-data.test.js .\tests\storage.test.js .\tests\poster.test.js
```

启动本地服务器后运行浏览器测试：

```powershell
python .\tests\ui-smoke.py
```

浏览器测试会实际跑完一轮动态题目，验证报告、雷达、徽章、词典、图鉴、历史、高清海报和 Native 桥接参数，同时检查三档移动视口和页面异常。

## 生成 Builder Hub 上传包

在仓库根目录执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build-upload.ps1
```

上传包生成在仓库同级目录：

```text
..\jargon-arena-upload.zip
```

继续执行两层门禁：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight-upload.ps1 -ZipPath ..\jargon-arena-upload.zip
python .\tests\upload-package.py ..\jargon-arena-upload.zip
```

当前产物：

```text
ZIP 压缩后：43,588 bytes
解压运行文件：139,063 bytes
运行条目：8
UPLOAD_PREFLIGHT=PASS
ZIP PATH TEST PASSED
```

## 小红书 1.4.1 规则对齐

本项目按官方 `minitool-zip-builder 1.4.1` Skill 校验：

- ZIP 根目录直接包含唯一入口 `index.html`
- 运行包只包含 `index.html` 与本地 `assets/`
- 所有 ZIP 原始条目使用安全的 `/` 相对路径，不含 `..`、绝对路径或反斜杠
- 使用经典外置脚本，不使用内联脚本、ES Module、`import`、`export` 或顶层 await
- 不使用网络请求、外链资源、`iframe`、Worker、WASM、剪贴板、定位、外链跳转或浏览器文件保存属性
- `postNote.mediaInfo.image_resources`、完整 data URI、临时文件和相册保存链路符合官方 JSBridge 参考
- 运行包远低于 2 MB 保守门槛

## 当前验证结果

```text
15 项 Node 单元测试通过
6 个运行 JavaScript 文件语法检查通过
Playwright 全流程通过
320×568 / 375×812 / 430×932 无横向溢出
1080×1440 海报生成通过
相册保存与笔记发布桥接模拟通过
UPLOAD_PREFLIGHT=PASS
ZIP PATH TEST PASSED
```

这些结果证明本地逻辑、浏览器交互和上传包静态约束已通过；正式发布仍需在 Builder Hub 上传 ZIP，完成平台预览、真机相册授权和平台审核。三者不是同一层验证，README 不把本地通过表述成平台审核通过。

## 免责声明

结果用于娱乐、语言观察和表达训练，不代表真实人格、心理状态或职业能力。
