# APPLY.md — 应用整套皮肤 + asar 原生启动屏补丁

> 面向：在一台装好 DSH Desktop NEXT 的 Windows 机器上，从 [BACKUP.md](<BACKUP.md>) 的备份
> 完整复原「牧濑红莉栖皮肤」——包括 profile 插件包（配色 / 壁纸 / 辉光管 / 设置行）
> 与 `app.asar`（t=0 起的 5 拍辉光管启动序列）。
> 全部命令从工作区根 `<workspace>` 执行。

---

## 0. 前提（先确认，否则后面全错）

| 项 | 期望值 / 检查方法 |
| --- | --- |
| 宿主版本 | DSH Desktop NEXT `0.2.1-rc.2` / app `2.0.19-next`。版本不同需要重新核对 `research/ui-theme-contract.md` 的类名与 token 表 |
| app.asar 路径 | `<install>\AppData\Local\Programs\DSH NEXT\resources\app.asar`（可用环境变量/实际安装路径替换；补丁脚本会自己读 `backup-manifest.json` 里的路径） |
| Node | `<home>\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe`（**不在 PATH**，必须显式用） |
| 电子 fuse | `EnableEmbeddedAsarIntegrityValidation: disabled`、`OnlyLoadAppFromAsar: disabled`（`research/ui-theme-contract.md` §?、README §105-113 记录；不禁用完整性校验则改动 asar 会被拒） |
| 工作区 | `<workspace>`，包目录 `kurisu-skin/` |
| profile | 默认 `<home>\.dsh\profiles\desktop`（`install.ps1 -ProfileDir` 可改） |
| 备份 | 动手前先读 [BACKUP.md](<BACKUP.md>)，确认 `research/native-splash/` 三份原始备份齐全 |

> ⚠️ **改 asar 前先完全退出 DSH Desktop**：文件被占用时写入会失败或损坏归档。
> 皮肤插件部分不需要退出，但改完 asar **必须重启 DSH** 才生效。

---

## A. 安装皮肤插件（profile 层）

三层结构：`cordis.patch.yml` 注册 loader 行 → `lib/index.js` 宿主入口 → `lib/client.js`
客户端（主题 token 覆盖 / 壁纸 / 槽位 / 设置行 / 世界线计）。

```powershell
cd "<workspace>\kurisu-skin"

# A1. 重新构建（把 assets/*.webp、字体、sg-nixie 组件内联进 lib/client.js 与 lib/index.js）
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
#   产物校验：lib/client.js 与 lib/index.js 存在；build-info.json 刷新

# A2. 安装到 profile（幂等，自动备份并追加 patch 行）
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
#   → <profile>\node_modules\dsh-skin-kurisu
#   → <profile>\cordis.patch.yml 追加 "- insert: dsh-skin-kurisu"

# A3. 让运行中的窗口生效（打包 profile 不走 HMR）
#     Settings → Plugins 里把 include:dsh-skin-kurisu 关一次再开一次；或重启 DSH。
```

**A4 验证**：
- 设置 → 通用出现 **Makise Kurisu** 行，可切「夜行列车 / 白昼窗边 / 薄暮荒原 / 星夜图书馆 / 无壁纸」；
- 面板透明度三档、图标/按钮/动效开关有效；
- 侧栏底部 `1.048596` 辉光管可点击切换世界线；
- `dshmarket` 的 Themes 标签页能看到 `kurisu-amadeus` / `kurisu-amadeus-day`。

**A5 卸载**：`powershell -NoProfile -ExecutionPolicy Bypass -File .\uninstall.ps1`。

---

## B. 应用 asar 原生启动屏补丁（t=0 层）

改的是 `app.asar → lib/web-document.js → LOADING_STYLE`。v2 用**头部手术**：
只改该 entry 的 `offset/size`（指向归档末尾追加的新文件）、重写头部 JSON 并补空格到原
`jsonSize`，其余 20,285 个 entry 一字节不动，不重打包 180 MB。

```powershell
$node = '<home>\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe'
cd "<workspace>"

# B1. 合成归档上的端到端自检（39 项，绝不动真 asar）
& $node 'kurisu-skin\research\native-splash\fixture-test.mjs'

# B2. 对真 asar 的只读计划（无参数默认即 --dry-run；输出当前 header 事实/新体积）
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --dry-run

# B3. 完全退出 DSH Desktop，然后应用（首次会写入三份原始备份，见下）
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --apply

# B4. 校验归档结构
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --verify

# B5. 独立逐字节比对（asar 内 LOADING_STYLE vs 当前 payload.mjs 构建）
& $node 'kurisu-skin\research\native-splash\verify-applied-payload.mjs'

# B6. 重启 DSH Desktop
```

**B3 首次执行会生成（务必随包备份）**：
`research\native-splash\web-document.orig.js`（原 8,457 B entry）、
`header.orig.json`（原 `jsonSize` 头）、`backup-manifest.json`（原始长度/entry 事实/5 个抽样 hash）。

**幂等与安全**：
- 无参数 / `--dry-run` 不写任何东西；`--apply` 从三份备份重建、先截断到原始长度再追加当前 payload；
- 若 live entry offset 与 manifest 不符（例如 DSH 升级换过 asar），补丁脚本**拒绝写入**；
- `--restore` 写回原始头并把 asar 截断到原始长度 —— 原始 entry 字节从未被覆盖，可完整还原。

