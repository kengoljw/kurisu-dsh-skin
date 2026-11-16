# Makise Kurisu · DSH Skin

牧濑红莉栖（Makise Kurisu / Amadeus）主题的 DSH 插件（plugin）。深色是「夜航列车」的深蓝与绯红，浅色是实验室白与暖奶油，交互强调色用 Amadeus 青绿。壁纸取自本机 `wallpaper-tool/images` 图库，可随系统浅色 / 深色自动换图。

本文只保留骨干要点。版本沿革、逐帧调试记录与实测数据见 [README-detail.md](README-detail.md)。

![深色预览](preview/preview-dark.png) ![浅色预览](preview/preview-light.png)

## 1. 功能

| 模块 | 要点 |
| --- | --- |
| 配色 | 只覆盖 alias 层 token（125 个，每个是 `{light, dark}` 对），不改组件源码；同时注册 `kurisu-amadeus`（dark）/ `kurisu-amadeus-day`（light）两个可选主题 |
| 壁纸 | 4 张 1600×900 WebP（46–166 KB）内联为 `data:` URI：夜行列车（深色）/ 白昼窗边（浅色）/ 薄暮荒原 / 星夜图书馆；可自动换图、手动选，或选「无壁纸」只留配色 |
| 玻璃面板 | 三档透明度 `solid` / `mid`（默认）/ `clear`，作用于侧栏、会话框、输入框、代码块；叠 `backdrop-filter` 保证文字对比度；写入 `localStorage`，系统「降低透明度」时自动关模糊 |
| 图标、按钮、动效 | Amadeus 徽章、细线图标悬停绯红辉光、珐琅渐变发送键、输入框 CRT 扫描线、终端风滚动条 / 焦点环 / 代码块；全部常态自动运行，不依赖 hover；`html[data-ks-polish="off"]` 与 `prefers-reduced-motion` 可整体关闭 |
| 世界线计 | 侧栏底部 8 管辉光管（v4 零依赖 Web Component），点击在 β `1.130205` / Steins Gate `1.048596` / α / δ / Ω 间切换，纯装饰 |
| 启动画面 | 从 t=0 首帧到 React 就绪始终只有一块 `#ks-loadscreen`：雪花 → PHONEWAVE 打字 → `EL PSY KONGROO` 字幕 → 辉光管收敛 → 溶解交接；背景与 AppFrame 同一张壁纸，淡出是揭示而非切换 |

配色：夜航深蓝 `#06080f`、实验室白 `#f4eee6`、领带绯红 `#9c3140` / `#e0919c`、Amadeus 青绿 `#2f8f7c` / `#6fc7b5`、暖灰墨 `#2b2023` / `#f3ede9`。

## 2. 使用

1. **设置 → 通用 → Makise Kurisu**：选壁纸、切面板透明度三档、一键开关「图标 / 按钮 / 动效」。
2. 选择写入 `localStorage`（如 `dsh-skin-kurisu:wallpaper`），重载后保留；浅色 / 深色跟随系统。
3. 点击侧栏底部读数切换世界线。
4. 仅客户端样式改动：用 `plugin_manager` 把 `include:dsh-skin-kurisu` 关一次再开即可，不必重启 DSH。改动 `app.asar` 或 host / client bundle 后**必须重启 DSH**。

