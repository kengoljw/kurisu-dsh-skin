# BACKUP.md — 完整包备份与恢复文档

> 对象：`kurisu-skin/`（牧濑红莉栖 DSH 皮肤，**完整版**，含 asar 原生启动屏补丁链路）。
> 本文回答三件事：包里有什么、哪些必须备份、怎么备份与恢复。
> 「怎么把皮肤+asar 补丁应用到机器上」见同目录 [APPLY.md](<APPLY.md>)。

---

## 0. 当前状态快照（2026-11-15 备份时实测）

| 项 | 值 |
| --- | --- |
| 包版本 | `1.12.7`（`package.json`） |
| 构建时间 | `build-info.json` → `2026-11-14T23:36:19+08:00` |
| lib/client.js | 1,141,561 字节（build-info 记录 1,142,447，差 886 字节 —— 见 §6 注意） |
| lib/index.js | 1,121,420 字节 |
| asar 补丁（v2 头部手术） | **在位**：`--verify` 全 PASS；`verify-applied-payload.mjs` → `BYTE-IDENTICAL: true` |
| app.asar | 182,034,851 字节（原始 180,923,876，delta 1,110,975）；entry offset `175621688`，size `1110975`，`LOADING_STYLE` 1,100,333 字节 |
| git 状态 | 整个 `kurisu-skin/` **未跟踪**（`??`），且被根 `.gitignore` 的 `lib/`、`*.png` 规则影响 |

---

## 1. 目录清单（实测）

总量 **9,239 个路径 / 265,421,312 字节（≈253 MB）**；不含 `preview/` 则为 **≈22.5 MB**。

| 目录/文件 | 文件数 | 字节 | 备份等级 | 说明 |
| --- | ---: | ---: | --- | --- |
| `src/` | 4 | 260,238 | **必须** | 全部源码：`client.template.js`、`host.template.js`、`sg-nixie.inline.js`、`client.template.js.bak`（旧版备份）。lib 与 asar payload 都从这里构建，丢了等于丢一切 |
| `lib/` | 2 | 2,262,981 | **必须** | 构建产物（可由 src 重建，但直接备份可免一次构建）；`client.js` 内联全部壁纸 |
| `assets/` | 21 | 5,012,768 | **必须** | 4 张壁纸 WebP + 4 缩略图 + `nixie-one-latin.woff2` + `nixie-one-OFL.txt` + 2 张接触表 + `nixie-v4/` 组件出处（9 文件，含原始 `sg-nixie.js`） |
| `research/native-splash/` | 7 | ≈5.34 MB | **必须** | asar 手术的核心：`patch CLI`（`research/patch-asar-splash.mjs`）、`payload.mjs`、`fixture-test.mjs`、`verify-applied-payload.mjs`、**三份原始备份**（`web-document.orig.js` 8,457 B、`header.orig.json` 5,302,170 B、`backup-manifest.json`）、`README.md` |
| `research/`（其余） | 342 | ≈10.6 MB | 建议 | `ui-theme-contract.md`、`client-dom-contract.md`（契约文档）、`frontend-css/`（shipped CSS 参照）、`asar-extract/`（asar 参照抽取）、`scratch/`（一次性脚本）、`patch-asar-splash.mjs`（补丁 CLI 本体） |
| 顶层 7 文件 | 7 | 86,846 | **必须** | `package.json`、`cordis.patch.yml`、`build.ps1`、`install.ps1`、`uninstall.ps1`、`README.md`（1380 行工程志）、`build-info.json` |
| `tools/boot-probe-server.mjs` | 1 | 3,558 | 建议 | 启动探针收集器（127.0.0.1:8791 → `preview/boot-probe.jsonl`） |
| `preview/` | 8,855 | 241,821,779 | 可选 | 截图/录屏抽帧/验证产物（`video-analysis-2x` 5,326 帧、`video-verify-*` 等）。**全部可由源码+流程再生**，是体积大头；快照备份可跳过，另存少量代表图即可（`preview-dark.png`、`preview-light.png`、`v111-native-splash.jpg`、`splash-themed.png`） |

---

## 2. 必须备份的 7 类东西（最小集）