**B4/B5 期望**（本次实测值，payload 随模板变动会变）：
`--verify` 全 PASS（header JSON / 20286 entries / `#ks-loadscreen` / `sg-nixie` /
offset-size 一致 / integrity dropped / 5 个抽样 hash 未变 / `node --check` 通过）；
B5 输出 `BYTE-IDENTICAL: true`。本次为：
`app.asar 182,034,851 B`（原 180,923,876，delta 1,110,975）、
entry `175621688 / 1110975`、`LOADING_STYLE 1,100,333 B`。

---

## C. 重启后的整体验收

1. 冷启动，从第一帧起就是深蓝底 + 琥珀辉光管 + 5 拍序列
   （snow → 终端打字 → 白字 caption → 世界线逐位收敛到 `1.130205` → 淡出交接）；
2. 全程**只有一块 `#ks-loadscreen`**：宿主注入时调 `KS_SPLASH.adopt()` 接管，不再画第二块板；
3. React 就绪后 700ms 淡出，暗纱揭开是**同一张壁纸**，无跳色/闪白；
4. 侧栏辉光管在 `data-ks-ready` 时点火一次；
5. 可选诊断：先起 `node kurisu-skin\tools\boot-probe-server.mjs`（只监听 127.0.0.1:8791），
   启动后看 `kurisu-skin\preview\boot-probe.jsonl` 与 `boot-probe-summary.txt` 的逐拍墙钟时间。

---

## D. DSH 升级后

升级会**覆盖 app.asar**，补丁消失；profile 里的插件包不受影响。

1. 确认新归档事实：重新跑 `--dry-run`；
2. 删除 `research\native-splash\` 下三份旧备份（`web-document.orig.js`、`header.orig.json`、
   `backup-manifest.json`）——它们描述的是旧构建，留着会被 guard 拒写；
3. 重跑 `fixture-test.mjs` → `--dry-run` → `--apply` → `--verify` → B5；
4. 若新版改了 `lib/web-document.js` 或 fuse 重新启用完整性校验，先更新
   `research/native-splash/README.md` 里的 header 事实与 `payload.mjs` 的注入契约再动手。

---

## E. 回滚顺序

```powershell
$node = '<home>\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe'
cd "<workspace>"

# E1. 先还原 asar（完全退出 DSH 后执行）
& $node 'kurisu-skin\research\patch-asar-splash.mjs' --restore

# E2. 再移除插件包与 patch 行
powershell -NoProfile -ExecutionPolicy Bypass -File .\kurisu-skin\uninstall.ps1

# E3. 重启 DSH
```

只回滚皮肤、保留启动屏：跳过 E1 只做 E2；只去掉启动屏：只做 E1。
`--restore` 之后 `app.asar` 应回到 180,923,876 字节，可再次 `--verify` 确认不再含 `#ks-loadscreen`。

---

## F. 常见坑（都是实测踩过的）

| 现象 | 原因 / 处理 |
| --- | --- |
| `--apply` 报 offset mismatch | DSH 升级换了 asar；按 §D 删旧备份、重新 dry-run/apply |
| header JSON 溢出拒绝 | 新 minified header 超过 `jsonSize` 的空格余量；缩减 `payload.mjs` 或改用新归档 |
| 辉光管/灯不亮、变量全失效 | `--ks-*` 自定义属性必须声明在 `body` 上（ThemePresenter 把 `--dsw-*` 写成 body 内联样式），详见 `README.md` §5 |
| 壁纸看不见 | 必须挂在 `div.MnhYfG_frame`（AppFrame），挂 `body` 会被不透明底盖住；会话链路几层底色要清透明 |
| 改了文件但运行窗口没变 | 打包 profile 的 client bundle 不参与 HMR（`watching []`）；用 plugin_manager 关一次再开，或重启 |
| 启动屏出现两块板/闪一下 | 宿主注入重复建了 `#ks-loadscreen`；契约是 `KS_SPLASH.adopt()` 接管同一元素 |
| 探针没数据 | `tools/boot-probe-server.mjs` 没起；没起也不影响启动（本地 `localStorage["ks-boot-tl"]` 兜底） |
| 无头/自动化环境报错 | 不改前台焦点；浏览器验证走 headless CDP，桌面操作走后台通道（见 `AGENTS.md`） |

---

## G. 文件地图（只列本流程用到的）

```
kurisu-skin/
├── build.ps1 / install.ps1 / uninstall.ps1   # A 段
├── cordis.patch.yml / package.json
├── src/client.template.js / host.template.js / sg-nixie.inline.js   # 构建输入
├── lib/client.js / index.js                  # 构建产物（A 安装 / payload 提取）
├── assets/wall-*.webp / nixie-one-* / nixie-v4/
├── research/patch-asar-splash.mjs           # B 段 CLI（--dry-run/--apply/--verify/--restore）
├── research/native-splash/
│   ├── payload.mjs / fixture-test.mjs / verify-applied-payload.mjs
│   ├── web-document.orig.js / header.orig.json / backup-manifest.json   # 原始备份
│   └── README.md                            # 头部手术的全部字节级事实
├── tools/boot-probe-server.mjs              # C 段诊断
├── BACKUP.md                               # 备份与恢复
└── README.md                               # 1380 行工程志（设计、类名、验证记录）
```
