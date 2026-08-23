# Jargon Arena

中文名：**黑话段位局**

一句话简介（小红书发布字段可直接复制）：**把互联网黑话翻译成人话**

一个离线运行的互联网黑话段位测试小工具。用 10 道场景题，测测你能不能把职场黑话、网络梗和抽象表达翻译成具体的人话与行动。

> 最高境界不是会说黑话，而是知道什么时候不用说。

## 发布信息

| 字段 | 内容 |
| --- | --- |
| 小工具名称 | 黑话段位局 |
| 简介 | 把互联网黑话翻译成人话 |
| 图标 | `branding/jargon-arena-icon.png` |
| 推荐权限 | 不需要权限 |
| 运行方式 | 离线静态 H5 |

图标是 1:1 PNG，1254×1254，RGBA，约 3.24 MB，四角为不透明方角，适合截图中所示的图标上传字段。图标不属于运行包，发布时单独上传；上传包只包含运行所需的 `index.html` 和 `assets/`。

## 为什么做它

很多“黑话测试”只是在考词汇记忆，但真实工作里更重要的是：听到抽象表达后，能不能继续追问目标、负责人、时间和结果。

所以这个工具不把“会说黑话”当成能力，而是把**从抽象话术还原成具体行动**作为核心体验。

## 功能

- 10 道互联网黑话与网络语境选择题
- 覆盖职场黑话、网络梗、语境判断和反黑话翻译
- 每题即时反馈，帮助用户理解自己的判断
- 6 档测试结果，从“黑话村口观察员”到“互联网黑话宗师”
- 按分类平均表现生成结果标签，避免题目数量多的分类天然占优
- 结果卡片、标签和“人话处方”，适合截图分享
- 逐题解析与重新测试
- 纯本地运行，不上传答题记录

## 设计哲思

本项目不是把某位产品经理的观点贴到 README 上，而是抽取几条能落到交互细节的原则：

1. **做减法**：借鉴 Steve Jobs 式的克制，只保留一次测试真正需要的流程：开始、答题、结果、解析。
2. **让界面给反馈**：借鉴 Don Norman 关于可供性和反馈的思路，按钮状态、进度、选中态和即时解释都明确告诉用户“现在发生了什么”。
3. **交付行动而不是分数**：借鉴 Marty Cagan 的问题导向，结果页不只给一个等级，还给出可带回会议现场使用的“目标、负责人、时间、结果”追问框架。
4. **让内容成为产品性格**：纸张档案、研究编号、批注式解析和略带吐槽的结果文案，共同构成“黑话研究室”的识别度，而不是套一个通用答题模板。

## 视觉方向

采用暖黑、米白和土黄色的纸张记录感视觉，模拟一份带有批注的“黑话研究档案”。

- 不使用蓝紫渐变、霓虹光效或泛 AI 模板视觉
- 结果卡片优先服务截图传播
- 暖黑背景适合小红书半屏容器，也避免大面积纯白刺眼
- 移动端优先，兼容 320px 窄屏和安全区

## 技术特点

- 原生 HTML、CSS 和 JavaScript
- 无框架、无构建步骤、无第三方依赖
- 无外部网络请求，可离线运行
- 单页视图切换，符合小红书小工具的单页形态
- 题库、评分逻辑和界面逻辑分离
- 每次测试随机打乱选项，避免“永远选第一个就是满分”
- 对题库数量、分类、重复 ID、重复选项和解析完整性进行启动校验
- 交互使用按钮和键盘可达性，不依赖 hover 才能完成核心流程

## 项目结构

```text
.
├── index.html                 # 小工具唯一入口
├── assets/
│   ├── main.js                # 页面状态与交互
│   ├── question-bank.js       # 10 道题目与解析
│   ├── quiz-core.js           # 评分、等级、标签、题库校验
│   └── style.css              # 移动端视觉样式
├── branding/
│   └── jargon-arena-icon.png  # 发布页单独上传的图标
├── scripts/
│   ├── build-upload.ps1       # 只打包运行文件，生成上传 ZIP
│   └── preflight-upload.ps1   # 对上传 ZIP 做规则门禁扫描
└── tests/
    ├── quiz-core.test.js      # Node 单元测试
    ├── static-server.cjs      # 本地静态服务器
    └── ui-smoke.py            # Playwright 移动端流程测试
```

