# Steins;Gate 辉光管（Divergence Meter）主题设计素材包

> 用途：主题开发前的设计素材收集与实现参考。
> ⚠️ 版权提醒：Steins;Gate 的图像、Logo、设定素材版权归 MAGES.（5pb.）/ Nitroplus 所有。
> 若主题要**公开发布**，视觉素材需自行绘制或用开源替代品。
> 下文标注了各资源的开源协议，优先使用 MIT / OFL 资源。

---

## 1. 视觉参考（仅作设计参考）

| 资源 | 链接 | 说明 |
|---|---|---|
| Steins;Gate 日本官网 | https://steinsgate.jp/ | 官方视觉、配色基调 |
| Divergence Meter 设定（Fandom Wiki） | https://steins-gate.fandom.com/wiki/Divergence_Meter | 8 管布局、小数点在第 2 位后、显示形如 `1.048596` |
| Pixiv 标签「ダイバージェンスメーター」 | https://www.pixiv.net/tags/ダイバージェンスメーター | 同人风格参考（版权属各作者） |

**外观要点（来自设定与复刻社区共识）：**
- 8 支辉光管一字排开，第 1 位整数 + 小数点 + 6 位小数
- 管身为竖直玻璃圆筒，内部数字灯丝层叠（10 层阴极），点亮时呈琥珀橙辉光
- 底座为深色金属/电木质感，管间有细小铆钉
- 整体氛围：深色背景 + 暖橙主光源 + 暗部带一点青蓝环境反光

---

## 2. 配色方案（源自 owenisas / glowbox，线性空间 → sRGB）

| 用途 | 色值 | 说明 |
|---|---|---|
| 白热灯丝核心 | `#FFD7A0` | 点亮的数字最亮部分 |
| 橙气体辉光 | `#FF6A00` | 辉光鞘层（stroke 2.9） |
| 远场晕 | `#FF3D00` | 大气散射橙红 |
| 暗导线（熄灭） | `#5E5A52` | 镍合金色，Opacity 0.3 |
| 烟熏玻璃管体 | `#121310` | 接近黑色的微棕色 |
| Lab 夜色底 | `#0E0F0D` | 深背景 |
| 点缀青（S;G UI） | `#3ED9C5` | PhoneWave 终端青，少量使用 |

---

## 3. 字体

| 字体 | 协议 | 链接 | 用途 |
|---|---|---|---|
| **Nixie One** | SIL OFL | https://fonts.google.com/specimen/Nixie+One | 字体 fallback（v4 已改用单笔画 SVG，此字体仅作备份） |
| Share Tech Mono | SIL OFL | https://fonts.google.com/specimen/Share+Tech+Mono | UI 文案等宽字体 |
| Noto Sans SC | SIL OFL | https://fonts.google.com/noto | 中文正文 |

> v4 已完全使用单笔画 SVG 数字字形，**不依赖任何字体**渲染数字。

---

## 4. 开源实现参考（已核对协议）

### 4.1 可直接复用 / 参考源码（MIT 许可）

