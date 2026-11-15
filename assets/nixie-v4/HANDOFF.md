# sg-nixie 交接文档（给后续开发皮肤的 agent）

> 组件文件：`steins-gate-nixie-assets/sg-nixie.js`（零依赖，单文件，Web Component）
> 在线 demo：`sg-nixie-demo.html`（本地起 HTTP 服务后访问）
> 设计来源与写实技法：见同目录 `README.md` 第 5 节

## 1. 一句话接入

```html
<script src="./sg-nixie.js"></script>
<sg-nixie value="1.048596"></sg-nixie>          <!-- 分歧计模式 -->
<sg-nixie mode="clock"></sg-nixie>              <!-- 时钟模式 -->
```

任何能渲染 HTML 的环境都能用（Electron / Tauri / WebView2 / CEF / 浏览器）。

## 2. API 面

| 类型 | 名称 | 说明 |
|---|---|---|
| 属性 | `value` | `"X.XXXXXX"` 分歧计读数，属性驱动滚动动画 |
| 属性 | `mode` | `"meter"`（默认）\| `"clock"` |
| 方法 | `shiftTo(v)` | 滚动切换到 v |
| 方法 | `ignite(v)` | 点火序列：全暗 → 依次点亮锁定 |
| 方法 | `fail()` | 故障态：`?.??????` 循环 4s → 停格 `-.-` |
| 方法 | `reread()` | 同值重读（点击仪表等效） |
| 事件 | `meter:shift` / `meter:lock` / `meter:locked` / `meter:fail` | 均带 `detail`，`bubbles + composed`（穿透 Shadow DOM） |
| CSS Part | `panel` | 底板，`sg-nixie::part(panel)` 可换肤 |

## 3. 换肤入口（皮肤 agent 重点）

组件所有可定制颜色都在 `:host` 的 CSS 变量里，覆盖即换肤：

```css
sg-nixie {
  --nx-core:   #FFD7A0;   /* 白热灯丝 */
  --nx-glow:   #FF6A00;   /* 气体辉光 */
  --nx-halo:   #FF3D00;   /* 远场晕 */
  --nx-wire:   #5E5A52;   /* 暗导线 */
  --nx-c-body: #121310;   /* 烟熏玻璃 */
  /* 几何 */
  --nx-gr: .16;           /* 管间隙系数 */
  --nx-span: min(900px, 86vw, calc(100vw - 32px));
  /* 笔画宽度（字形单位 60×100） */
  --nx-sw-sheath: 2.9; --nx-sw-core: 1.15; --nx-sw-wire: 1;
  /* 辉光半径（随管宽缩放） */
  --nx-g1: calc(var(--nx-tw) * .010);
  --nx-g2: calc(var(--nx-tw) * .040);
  --nx-g3: calc(var(--nx-tw) * .110);
  /* 管外光晕强度（0~1，越大越糊越亮） */
  --nx-halo-alpha: .30;
}
```

- 想改**气体颜色**（橙→青/绿/蓝）：同时改 `--nx-glow`（鞘）与 `--nx-core`（核），参照 glowbox `gas.ts` 的 7 组 GasSpec（neon/argon/helium/co2/green/gold/rose）
- 想改**管型**（classic/slim/tall）：调字形 `transform: scale()` 与 `--nx-sw-*` 比例
- 想改**动画节奏**：组件内 `TIMING` 常量（stepMs 45–70 / firstLock 340 / lockGap 40–90 / pulseMs 120 / ignite 560）
- `prefers-reduced-motion: reduce` 自动降级为瞬切，无障碍可用

## 4. 架构（写实原理，改造前必读）

每管六层（z0→z5）：
0. `.nx__halo` — 管外光雾（`--nx-halo-alpha` 控强度，screen 混合，只在点亮时显形）
1. `.nx__stack` — 10 层暗阴极导线 + 管内气体底光（radial-gradient）
2. `.nx__lit` — 点亮层，`<use class="nx__sheath">`（厚 stroke 橙）+ `<use class="nx__core">`（细 stroke 白热）双描边叠加 + 5 层 drop-shadow 远场 bloom
3. `.nx__front` — 点亮位前方导线，`mix-blend-mode: multiply` 只在跨光处显形
4. `::before` — 蜂窝阳极网（data-URI 六边形 + multiply + 圆柱面 mask 淡出）
5. `::after` — 前玻璃（掠射高光条 + 穹顶受光 + 边缘自色）

消隐算法：`LAYER = {'1':0,'7':1,'4':2,'2':3,'5':4,'3':5,'9':6,'6':7,'0':8,'8':9}`（前→后物理顺序）。
点亮 X 时：stack 隐藏 `LAYER[ch] <= LAYER[X]`，front 隐藏 `LAYER[ch] >= LAYER[X]`。

字形源自 owenisas/steins-gate-world-line 的 `nixie.svg`（MIT），已内联进组件，无外部请求。

## 5. 桌面端注意

- **file:// 协议**：精灵表在 Shadow DOM 内，`<use href="#nx-0">` 是同文档引用，file:// 下可用（与外部 SVG 文件引用不同）
- **字体**：UI 文案 fallback 到系统等宽字体即可；数字是 SVG 字形，不依赖任何字体
- **离线**：组件零网络依赖（demo 页的 Google Fonts 仅用于 UI 文案，可删）
- **性能**：drop-shadow filter × 3 / 管，共 24 个 filter 上下文；低端机器如掉帧，把 `--nx-g3` 半径调小或只留两层
- **CSP**：组件无 inline script / eval，data-URI 仅 mesh 背景图，若 CSP 严格需放行 `data:` for `img-src`/`style-src`

## 6. 文件清单

```
sg-nixie.js            ← 组件本体（交接核心）
sg-nixie-demo.html     ← 用法 demo（属性驱动 / clock / JS API / 事件日志）
nixie-demo-v4.html     ← v4 独立版（非组件，含完整控件，用于对比/提取样式）
nixie-tokens.css      ← 设计变量
README.md              ← 素材包总览（含开源资源清单与协议）
```