## 3. 构建、安装、卸载

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1      # assets/*.webp 内联进 lib/client.js
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1    # 安装到当前 profile
powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall.ps1  # 移除包与 patch 行
```

`install.ps1` 幂等：重复执行只覆盖包文件，不重复追加 patch 行；每次修改前生成 `cordis.patch.yml.bak-kurisu-*` 备份。当前已写入桌面 profile：`<profile>\node_modules\dsh-skin-kurisu`，`cordis.patch.yml` 末尾 `- insert: dsh-skin-kurisu`，`include:dsh-skin-kurisu` 为 `enabled: true` / `fiberPhase: active`。

## 4. 关键约束（维护必读）

- **壁纸挂点**：必须画在 `div.MnhYfG_frame`（AppFrame）的 background 层。它是内置 `root` slot、自带不透明底，挂 `body` 会被整块盖住；会话链路中间几层底色清成透明，只在会话列留一层薄纱。
- **选择器抗哈希**：不要按缓存里的旧 CSS 猜类名。`[class$="_card"]`（后缀匹配，不误伤 `_card_7gxqk_107`）、`[data-agent-id]`、`.bt-mark` 这类语义属性 / 稳定类名才可靠；改 CSS 前用 DOM 探针读真实 `class` / `rect` / computed style。ds-bot 图标是 `fill="url(#…)"` 渐变，只能靠 `filter` 换色。
- **CSS 变量作用域**：`--ks-*` 必须声明在 `body`——ThemePresenter 把 `--dsw-*` 写成 `document.body` 的内联样式，而 `var()` 只在声明它的元素上解析。主题 token 是内联样式，普通样式表压不过，所以面板三档用 `!important`。
- **槽位**：`sidebar.brand.mark` / `conversation.hero.brand.mark` 是 `single` 槽，以 `priority: -10` 注册并包 try/catch（同优先级重复注册会抛，负优先级才压得过官方 `brand-official`）。设置行 `settings.general.item`（id `kurisu-skin`）、世界线计 `sidebar.footer.action`（`list` 槽，id `kurisu-divergence-meter`）都是纯追加。
- **启动屏的两个注入点**：宿主侧 `lib/index.js` 在 `webserver/index-inject` 推 `style` / `html` / `script` 三行，渲染端 `PZ()` 在应用挂载前落地；原生 t=0 首帧只能改 `app.asar → lib/web-document.js → LOADING_STYLE`。asar 用**头部手术**：把该 entry 的 `offset/size` 指到归档末尾追加的新内容、删其 `integrity`，只重写头部 JSON，不重打包 180 MB（fuse `EnableEmbeddedAsarIntegrityValidation` 已禁用）。
- **升级与回滚**：DSH 升级会覆盖 `app.asar`，升级后重跑 `node research/patch-asar-splash.mjs --apply`（幂等；另有 `--dry-run` / `--verify` / `--restore`）。原始内容备份由 `research/native-splash/` 维护：`--apply` 时自动生成 `web-document.orig.js` / `header.orig.json` / `backup-manifest.json` 三份文件，`--restore` 用它们还原。
- **序列只有一个时钟**：`p = max(真实 --dsh-boot-arc, 墙钟地板, lastP)`，弧线最多领先诚实时钟 `0.08p`；`MIN_FILM_MS = 16000` 是播放下限而非延迟，应用早于 16s 就绪也不硬切；`finish()` 要同时满足「shell 已撤」和「已收敛」。快启动走「切到收敛拍」，不是把整部片压进 1s。
- **模板字面量**：`host.template.js` / `client.template.js` 里不能出现反引号、`${}` 或裸反斜杠（含注释）；`sg-nixie.js` 用法注释含 `<script>`，内联必须走 `script.textContent` 而非裸 HTML。注入行按 `PZ` 顺序执行，组件脚本要排在加载屏脚本之前。
- **性能**：只动 `transform` / `opacity` / `filter`，全屏层加 `will-change: opacity` 拿独立合成层；溶解期停掉 rAF 与全部装饰绘制。

## 5. 验证

两层验证：headless Chrome 里用 mock `__ModuleLoader__` / `ctx` 执行构建产物；另一份 harness 套用 shipped 真实 CSS 与真实类名复刻 DOM，确认壁纸确实能透出来。

常用检查：

```powershell
node preview/check-host-template.mjs         # 模板字面量 + node --check
node preview/check-built-index.mjs          # 构建产物占位符 / 壁纸 URI / 探针端点
node preview/check-wallpaper-parity.mjs     # 4 张壁纸与客户端逐字节一致
node preview/check-production-schedule.mjs # 排程落点与终端单调退场
node research/patch-asar-splash.mjs --verify
```

开机探针：`tools/boot-probe-server.mjs` 只绑 `127.0.0.1:8791`，落 `preview/boot-probe.jsonl` / `boot-probe-summary.txt`；`localStorage["ks-boot-tl"]` 是收集端不在时的兜底，`preview/decode-boot-timeline.mjs` 可从 leveldb 取回真实时间线。`preview/make-boot-e2e.mjs` 从真实构建产物生成可冻结帧（`?at=<p>` / `?shell=<s>`）的演练页。

## 6. 文件

```
kurisu-skin/
├── package.json / cordis.patch.yml
├── lib/index.js          # 宿主注入（LOAD_CSS + SEQUENCE_JS + LOAD_SCRIPT）
├── lib/client.js         # 构建产物，含 4 张内联壁纸（约 1.1 MB）
├── src/client.template.js / host.template.js / sg-nixie.inline.js
├── tools/boot-probe-server.mjs
├── preview/                 # 检查脚本、E2E 演练页、实拍帧、探针日志
├── research/native-splash/  # asar 头部手术补丁、payload、fixture 测试
├── assets/                  # WebP + 缩略图 + 素材总览
├── build.ps1 / install.ps1 / uninstall.ps1
└── README.md / README-detail.md
```

## 7. 素材与授权

- 角色：牧濑红莉栖 / Makise Kurisu，出自《Steins;Gate》（5pb. / Nitroplus）。本皮肤是非商业同人主题，角色与插画版权归原作者所有。
- 壁纸来自本机 `wallpaper-tool/images` 既有收藏；皮肤只做裁切、压缩与色罩处理。
- 字体 Nixie One（SIL OFL 1.1，许可见 `assets/nixie-one-OFL.txt`）；辉光管字形源自 owenisas/steins-gate-world-line（MIT）。
- 代码（plugin / build / preview）以 MIT 使用。