## 本地运行

项目是纯静态页面。最简单的方式是直接打开 `index.html`；也可以启动本地服务器：

```powershell
node .\tests\static-server.cjs
```

然后访问 `http://127.0.0.1:4183`。

## 测试与自检

运行评分和题库单元测试：

```powershell
node --test .\tests\quiz-core.test.js
```

运行 JavaScript 语法检查：

```powershell
node --check .\assets\main.js
node --check .\assets\question-bank.js
node --check .\assets\quiz-core.js
```

启动静态服务器后，运行 Playwright 移动端测试：

```powershell
python .\tests\ui-smoke.py
```

UI 测试覆盖：开始测试、10 道题、键盘方向键、分类标签、结果卡片、解析展开、重复提交防护、重新测试、375×812 和 320×568 窄屏无横向溢出，以及页面异常监听。

## 生成小红书上传包

不要把整个 GitHub 仓库直接压缩上传。仓库中的 README、测试脚本、发布图标和 `.git` 目录不属于运行包。

在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-upload.ps1
```

脚本只打包 `index.html` 和 `assets/`，在仓库同级生成 `jargon-arena-upload.zip`，保证 `index.html` 位于 ZIP 根目录。

生成后执行上传前门禁：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\preflight-upload.ps1 -ZipPath ..\jargon-arena-upload.zip
```

门禁会检查：

- ZIP 根目录是否存在 `index.html`
- 文件类型是否在官方允许范围内
- 包体积是否低于本项目的保守门槛 2 MB
- 是否存在外部资源、网络请求、受限 Web API、内联脚本、`iframe`、`object`、`base`、下载、外链跳转或 ES Module
- 上传包是否只包含运行时文件

## 官方 1.4.1 规则对齐

本次发布校验使用官方静态规则包 1.4.1：

```text
.codex/minitool-zip-builder-1.4.1/SKILL.md
```

规则包已解压到工作区并读取，相关参考文件位于同目录的 `references/` 下。当前实现按以下要求收敛：

- ZIP 根目录直接放置单一 `index.html`
- 使用经典外置脚本，不使用 `type="module"`、`import`、`export` 和顶层 await
- 所有资源使用包内相对路径，不引用 CDN、外部字体或图片
- 不使用 fetch、XHR、WebSocket、iframe、Worker、WASM、剪贴板、定位、下载或外部跳转
- 使用移动端 viewport 与安全区 fallback，核心操作不依赖 hover
- 官方规则包给出的 ZIP 总上限为 10 MB，并建议控制在 2 MB 以内；本项目门禁继续使用更保守的 2 MB 阈值

小红书公开平台页面也将小组件描述为轻量、场景化的单页体验，并说明当前仍以邀请制灰度为主：[小红书官方小组件介绍](https://miniapp.xiaohongshu.com/doc/DC026740)。技术包通过本地门禁不代表平台账号侧已经获得资格或最终审核通过。

## 当前验收结果

最近一次完整验收结果：

```text
6 个 Node 单元测试通过
JavaScript 语法检查通过
UPLOAD_PREFLIGHT=PASS
UPLOAD_BYTES=14340
运行包解压后文件：index.html + 4 个 assets 文件
Playwright UI smoke：375×812、320×568 均通过
图标：1254×1254 PNG / RGBA / 3244228 bytes / 四角 alpha=255
```

正式发布前仍应在 Builder Hub 中上传生成的 ZIP，完成平台预览和真机验证，再提交审核。静态检查、浏览器测试和平台最终审核是三个不同层级，不能相互替代。

## 项目定位

这是一个以娱乐和社交分享为主的轻量测试工具，结果仅供娱乐，不代表真实职业能力。项目不包含账号体系、服务端、统计分析、AI 接口或任何联网能力。