1. `src/` 全部 —— 唯一源码。
2. `lib/` 两个 bundle —— 当前可运行形态。
3. `assets/` 全部 —— 壁纸与 OFL 字体（`nixie-one-OFL.txt` 必须随字体一起分发）。
4. `research/patch-asar-splash.mjs` + `research/native-splash/` 全部 —— 没有这三份原始备份就无法把 asar 还原/重打。
5. 顶层 7 文件。
6. `tools/boot-probe-server.mjs`。
7. 本文档与 [APPLY.md](<APPLY.md>) —— 新机器上照着做就能复现。

最小集约 **7.7 MB**；含 research 约 **23 MB**。

---

## 3. 一键备份

```powershell
# 完整备份（含 preview，≈253 MB）
powershell -NoProfile -ExecutionPolicy Bypass -File backup-package.ps1

# 精简备份（跳过 preview/，≈23 MB）
powershell -NoProfile -ExecutionPolicy Bypass -File backup-package.ps1 -Slim

# 自定义输出目录 / 不打包 zip 只留目录
powershell -NoProfile -ExecutionPolicy Bypass -File backup-package.ps1 -Dest D:\backup -NoZip
```

脚本行为：复制到 `kurisu-skin-backup\kurisu-skin-backup-<时间戳>\` → 写 `MANIFEST.txt`
（文件数/字节数核对 + 关键文件 SHA-256 + asar 当前事实）→ `Compress-Archive` 打成同名 zip。
`-Slim` 只多带 `preview/` 里的 4 张代表图。

---

## 4. 恢复到一台新机器

1. 解包 zip 到任意工作区（保持 `kurisu-skin/` 目录名）。
2. 确认前提（DSH Desktop NEXT 0.2.1-rc.2 / app 2.0.19-next；node 路径）。
3. 跑 [APPLY.md](<APPLY.md>) 的 §A（构建+安装皮肤）与 §B（asar 补丁）。
4. `--verify` + `verify-applied-payload.mjs` 应全 PASS；数值若与本文件 §0 不一致，
   以 `--dry-run` 输出为准（payload 体积随模板变动属正常）。

---

## 5. git / 仓库入库

- 父仓库根 `.gitignore` 全局忽略 `lib/`、`*.png`、`*.jpg` 等，会吞掉 bundle 与截图。
- `kurisu-skin/` 当前完全未跟踪。若要入库：仿照 `kurisu-skin-publish/.gitignore` 的做法，
  在本目录放一份带 `!lib/`、`!assets/**`、`!*.png` 例外规则的嵌套 `.gitignore`，
  并 `git add -f`。`preview/` 建议整目录忽略（242 MB 不适合进 git）。

---

## 6. 注意事项 / 已知偏差

- `build-info.json` 记录的 `bundleBytes=1,142,447` 与当前 `lib/client.js`（1,141,561）差 886 字节：
  说明构建后 `src/` 或产物又有过改动而未重跑 `build.ps1`。要完全可复现，恢复后重跑一次
  `build.ps1`，以新 `build-info.json` 为准。
- `research/native-splash/backup-manifest.json` 的 `applied` 块记录的是**旧一次** apply
  （size 277,606）；当前真实在位的是 size 1,110,975（1.12.7 的 5-beat 序列）。
  **`originalLength` / `oldEntry` / 三份原始备份仍然有效** —— `--restore` 靠的就是它们。
  判断当前状态永远以 `--verify` 与 `verify-applied-payload.mjs` 的输出为准。
- asar 补丁与宿主版本绑定：DSH 升级覆盖 `app.asar` 后补丁即消失，按 [APPLY.md](<APPLY.md>) §D 重打。
- 探针 `KS_PROBE` 会 POST `127.0.0.1:8791`；收集器没开也不影响启动（写本地 `localStorage` 兜底）。

---

## 7. 关键文件校验和

`backup-package.ps1` 会在每次备份时把下列文件的 SHA-256 写进 `MANIFEST.txt`（实际值以最新一份为准）：
`src/client.template.js`、`src/host.template.js`、`src/sg-nixie.inline.js`、`lib/client.js`、
`lib/index.js`、`package.json`、`cordis.patch.yml`、`research/patch-asar-splash.mjs`、
`research/native-splash/payload.mjs`、`research/native-splash/fixture-test.mjs`、
`research/native-splash/web-document.orig.js`、`research/native-splash/header.orig.json`。