| 仓库 | 技术栈 | 可移植内容 |
|---|---|---|
| [owenisas/steins-gate-world-line](https://github.com/owenisas/steins-gate-world-line) | HTML + SVG + Three.js + GSAP | **🌟 DOM 五层架构**（详见第 5 节）、单笔画 SVG 字形（nixie.svg）、物理动画时序（meter.js DESIGN.md section 6）、电流声 hum 动画（7-12s 周期每管独立）、点火序列（1.8s）、故障态 `?.??????` 闪烁停格 |
| [eetu/glowbox](https://github.com/eetu/glowbox) — nixie 包 | Canvas 2D + TypeScript | 单笔画 Path2D 渲染、视深偏移公式、3 种管型（classic/slim/tall）、确定性磨损/闪烁曲线（wear.ts）、颜色系统（parseColor）、蜂窝阳极纹理生成 |
| [eetu/glowbox](https://github.com/eetu/glowbox) — neon 包 | Canvas 2D + TypeScript | 7 种气体预设（neon/argon/helium/co2/green/gold/rose）、击穿序列（电弧→部分点火→过冲白热→稳定）、极性反转吸墨模式 |
| [cerealkiller57540/nixie-clock-card](https://github.com/cerealkiller57540/nixie-clock-card) | Lit + CSS/Canvas | Home Assistant 卡片，IN-14 型管写实渲染，青色底光，气体粒子发光效果 |

### 4.2 设计思路参考（无明确协议，仅观其法）

| 仓库 | 价值 |
|---|---|
| [alya-can-eat/divergence-meter](https://github.com/alya-can-eat/divergence-meter) | Python 复刻，物理接线图可借鉴 |
| [zayennn/tube-clock](https://github.com/zayennn/tube-clock) | 纯 HTML/CSS/JS 辉光管时钟，glow 动画完整 |
| [AmperiaWang/Nixie-Clock](https://github.com/AmperiaWang/Nixie-Clock) | 中文作者的 HTML+CSS 辉光钟，注释友好 |
| [longsongline/Steins-Gate-Divergence-Meter-Clock-VisitorCounter](https://github.com/longsongline/Steins-Gate-Divergence-Meter-Clock-VisitorCounter) | 分歧计样式网页时钟/访客计数器 |
| [q61org/divergence_meter](https://github.com/q61org/divergence_meter) | KiCad 硬件复刻，外观结构最还原 |
| [waicool20/Divergence-Meter-Project](https://github.com/waicool20/Divergence-Meter-Project) | 硬件结构/尺寸参考 |
| [kmakise/DivergenceMeter](https://github.com/kmakise/DivergenceMeter) | 国产硬件复刻，附 B 站演示视频 |

---

## 5. 极致写实 CSS 实现要点（v4 基于 owenisas meter.css）

### 五层叠加架构（每管）
```
z-index: 1  .nx__stack     — 暗色阴极导线堆 + 管内气体底光
z-index: 2  .nx__lit       — 点亮层：外层辉光鞘 + 内层白热核（双层 <use>）
z-index: 3  .nx__front     — 点亮位前方导线（mix-blend-mode: multiply）
::before    — 蜂窝阳极网（alpha texture，multiply 混合，圆柱面淡出）
::after     — 前玻璃（掠射高光条 + 穹顶受光 + 边缘自色）
```

### 双层描边（真实阴极是细金属丝，非填充字形）
```css
.nx__sheath { color: #FF6A00; stroke-width: 2.9; }  /* 气体辉光层 */
.nx__core   { color: #FFD7A0; stroke-width: 1.15; } /* 白热核心 */
```

### 前后阴极消隐算法（关键）
```js
// STACK = '1234567890'（前→后物理顺序）
const LAYER = { '1':0,'7':1,'4':2,'2':3,'5':4,'3':5,'9':6,'6':7,'0':8,'8':9 };
// 点亮字符 X 时：
//   栈（前面挡住光）：LAYER[ch] <= LAYER[X] 才隐藏
//   前（被光遮住）：LAYER[ch] >= LAYER[X] 才隐藏
```

### 物理动画时序
```js
TIMING = {
  stepMs:   { min: 45, max: 70 },   // 随机步进
  firstLock: 340,                    // 首管锁定 ms
  lockGap:  { min: 40, max: 90 },    // 后续管间隔
  pulseMs:  120,                     // 过亮脉冲 ms
  ignite:   560                      // 点火序列首管锁定 ms
};
// 电流声：每管独立周期 7-12s，~40ms 褐化 dip（opacity 降至 0.62）
// 故障态：循环 ?.?????? 闪烁 4s，停格 -.-
```

### 玻璃管物理细节
```css
/* 管体背景 = 管座圈 + 圆柱明暗 + 吸气剂闪斑 + 底色 */
background:
  linear-gradient(to top, #0a0a09 0%, #171814 5.5%, #22221e 7.4%,
    #3a3933 8.1%, #121311 8.7%, transparent 9.4%),  /* 管座圈 */
  linear-gradient(90deg, rgb(0 0 0 / .55) 0%, ...),   /* 圆柱明暗 */
  radial-gradient(46% 11% at 50% 3%, ...),            /* 吸气剂闪斑 */
  var(--nx-c-body);
/* ::after 前玻璃 */
background:
  linear-gradient(90deg, ... 12%, ... 16.5% ...),      /* 掠射高光条 */
  radial-gradient(26% 6% at 34% 5%, ...),              /* 穹顶受光 */
  box-shadow: inset 0 0 0 1px rgb(216 224 230 / .06), /* 边缘自色 */
```

### 蜂窝阳极网
```css
/* data URI 六边形网格 + 圆柱面淡出 mask */
background-image: url("data:image/svg+xml,...");
mask-image:
  linear-gradient(90deg, transparent 0%, #000 22%, #000 78%, transparent 100%),
  linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
```

---

## 6. 同主题生态参考

- [RansomDark/steinsgrub-theme](https://github.com/RansomDark/steinsgrub-theme) — GRUB2 的 S;G 主题
- [MrYland3r/Cosmic-Looper-nightTab](https://github.com/MrYland3r/Cosmic-Looper-nightTab) — S;G Elite 风格浏览器主页主题
- [chrontax/divergence](https://github.com/chrontax/divergence) — LeftWM 的 S;G 主题

---

## 7. 本素材包交付物

```
steins-gate-nixie-assets/
├── sg-nixie.js          ← ✅ Web Component 组件本体（零依赖，交接核心）
├── sg-nixie-demo.html   ← 组件用法 demo（属性驱动 / clock / JS API / 事件日志）
├── HANDOFF.md           ← 给后续皮肤开发 agent 的交接文档（API / 换肤变量 / 架构 / 桌面端注意）
├── nixie-demo-v4.html   ← v4 独立版（非组件，含完整控件，用于对比/提取样式）
├── nixie-demo-v3.html   ← v3 版：三层分离 + 单笔画 SVG + 磨损/闪烁
├── nixie-demo-v2.html   ← v2 版：三层分离，字体版
├── nixie-demo.html      ← v1 版（辉光被遮挡，保留作版本对比）
├── nixie-tokens.css        ← 设计变量（含 glowbox 气体预设）
└── README.md            ← 完整素材包文档
```

**交接结论**：目标平台是桌面应用（Electron / Tauri / WebView2 / CEF 均基于 Chromium），
Web Component 是唯一零依赖、任何 HTML 渲染环境都能直接用的形式，
且 Shadow DOM 自动隔离样式——皮肤方的 CSS 不会破坏组件，组件也不会污染皮肤。
换肤只需覆盖 `:host` 上的 `--nx-*` CSS 变量，详见 HANDOFF.md 第 3 节。
