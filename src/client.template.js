window.__ModuleLoader__.load({
	id: "dsh-skin-kurisu",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		const React = require("react");

		const SG_NIXIE_JS = __SG_NIXIE_JS__;
		const SKIN_ID = "dsh-skin-kurisu";
		const STORAGE_KEY = "dsh-skin-kurisu:wallpaper";
		const POLISH_KEY = "dsh-skin-kurisu:polish";
		const GLASS_KEY = "dsh-skin-kurisu:glass";
		const WALLPAPERS = {
			night: {
				label: "夜行列车",
				hint: "深夜巴士 · 雨与霓虹",
				dark: "{{WALL_NIGHT}}",
				light: "{{WALL_DAY}}",
				thumb: "{{THUMB_NIGHT}}",
				pos: "76% 42%"
			},
			day: {
				label: "白昼窗边",
				hint: "Dr Pepper · 午后阳光",
				dark: "{{WALL_DAY}}",
				light: "{{WALL_DAY}}",
				thumb: "{{THUMB_DAY}}",
				pos: "72% 38%"
			},
			dusk: {
				label: "薄暮荒原",
				hint: "灰色天光 · 雨后街道",
				dark: "{{WALL_DUSK}}",
				light: "{{WALL_DUSK}}",
				thumb: "{{THUMB_DUSK}}",
				pos: "70% 44%"
			},
			library: {
				label: "星夜图书馆",
				hint: "暖光书架 · 助手与真由理",
				dark: "{{WALL_LIBRARY}}",
				light: "{{WALL_LIBRARY}}",
				thumb: "{{THUMB_LIBRARY}}",
				pos: "62% 42%"
			}
		};
		const ORDER = ["night", "day", "dusk", "library"];
		const DEFAULT_WALLPAPER = "night";

		// ---------------------------------------------------------------- palette
		// Amadeus / Kurisu: deep night blue, warm lab-coat white, tie crimson,
		// CRT teal as the secondary "business" accent.
		const TOKENS = {
			"--dsw-alias-bg-base": { light: "rgba(250,246,241,0.40)", dark: "rgba(7,10,18,0.46)" },
			"--dsw-alias-bg-layer-1": { light: "rgba(255,252,248,0.56)", dark: "rgba(14,19,30,0.50)" },
			"--dsw-alias-bg-layer-2": { light: "rgba(255,253,250,0.64)", dark: "rgba(19,25,38,0.58)" },
			"--dsw-alias-bg-layer-3": { light: "rgba(252,248,243,0.70)", dark: "rgba(24,31,48,0.64)" },
			"--dsw-alias-bg-overlay": { light: "rgba(255,253,250,0.97)", dark: "rgba(13,17,27,0.95)" },
			"--dsw-alias-bg-module-platform": { light: "rgba(248,242,236,0.62)", dark: "rgba(16,21,33,0.56)" },
			"--dsw-alias-bg-multi-select": { light: "rgba(246,239,233,0.66)", dark: "rgba(25,32,49,0.62)" },
			"--dsw-alias-bg-document-preview": { light: "rgba(252,248,243,0.70)", dark: "rgba(12,16,26,0.58)" },
			"--dsw-alias-bg-document-selection": {
				light: "color-mix(in srgb, #a63b48 22%, transparent)",
				dark: "color-mix(in srgb, #d5838f 30%, transparent)"
			},
			"--dsw-alias-bg-mask-1": { light: "rgba(30,22,24,0.30)", dark: "rgba(2,4,9,0.58)" },
			"--dsw-alias-bg-mask-2": { light: "rgba(30,22,24,0.16)", dark: "rgba(2,4,9,0.38)" },
			"--dsw-alias-bg-mask-3": { light: "rgba(30,22,24,0.50)", dark: "rgba(2,4,9,0.72)" },
			"--dsw-alias-bg-mask-drop": { light: "rgba(255,252,248,0.72)", dark: "rgba(10,14,23,0.76)" },
			"--dsw-alias-bg-mask-photo": { light: "rgba(16,12,14,0.82)", dark: "rgba(2,4,9,0.90)" },
			"--dsw-alias-bg-skeleton": { light: "rgba(120,80,80,0.08)", dark: "rgba(255,255,255,0.06)" },
			"--dsw-alias-border-l1": { light: "rgba(94,54,58,0.12)", dark: "rgba(150,178,212,0.13)" },
			"--dsw-alias-border-l2": { light: "rgba(94,54,58,0.22)", dark: "rgba(156,184,218,0.22)" },
			"--dsw-alias-border-l2-darkmode-thin": { light: "rgba(94,54,58,0.16)", dark: "rgba(156,184,218,0.16)" },
			"--dsw-alias-border-l3": { light: "rgba(94,54,58,0.32)", dark: "rgba(160,190,225,0.32)" },
			"--dsw-alias-border-l4": { light: "rgba(94,54,58,0.42)", dark: "rgba(170,200,235,0.42)" },
			"--dsw-alias-border-inverted": { light: "rgba(255,255,255,0.50)", dark: "rgba(255,255,255,0.10)" },
			"--dsw-alias-border-inverted2": { light: "rgba(255,255,255,0.60)", dark: "rgba(255,255,255,0.16)" },
			"--dsw-alias-brand-primary": { light: "#9c3140", dark: "#e0919c" },
			"--dsw-alias-brand-primary-invert": { light: "#f7eff0", dark: "#7c2635" },
			"--dsw-alias-brand-primary-new-colorprimary-new-color": { light: "#a63b48", dark: "#d67c8a" },
			"--dsw-alias-brand-text": { light: "#9c3140", dark: "#f6ecee" },
			"--dsw-alias-label-primary": { light: "#2b2023", dark: "#f3ede9" },
			"--dsw-alias-label-secondary": { light: "#4b4044", dark: "#ccd4e0" },
			"--dsw-alias-label-tertiary": { light: "#635559", dark: "#a9b5c6" },
		"--dsw-alias-label-caption": { light: "#6b5c60", dark: "#b3bdcc" },
		"--dsw-alias-label-dimmed": { light: "#584c50", dark: "#bfc8d6" },
		"--dsw-alias-label-primary-dimmed": { light: "#554a4d", dark: "#c6ceda" },
			"--dsw-alias-label-caption": { light: "#8b7c7f", dark: "#8792a5" },
			"--dsw-alias-label-dimmed": { light: "#c9bdbd", dark: "#4f5a6d" },
			"--dsw-alias-label-primary-dimmed": { light: "#3a2c2f", dark: "#d9d2cd" },
			"--dsw-alias-label-primary-bluish": { light: "#243a55", dark: "#e2ebf7" },
			"--dsw-alias-label-primary-foreground": { light: "#fdfaf7", dark: "#0a0d15" },
			"--dsw-alias-label-primary-inverted": { light: "#fdfaf7", dark: "#1a2234" },
			"--dsw-alias-label-shimmer": {
				light: "color-mix(in srgb, #2b2023 26%, transparent)",
				dark: "color-mix(in srgb, #f3ede9 38%, transparent)"
			},
			"--dsw-alias-label-document-preview": { light: "#6b5b5e", dark: "#b8c2d2" },
			"--dsw-alias-label-deep-diving": {
				light: "color-mix(in srgb, #9c3140 72%, #2b2023)",
				dark: "#d8a3ad"
			},
			"--dsw-alias-label-deep-diving-shimmer": {
				light: "color-mix(in srgb, #b95b67 55%, #ffffff)",
				dark: "#e7c0c7"
			},
			"--dsw-alias-link": { light: "#9c3140", dark: "#e5a2ad" },
			"--dsw-alias-menu-icon": { light: "#443537", dark: "#d7dee9" },
			"--dsw-menu-surface-fill": { light: "rgba(255,252,248,0.90)", dark: "rgba(17,22,34,0.90)" },
			"--dsw-alias-menu-group-header-fill": { light: "rgba(252,247,242,0.96)", dark: "rgba(14,18,29,0.94)" },
			"--dsw-specific-menu": { light: "rgba(255,252,248,0.94)", dark: "rgba(17,22,34,0.94)" },
			"--dsw-specific-sidebar-fill": { light: "rgba(246,240,234,0.50)", dark: "rgba(8,11,19,0.44)" },
			"--dsw-specific-sidebar-nav-item-active": { light: "rgba(156,49,64,0.12)", dark: "rgba(224,145,156,0.16)" },
			"--dsw-specific-sidebar-nav-item-active-accent": { light: "rgba(156,49,64,0.18)", dark: "rgba(224,145,156,0.24)" },
			"--dsw-specific-sidebar-nav-item-hover": { light: "rgba(94,54,58,0.08)", dark: "rgba(150,178,212,0.10)" },
			"--dsw-specific-selector": { light: "rgba(250,244,238,0.88)", dark: "rgba(24,31,48,0.86)" },
			"--dsw-specific-tip": { light: "rgba(246,239,233,0.86)", dark: "rgba(20,26,40,0.82)" },
			"--dsw-specific-input-major": { light: "rgba(255,252,248,0.60)", dark: "rgba(12,17,27,0.54)" },
			"--dsw-specific-login-input": { light: "rgba(255,252,248,0.90)", dark: "rgba(12,17,27,0.78)" },
			"--dsw-specific-bubble": { light: "rgba(255,238,236,0.62)", dark: "rgba(44,36,50,0.58)" },
			"--dsw-specific-bubble-highlight": { light: "rgba(239,208,208,0.66)", dark: "rgba(214,124,138,0.24)" },
			"--dsw-alias-interactive-bg-hover": { light: "rgba(94,54,58,0.06)", dark: "rgba(255,255,255,0.06)" },
			"--dsw-alias-interactive-bg-active": { light: "rgba(94,54,58,0.10)", dark: "rgba(255,255,255,0.10)" },
			"--dsw-alias-interactive-bg-hover-solid": { light: "rgba(250,244,238,0.90)", dark: "rgba(30,38,56,0.90)" },
			"--dsw-alias-interactive-bg-hover-accent": { light: "rgba(156,49,64,0.10)", dark: "rgba(214,124,138,0.16)" },
			"--dsw-alias-interactive-bg-hover-danger": { light: "rgba(236,19,19,0.08)", dark: "rgba(242,90,90,0.16)" },
			"--dsw-alias-button-primary-fill": { light: "#9c3140", dark: "#c85e6d" },
			"--dsw-alias-button-primary-hover": { light: "#b03c4c", dark: "#d97c89" },
			"--dsw-alias-button-primary-dimmed": { light: "rgba(156,49,64,0.40)", dark: "rgba(200,94,109,0.38)" },
			"--dsw-alias-button-contrast-fill": { light: "#2b2023", dark: "#f0e9e6" },
			"--dsw-alias-button-elevated-fill": { light: "rgba(255,252,248,0.94)", dark: "rgba(28,35,52,0.92)" },
			"--dsw-alias-button-floating-fill": { light: "rgba(255,252,248,0.92)", dark: "rgba(22,28,43,0.92)" },
			"--dsw-alias-button-floating-hover": { light: "rgba(248,240,234,0.96)", dark: "rgba(32,40,58,0.96)" },
			"--dsw-alias-button-ghost-active-border": { light: "rgba(156,49,64,0.45)", dark: "rgba(224,145,156,0.45)" },
			"--dsw-alias-button-ghost-active-fill": { light: "rgba(156,49,64,0.10)", dark: "rgba(224,145,156,0.12)" },
			"--dsw-alias-button-ghost-active-hover": { light: "rgba(156,49,64,0.16)", dark: "rgba(224,145,156,0.18)" },
			"--dsw-alias-button-info-fill": { light: "#2f8f7c", dark: "#5fb7a6" },
			"--dsw-alias-button-info-hover": { light: "#37a48f", dark: "#75c9b8" },
			"--dsw-alias-button-tool-bar-fill": { light: "rgba(94,54,58,0.40)", dark: "rgba(20,26,40,0.55)" },
			"--dsw-alias-button-tool-bar-hover": { light: "rgba(94,54,58,0.55)", dark: "rgba(26,33,50,0.72)" },
			"--dsw-alias-button-tool-bar-fill-invisible": { light: "rgba(94,54,58,0.25)", dark: "rgba(14,19,30,0.35)" },
			"--dsw-alias-state-business-primary": { light: "#2f8f7c", dark: "#6fc7b5" },
			"--dsw-alias-state-business-tertiary": { light: "rgba(47,143,124,0.14)", dark: "rgba(111,199,181,0.16)" },
			"--dsw-alias-state-error-primary": { light: "#c62f3c", dark: "#f27a86" },
			"--dsw-alias-state-error-secondary": { light: "#d95a65", dark: "#f6a0a8" },
			"--dsw-alias-state-success-primary": { light: "#2f9e6f", dark: "#5cc9a7" },
			"--dsw-alias-state-success-secondary": { light: "#48b585", dark: "#79d6b6" },
			"--dsw-alias-state-success-tertiary": { light: "rgba(47,158,111,0.12)", dark: "rgba(92,201,167,0.16)" },
			"--dsw-alias-state-warn-primary": { light: "#b7791f", dark: "#e6b163" },
			"--dsw-alias-state-warn-secondary": { light: "#c98a2e", dark: "#eec27f" },
			"--dsw-alias-state-warn-tertiary": { light: "rgba(183,121,31,0.12)", dark: "rgba(230,177,99,0.16)" },
			"--dsw-alias-state-warn-label": { light: "#a46a18", dark: "#e6b163" },
			"--dsw-alias-state-idle-primary": { light: "#c3b6b6", dark: "#5f6b80" },
			"--dsw-alias-switch-thumb": { light: "#ffffff", dark: "#e9dfdc" },
			"--dsw-alias-toast-bg": { light: "rgba(43,32,35,0.94)", dark: "rgba(24,31,47,0.96)" },
			"--dsw-alias-toast-label": { light: "#fdfaf7", dark: "#f3ede9" },
			"--dsw-alias-tooltip-bg": { light: "rgba(43,32,35,0.94)", dark: "rgba(14,19,30,0.96)" },
			"--dsw-alias-tooltip-key-bg": { light: "rgba(255,255,255,0.14)", dark: "rgba(255,255,255,0.12)" },
			"--dsw-alias-turn-trigger-bg": { light: "rgba(250,244,238,0.85)", dark: "rgba(18,24,37,0.82)" },
			"--dsw-alias-turn-trigger-bg-hover": { light: "rgba(246,237,231,0.90)", dark: "rgba(26,33,50,0.88)" },
			"--dsw-alias-scrollbar-bg-l1": { light: "rgba(94,54,58,0.18)", dark: "rgba(150,178,212,0.22)" },
			"--dsw-alias-scrollbar-bg-l2": { light: "rgba(94,54,58,0.24)", dark: "rgba(150,178,212,0.28)" },
			"--dsw-alias-scrollbar-hover-l1": { light: "rgba(94,54,58,0.34)", dark: "rgba(180,205,235,0.38)" },
			"--dsw-alias-scrollbar-hover-l2": { light: "rgba(94,54,58,0.40)", dark: "rgba(180,205,235,0.46)" },
			"--dsw-alias-markdown-code-block": { light: "rgba(246,240,234,0.54)", dark: "rgba(10,14,24,0.48)" },
			"--dsw-alias-markdown-code-block-banner": { light: "rgba(240,232,226,0.60)", dark: "rgba(14,19,30,0.56)" },
			"--dsw-alias-markdown-code-segment-selected": { light: "rgba(255,252,248,0.72)", dark: "rgba(28,36,54,0.66)" },
			"--dsw-alias-markdown-code-segment-unselected": { light: "rgba(242,234,228,0.58)", dark: "rgba(12,17,27,0.52)" },
			"--dsw-alias-markdown-inline-code": { light: "rgba(156,49,64,0.08)", dark: "rgba(255,255,255,0.07)" },
			"--dsw-alias-markdown-citation": { light: "rgba(240,232,226,0.94)", dark: "rgba(24,31,47,0.86)" },
			"--dsw-alias-markdown-placeholder": { light: "rgba(94,54,58,0.05)", dark: "rgba(255,255,255,0.05)" },
			"--dsw-alias-markdown-tag": { light: "rgba(94,54,58,0.07)", dark: "rgba(255,255,255,0.08)" },
			"--dsw-alias-file-diff-added-bg": { light: "#e8f4ec", dark: "#1c2b25" },
			"--dsw-alias-file-diff-added-gutter": { light: "#eff8f2", dark: "#16241d" },
			"--dsw-alias-file-diff-added-marker": { light: "#2f9e6f", dark: "#41c977" },
			"--dsw-alias-file-diff-deleted-bg": { light: "#fbeae6", dark: "#31201d" },
			"--dsw-alias-file-diff-deleted-gutter": { light: "#fdf1ee", dark: "#251614" },
			"--dsw-alias-file-diff-deleted-marker": { light: "#c62f3c", dark: "#fa6a64" },
			"--dsw-alias-code-diff-added": { light: "rgba(47,158,111,0.08)", dark: "rgba(65,201,119,0.12)" },
			"--dsw-alias-code-diff-deleted": { light: "rgba(198,47,60,0.08)", dark: "rgba(250,66,62,0.12)" },
			"--dsw-alias-settings-card-fill": { light: "rgba(255,252,248,0.86)", dark: "rgba(20,26,40,0.82)" },
			"--dsw-alias-settings-card-stroke": { light: "rgba(94,54,58,0.18)", dark: "rgba(150,178,212,0.18)" },
			"--dsw-alias-onboarding-accent": { light: "#9c3140", dark: "#e0919c" },
			"--dsw-alias-onboarding-card-fill": { light: "rgba(255,252,248,0.86)", dark: "rgba(22,28,43,0.84)" },
			"--dsw-alias-onboarding-secondary-fill": { light: "rgba(250,244,238,0.92)", dark: "rgba(30,38,56,0.9)" },
			"--dsw-alias-onboarding-checkbox-border": { light: "rgba(43,32,35,0.22)", dark: "rgba(180,205,235,0.28)" },
			"--dsw-menu-backdrop-filter": { light: "blur(30px) saturate(150%)", dark: "blur(30px) saturate(135%)" },
			"--dsw-mask-blur": { light: "blur(10px)", dark: "blur(10px)" },
			"--dsw-shadow-lv1": { light: "0 2px 6px 0 rgba(60,30,34,0.10)", dark: "0 2px 8px 0 rgba(0,0,0,0.45)" },
			"--dsw-shadow-lv2": {
				light: "0 6px 18px 0 rgba(60,30,34,0.10), 0 2px 8px 0 rgba(60,30,34,0.06)",
				dark: "0 6px 18px 0 rgba(0,0,0,0.50), 0 2px 8px 0 rgba(0,0,0,0.32)"
			},
			"--dsw-shadow-lv3": {
				light: "0 0 1px 0 rgba(60,30,34,0.24), 0 16px 40px 0 rgba(60,30,34,0.16)",
				dark: "0 0 1px 0 rgba(0,0,0,0.70), 0 18px 46px 0 rgba(0,0,0,0.55)"
			},
			"--dsw-elevation-stroke-color": { light: "rgba(94,54,58,0.20)", dark: "rgba(150,178,212,0.20)" }
		};

		const flatten = (scheme) => {
			const out = {};
			for (const name of Object.keys(TOKENS)) out[name] = TOKENS[name][scheme];
			return out;
		};

		// ---------------------------------------------------------------- css
		const CSS = `
/* ===== dsh-skin-kurisu ===== */
html { background-color: #06080f; }
body:not([data-ds-dark-theme]) { background-color: #f1eae2; }
body[data-ds-dark-theme] { background-color: #06080f; }

/* The wallpaper layers are generated into a second, plugin-owned <style>
   (see buildWallCss) because each theme image is inline base64. Keeping the
   URL out of inherited custom properties avoids handing a ~500 KB string to
   every element in the tree. */

/* keep translucent chrome legible over the art */
html[data-ks-wall="on"] ::selection {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent);
}

/* settings row */
.ks-row { display: flex; flex-direction: column; gap: 10px; width: 100%; min-width: 0; }
.ks-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
.ks-title { font-size: 13px; line-height: 20px; font-weight: 600; color: var(--dsw-alias-label-primary); white-space: nowrap; }
.ks-sub { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ks-thumbs { display: flex; gap: 8px; flex-wrap: wrap; }
.ks-thumb {
  position: relative;
  width: 104px;
  height: 60px;
  padding: 0;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 10px;
  overflow: hidden;
  background-color: var(--dsw-alias-bg-layer-2);
  background-size: cover;
  background-position: center;
  cursor: pointer;
  font: inherit;
  transition: border-color 140ms var(--ds-ease-in-out, ease), box-shadow 140ms var(--ds-ease-in-out, ease), transform 140ms var(--ds-ease-in-out, ease);
}
.ks-thumb:hover { border-color: var(--dsw-alias-border-l4); transform: translateY(-1px); }
.ks-thumb:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
.ks-thumb[data-active="true"] {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent);
}
.ks-thumb > span {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  padding: 8px 7px 4px;
  font-size: 10px;
  line-height: 14px;
  color: #fff;
  text-align: left;
  text-shadow: 0 1px 2px rgba(0,0,0,.6);
  background: linear-gradient(transparent, rgba(0,0,0,.74));
}
.ks-none {
  display: flex; align-items: center; justify-content: center;
  background-image: none;
  background:
    repeating-linear-gradient(135deg, transparent 0 6px, color-mix(in srgb, var(--dsw-alias-label-tertiary) 14%, transparent) 6px 7px),
    var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
}
.ks-none > span { position: static; background: none; text-shadow: none; color: var(--dsw-alias-label-secondary); padding: 0; }
.ks-hint { font-size: 11px; line-height: 16px; color: var(--dsw-alias-label-tertiary); margin: 0; }
.ks-glassRow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ks-glassLabel { font-size: 12px; color: var(--dsw-alias-label-secondary); }

@media (prefers-reduced-motion: reduce) {
  .ks-thumb { transition: none; }
}

/* -- glass: keep text legible while the panes turn translucent ------------- */
/* The four big surfaces (sidebar, panel layers, composer, code blocks) were
   made substantially more transparent in the token layer. A backdrop blur puts
   the wallpaper detail out of focus behind them, so contrast survives without
   adding more fill. Only active while a wallpaper is on — with no wallpaper
   there is nothing to blur and this would just cost compositing. */
html[data-ks-wall="on"] div.MnhYfG_sidebarCol,
html[data-ks-wall="on"] #root > div > div.MnhYfG_sidebarCol {
  -webkit-backdrop-filter: blur(26px) saturate(118%);
  backdrop-filter: blur(26px) saturate(118%);
}
html[data-ks-wall="on"] div.VERcba_card {
  -webkit-backdrop-filter: blur(20px) saturate(115%);
  backdrop-filter: blur(20px) saturate(115%);
}
/* markdown code block shell (the shipped rule paints
   --dsw-alias-markdown-code-block on the pre/container) */
html[data-ks-wall="on"] div.MnhYfG_frame pre,
html[data-ks-wall="on"] div.MnhYfG_frame div[class*="codeBlock"],
html[data-ks-wall="on"] div.MnhYfG_frame div[class*="markdownCode"] {
  -webkit-backdrop-filter: blur(14px) saturate(112%);
  backdrop-filter: blur(14px) saturate(112%);
}
/* user message bubbles (the assistant side has no bubble wrapper) */
html[data-ks-wall="on"] div.MnhYfG_frame div[class*="bubble"] {
  -webkit-backdrop-filter: blur(12px) saturate(112%);
  backdrop-filter: blur(12px) saturate(112%);
}
@media (prefers-reduced-transparency: reduce) {
  html[data-ks-wall="on"] div.MnhYfG_sidebarCol,
  html[data-ks-wall="on"] div.VERcba_card,
  html[data-ks-wall="on"] div.MnhYfG_frame pre,
  html[data-ks-wall="on"] div.MnhYfG_frame div[class*="bubble"] {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

/* -- glass levels --------------------------------------------------------- */
/* The four big surfaces — left nav, panel layers, composer, code blocks —
   each paint a token that the theme presenter writes inline on <body>. A
   stylesheet declaration carrying !important outranks that inline style, so a
   level can switch at runtime without tearing down the token layer.
   "mid" needs no block: it is exactly what the base tokens already say. */
html[data-ks-glass="solid"] body {
  --dsw-specific-sidebar-fill: rgba(246,240,234,.86) !important;
  --dsw-alias-bg-layer-1: rgba(255,252,248,.86) !important;
  --dsw-alias-bg-layer-2: rgba(255,253,250,.90) !important;
  --dsw-specific-input-major: rgba(255,252,248,.88) !important;
  --dsw-alias-markdown-code-block: rgba(246,240,234,.92) !important;
  --dsw-alias-markdown-code-block-banner: rgba(240,232,226,.95) !important;
  --dsw-specific-bubble: rgba(255,238,236,.88) !important;
  --ks-scrim-light: rgba(250,246,241,.42) !important;
  --ks-scrim: rgba(7,10,18,.56) !important;
}
html[data-ks-glass="solid"] body[data-ds-dark-theme] {
  --dsw-specific-sidebar-fill: rgba(8,11,19,.86) !important;
  --dsw-alias-bg-layer-1: rgba(14,19,30,.84) !important;
  --dsw-alias-bg-layer-2: rgba(19,25,38,.90) !important;
  --dsw-specific-input-major: rgba(12,17,27,.86) !important;
  --dsw-alias-markdown-code-block: rgba(10,14,24,.88) !important;
  --dsw-alias-markdown-code-block-banner: rgba(14,19,30,.92) !important;
  --dsw-specific-bubble: rgba(44,36,50,.86) !important;
}
html[data-ks-glass="clear"] body {
  --dsw-specific-sidebar-fill: rgba(246,240,234,.28) !important;
  --dsw-alias-bg-layer-1: rgba(255,252,248,.34) !important;
  --dsw-alias-bg-layer-2: rgba(255,253,250,.42) !important;
  --dsw-specific-input-major: rgba(255,252,248,.38) !important;
  --dsw-alias-markdown-code-block: rgba(246,240,234,.32) !important;
  --dsw-alias-markdown-code-block-banner: rgba(240,232,226,.40) !important;
  --dsw-specific-bubble: rgba(255,238,236,.40) !important;
  --ks-scrim-light: rgba(250,246,241,.08) !important;
  --ks-scrim: rgba(7,10,18,.22) !important;
}
html[data-ks-glass="clear"] body[data-ds-dark-theme] {
  --dsw-specific-sidebar-fill: rgba(8,11,19,.26) !important;
  --dsw-alias-bg-layer-1: rgba(14,19,30,.30) !important;
  --dsw-alias-bg-layer-2: rgba(19,25,38,.38) !important;
  --dsw-specific-input-major: rgba(12,17,27,.34) !important;
  --dsw-alias-markdown-code-block: rgba(10,14,24,.28) !important;
  --dsw-alias-markdown-code-block-banner: rgba(14,19,30,.36) !important;
  --dsw-specific-bubble: rgba(44,36,50,.34) !important;
}

.ks-seg { display: inline-flex; align-items: center; gap: 2px; padding: 2px; border-radius: 8px;
  background: color-mix(in srgb, var(--dsw-alias-label-primary) 8%, transparent); }
.ks-seg > button {
  appearance: none; border: 0; cursor: pointer; padding: 3px 10px; border-radius: 6px;
  font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary);
  background: transparent; transition: background .16s ease, color .16s ease;
}
.ks-seg > button[data-on="true"] {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}
.ks-seg > button:hover { color: var(--dsw-alias-label-primary); }

/* ===== nixie tubes (v4) ================================================== */
/* Tube rendering is the v4 Web Component from steins-gate-nixie-assets
   (src/sg-nixie.inline.js): five stacked layers, single-stroke SVG cathode
   glyphs, front/back occlusion, current hum and physical ignition timing, all
   inside its own Shadow DOM. This block only sizes and frames it through the
   component's public CSS custom properties and its exposed ::part(panel). */

.ks-nixie-row {
  position: relative;
  display: inline-flex;
  align-items: flex-end;
  gap: 1px;
  padding: 4px 6px 3px;
  border-radius: 5px;
  background: linear-gradient(180deg, #2a323d 0%, #1c222b 55%, #12161c 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.10),
    inset 0 -2px 5px rgba(0,0,0,.62),
    0 6px 16px -8px rgba(0,0,0,.85),
    0 0 22px -10px rgba(255,122,0,.55);
  cursor: pointer;
  font: inherit;
  border: 1px solid rgba(255,255,255,.06);
  animation: ks-meter-glow 3.4s ease-in-out infinite;
}
.ks-nixie-row::before,
.ks-nixie-row::after {
  content: "";
  position: absolute;
  top: 3px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #4a545f, #14181d 70%);
  box-shadow: inset 0 -1px 1px rgba(0,0,0,.8);
  pointer-events: none;
}
.ks-nixie-row::before { left: 3px; }
.ks-nixie-row::after { right: 3px; }
.ks-nixie-row:hover { border-color: rgba(255,160,40,.45); }
.ks-nixie-row:focus-visible { outline: 2px solid var(--ds-focus-ring-color, #e0919c); outline-offset: 2px; }
@keyframes ks-meter-glow {
  0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 -2px 5px rgba(0,0,0,.62), 0 6px 16px -8px rgba(0,0,0,.85), 0 0 22px -10px rgba(255,122,0,.45); }
  50%      { box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 -2px 5px rgba(0,0,0,.62), 0 6px 16px -8px rgba(0,0,0,.85), 0 0 26px -8px rgba(255,122,0,.75); }
}

/* Compact sidebar meter: 8 tubes (1 + dot + 6 decimals) packed into the footer
   slot. The component's own panel is a full lab instrument, so strip its
   padding, rivets and plate. */
.ks-nixie-row sg-nixie { --nx-span: 150px; --nx-gr: .13; }
.ks-nixie-row sg-nixie::part(panel) {
  padding: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  cursor: pointer;
}
.ks-nixie-row sg-nixie::part(panel)::before,
.ks-nixie-row sg-nixie::part(panel)::after { display: none; }

/* Boot hand-off: the reading that converged on the full-screen splash "lands"
   in the sidebar. Same 8 tubes, same 1.130205, one amber ignition pulse. The
   class is added by armSplashHandoff() when the overlay starts dissolving and
   removed 1.5s later so the ambient ks-meter-glow resumes. */
.ks-nixie-row.ks-meter-arrive { animation: ks-meter-arrive 1.4s cubic-bezier(.2,.7,.2,1) both; }
@keyframes ks-meter-arrive {
  0%   { filter: brightness(.32) saturate(.45); transform: translateY(-5px) scale(.985);
         box-shadow: 0 0 0 0 rgba(255,122,0,0); }
  36%  { filter: brightness(1.85) saturate(1.3); transform: none;
         box-shadow: 0 0 26px 2px rgba(255,150,60,.55), 0 0 72px 10px rgba(255,104,20,.28); }
  100% { filter: none; transform: none;
         box-shadow: inset 0 1px 0 rgba(255,255,255,.10), inset 0 -2px 5px rgba(0,0,0,.62),
                     0 6px 16px -8px rgba(0,0,0,.85), 0 0 22px -10px rgba(255,122,0,.45); }
}

/* Full-size boards: boot screen, splash takeover, host load screen. */
.ks-splash-row sg-nixie,
.ks-boot-board sg-nixie,
#ks-loadscreen .ks-load-row sg-nixie { --nx-span: min(560px, 78vw); --nx-gr: .12; }
.ks-boot-row sg-nixie { --nx-span: min(720px, 86vw); --nx-gr: .12; }
.ks-splash-row sg-nixie::part(panel),
.ks-boot-row sg-nixie::part(panel),
#ks-loadscreen .ks-load-row sg-nixie::part(panel) {
  padding: 12px 16px 8px;
  border-radius: 10px;
}

/* ===== product splash (the very first screen, pre-plugins) =============== */
/* The web shell builds this before any plugin runs: [data-dsh-boot] root,
   [data-dsh-boot-spinner] ring, and a --dsh-boot-arc custom property carrying
   real load progress. Restyling it makes the skin start at first paint instead
   of only after the app mounts. */
[data-dsh-boot] {
  background:
    radial-gradient(130% 96% at 50% 42%, #101728 0%, #080b14 52%, #03050a 100%) !important;
}
[data-dsh-boot] [class*="_card"] { gap: 13px !important; }
[data-ks-boot="true"] [class*="_card"] { gap: 13px !important; }
.ks-boot-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}
.ks-boot-brand svg.ks-mark {
  width: 18px;
  height: 18px;
  flex: none;
}
[data-ks-boot="true"] [class*="_wordmark"] {
  color: #ffd0a4 !important;
  font-family: "Cascadia Code", Consolas, monospace !important;
  letter-spacing: .34em !important;
  font-size: 13px !important;
  text-shadow: 0 0 10px rgba(255,150,60,.55), 0 0 26px rgba(255,104,20,.32);
}
[data-ks-boot="true"] [class*="_hint"] {
  color: rgba(255,178,113,.62) !important;
  letter-spacing: .16em;
  font-family: "Cascadia Code", Consolas, monospace !important;
  font-size: 10px !important;
}
[data-ks-boot="true"] [data-dsh-boot-spinner] { display: none !important; }
/* ===== themed load screen (our own layer, above the shell splash) ======== */
/* The shell's splash card is only hidden; the board itself is a separate
   fixed layer appended to <body>, so React clearing #root cannot take it. */
.ks-splash {
  position: fixed;
  inset: 0;
  z-index: 2147483500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  background: radial-gradient(130% 96% at 50% 42%, #101728 0%, #080b14 52%, #03050a 100%);
  font-family: "Cascadia Code", Consolas, monospace;
  opacity: 1;
  transition: opacity .4s ease;
  pointer-events: none;
}
.ks-splash[data-out="true"] { opacity: 0; }
.ks-splash-brand {
  display: flex;
  align-items: center;
  gap: 9px;
}
.ks-splash-brand svg.ks-mark {
  width: 18px;
  height: 18px;
  flex: none;
}
.ks-splash-word {
  color: #ffd0a4;
  font-size: 13px;
  letter-spacing: .34em;
  text-shadow: 0 0 10px rgba(255, 150, 60, .55), 0 0 26px rgba(255, 104, 20, .32);
}
.ks-splash-cap {
  font-size: 9px;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(255, 178, 113, .42);
}
.ks-splash-row {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}
.ks-splash-val {
  font-size: 11px;
  letter-spacing: .18em;
  color: rgba(255, 178, 113, .74);
}
.ks-splash-bar {
  width: min(360px, 56vw);
  height: 2px;
  background: rgba(255, 178, 113, .14);
  overflow: hidden;
}
.ks-splash-bar > i {
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #ff5f12, #ffc27f);
  box-shadow: 0 0 12px rgba(255, 116, 30, .9);
}
.ks-splash-hint {
  font-size: 9px;
  letter-spacing: .18em;
  color: rgba(255, 178, 113, .3);
}
/* the shell's own card goes invisible while our board owns the screen */
[data-ks-boot="true"] [class*="_card"] { visibility: hidden !important; }
.ks-boot-cap2 {
  font-size: 9px;
  letter-spacing: .3em;
  text-transform: uppercase;
  color: rgba(255,178,113,.42);
  font-family: "Cascadia Code", Consolas, monospace;
  margin-top: 2px;
}
.ks-boot-board {
  display: flex;
  align-items: flex-end;
  gap: 5px;
}
/* ===== boot screen ======================================================= */
.ks-boot {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background:
    radial-gradient(130% 92% at 50% 42%, #0b0f17 0%, #06080d 58%, #020305 100%);
  font-family: "Cascadia Code", Consolas, monospace;
  color: #ffb271;
  opacity: 1;
  transition: opacity .55s ease;
}
.ks-boot[data-out="true"] { opacity: 0; pointer-events: none; }
.ks-boot-row { display: flex; align-items: flex-end; gap: 8px; }
.ks-boot-cap {
  font-size: 10px;
  letter-spacing: .34em;
  text-transform: uppercase;
  color: rgba(255,178,113,.5);
}
.ks-boot-val {
  font-size: 13px;
  letter-spacing: .22em;
  color: rgba(255,178,113,.86);
  min-height: 18px;
}
.ks-boot-bar {
  width: min(440px, 62vw);
  height: 2px;
  background: rgba(255,178,113,.14);
  overflow: hidden;
}
.ks-boot-bar > i {
  display: block;
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg, #ff5f12, #ffc27f);
  box-shadow: 0 0 12px rgba(255,116,30,.9);
}
.ks-boot-hint {
  font-size: 10px;
  letter-spacing: .18em;
  color: rgba(255,178,113,.32);
}

/* ===== brand row / collapse toggle clearance ============================= */
/* ===== v1.7 polish ======================================================= */

/* 1) Sidebar collapse toggle: pin it to the window's top-left row.
   Shipped it is position:fixed; left:12px; top:centered in the whole title
   band, and that band is taller than one row on Windows, so the button ended
   up floating between the menu row and the logo row. Anchoring it to the top
   of the band puts it in the corner and lets the logo row sit at the normal
   left inset again. */
/* The collapse toggle must share the first window row with 应用 / 编辑.
   It cannot be moved with CSS: MnhYfG_sidebarCol carries backdrop-filter, which
   makes it the containing block for position:fixed (measured from y=40), and
   both it and logoRow clip with overflow:hidden. So the real button stays in
   React's tree (hidden), and a mirror is mounted on document.body where fixed
   resolves against the viewport. */
[data-ks-wall="on"] [class*="_toggle"].ks-toggle-source {
  visibility: hidden !important;
}
.ks-toggle-mirror {
  position: fixed !important;
  top: 6px !important;
  left: 12px !important;
  width: 28px !important;
  height: 28px !important;
  z-index: 2147483000 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-secondary, #6b5c60);
  cursor: pointer;
  -webkit-app-region: no-drag;
}
.ks-toggle-mirror:hover { background: var(--dsw-alias-interactive-bg-hover, rgba(90, 60, 50, .1)); }
.ks-toggle-mirror svg { width: 16px; height: 16px; }

/* The sidebar collapse toggle: ship position, untouched.
   Two attempts to move it are reverted on purpose:
     - top:5px  -> landed at y=45, because its fixed containing block is the
                   second content row, not the viewport
     - top:-35px -> clipped away by that row, the button disappeared entirely
   The user asked for "its original position", so the shipped rule stays. */

/* 2) File-edit dock card + scroll-to-bottom button: let the wallpaper through.
   The card paints itself from --dsw-specific-menu, the round button from
   --dsw-alias-button-floating-fill; both are scoped here so no other menu or
   floating button changes. */
/* The changed-files card is a CSS-module class ending in _card; its visible
   surface is the header, which paints from --changes-fill. Both are softened
   here, scoped to that card only (the code-block card ends in a line hash and
   is not matched by [class$="_card"]). */
/* File / deliverable attachment card. Its fill comes from --deliverable-fill
   (dsw-static-neutral-50: near-opaque white) while every other surface in this skin
   is glass, so that card reads as a solid block. Repoint the variable to the same
   glass formula the rest of the skin uses; the hover fill follows it. */
[data-ks-wall="on"] [class$="_file"] {
  --deliverable-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 52%, transparent);
  --deliverable-hover: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 66%, transparent);
  backdrop-filter: blur(14px) saturate(1.06);
}

[data-ks-wall="on"] [class$="_card"] {
  --changes-fill: transparent;
  --changes-hover: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 42%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 52%, transparent) !important;
  backdrop-filter: blur(16px) saturate(1.06);
}
[data-ks-wall="on"] [class*="_toBottom"] {
  --dsw-alias-button-floating-fill: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 56%, transparent);
  --dsw-alias-button-floating-hover: color-mix(in srgb, var(--dsw-alias-bg-layer-2, #fff) 72%, transparent);
  --dsw-elevation-panel: 0 2px 10px -4px rgba(0, 0, 0, .45);
  backdrop-filter: blur(12px) saturate(1.05);
}

/* ds-bot paints its own blue from --bt-accent / --bt-ink-deepseek (#4d6bfe),
   which is why no filter on a class ever matched: the colour is a variable, not
   a class. Re-point the bot's palette at the Amadeus one so its chip, panel and
   agent rows all join the skin instead of sitting on it. */
html[data-ks-wall="on"] body {
  --bt-accent: #ffa028 !important;
  --bt-ink-deepseek: #ff8a1f !important;
  --bt-green: #41c7b9 !important;
  --bt-danger: #e5484d !important;
}
/* The bot chip in the sidebar footer keeps the stock DeepSeek-blue whale and no
   class hook identifies it, so the plugin tags the chip at runtime (tagBotChip)
   and this rule tints exactly that element. */
/* The bot avatar is ds-bot's own stable .bt-mark span, and its whale is
   filled by an SVG gradient (url(#bt-mark-N)), so it follows neither the theme
   tokens nor --bt-accent. A filter is the only handle that works on a gradient
   fill; applied to the mark span so every bot avatar joins the palette. */
[data-ks-wall="on"] .bt-mark,
[data-ks-wall="on"] .bt-mark svg {
  filter: grayscale(.55) sepia(.5) saturate(2.1) hue-rotate(-14deg) brightness(1.04);
}

[data-ks-wall="on"] .ks-bot-chip,
[data-ks-wall="on"] .ks-bot-chip svg,
[data-ks-wall="on"] .ks-bot-chip img {
  filter: grayscale(.6) sepia(.5) saturate(2) hue-rotate(-12deg) brightness(1.03);
}

/* 3) Agent-team / bot glyph (blue + orange + cyan quadrants, shipped with fixed
   hex fills) warmed into the Amadeus palette. Matched by the icon's own exact
   path fills so no unrelated icon is touched. */
[data-ks-wall="on"] svg:has(> path[fill="#F2AF63"]),
[data-ks-wall="on"] svg:has(> path[fill="#7CB7FF"]) {
  filter: grayscale(.7) sepia(.55) saturate(2.1) hue-rotate(-12deg) brightness(1.03)
    drop-shadow(0 1px 2px rgba(120, 60, 30, .18));
}

/* Agent rows carry data-agent-id on the row itself, which is a stable semantic
   hook (the avatar classes are plugin-local). Tint only the glyph inside those
   rows: the stock blue bot avatar joins the Amadeus palette without touching any
   other icon. */
[data-ks-wall="on"] [data-agent-id] svg,
[data-ks-wall="on"] [data-agent-id] img {
  filter: grayscale(.55) sepia(.45) saturate(1.9) hue-rotate(-10deg) brightness(1.04)
    drop-shadow(0 1px 2px rgba(120, 60, 30, .18));
}
div[class*="_brandMark"] {
  flex: none;
}
div[class*="_brandMark"] > svg.ks-mark {
  width: 20px;
  height: 20px;
  max-width: 20px;
  max-height: 20px;
}
/* the rail (collapsed) variant is a 40px square; keep the badge centred there */
html[data-sidebar-collapsed="true"] div[class*="_brandMark"] > svg.ks-mark {
  width: 22px;
  height: 22px;
  max-width: 22px;
  max-height: 22px;
}

`;

		// ---------------------------------------------------------------- polish
		// Icons, buttons, focus rings, scrollbars and Amadeus-flavoured motion.
		// Everything here is additive: no shipped selector is replaced, so the
		// skin cannot break layout if a hashed class name changes between builds.
		const POLISH_CSS = `
/* ===== dsh-skin-kurisu / icon + motion polish ===== */

/* Amadeus CRT palette, exposed as helpers for the rules below.
   IMPORTANT: these must be declared on <body>, not <html>. The theme presenter
   writes the --dsw-* tokens inline on document.body, and a custom property
   resolves var() on the element it is DECLARED on. Declaring this block on html
   made every var(--dsw-*) lookup miss (they live one level down on body), so
   --ks-teal / --ks-glow computed to the guaranteed-invalid value and every rule
   using them silently produced nothing — the meter LED stayed transparent and
   the glow shadows never rendered. Fallbacks keep it usable even before the
   theme layer lands. */
body {
  --ks-rose: color-mix(in srgb, var(--dsw-alias-brand-primary, #9c3140) 88%, white);
  --ks-teal: var(--dsw-alias-state-business-primary, #2f8f7c);
  --ks-glow: color-mix(in srgb, var(--dsw-alias-brand-primary, #9c3140) 42%, transparent);
  --ks-glow-soft: color-mix(in srgb, var(--dsw-alias-brand-primary, #9c3140) 18%, transparent);
  --ks-ease: var(--ds-ease-in-out, cubic-bezier(.4,0,.2,1));
  --ks-fast: var(--ds-transition-duration-fast, 120ms);
  --ks-med: var(--ds-transition-duration, 200ms);
  --ks-slow: var(--ds-transition-duration-slow, 320ms);
}

/* -- icons ---------------------------------------------------------------- */
/* Verified from shipped source (dsh-client-ui-primitives/lib/index.js:75-98):
   DSH icons are NOT lucide-react. They are first-party inline SVG artwork with
   width/height = size, viewBox "0 0 16 16", fill="none", aria-hidden="true",
   stroke="currentColor" (FishLogo and the send arrow use fill="currentColor"),
   and NO per-icon data attribute and NO default class. So the only reliable
   handle is the parent control + "> svg".
   Scope is limited to the app frame's interactive chrome so SVGs inside chat
   content are never touched. */
html[data-ks-polish="on"] div.MnhYfG_frame :where(button, [role="button"], a, [tabindex]) > svg,
html[data-ks-polish="on"] div.MnhYfG_frame span[class*="iconButton"] > svg,
html[data-ks-polish="on"] div.MnhYfG_frame span[class*="panelIcon"] > svg {
  transition: filter var(--ks-med) var(--ks-ease), transform var(--ks-med) var(--ks-ease);
}
html[data-ks-polish="on"] div.MnhYfG_frame :where(button, [role="button"], a):hover > svg,
html[data-ks-polish="on"] div.MnhYfG_frame :where(button, [role="button"], a):focus-visible > svg {
  filter: drop-shadow(0 0 5px var(--ks-glow));
  transform: scale(1.07);
}
/* icons in selected / active rows get a rose wash */
html[data-ks-polish="on"] div.MnhYfG_frame :where([data-active="true"], [aria-current="page"], [aria-selected="true"], [data-selected="true"]) > svg {
  color: var(--ks-rose);
  filter: drop-shadow(0 0 4px var(--ks-glow-soft));
}

/* -- buttons -------------------------------------------------------------- */
html[data-ks-polish="on"] div.MnhYfG_frame :where(button, [role="button"]) {
  transition:
    transform var(--ks-fast) var(--ks-ease),
    box-shadow var(--ks-med) var(--ks-ease),
    border-color var(--ks-med) var(--ks-ease),
    background-color var(--ks-med) var(--ks-ease),
    color var(--ks-med) var(--ks-ease);
}
html[data-ks-polish="on"] div.MnhYfG_frame :where(button, [role="button"]):hover:not(:disabled):not([aria-disabled="true"]) {
  box-shadow: 0 0 0 1px var(--ks-glow-soft), 0 4px 14px -6px var(--ks-glow);
}
html[data-ks-polish="on"] div.MnhYfG_frame :where(button, [role="button"]):active:not(:disabled):not([aria-disabled="true"]) {
  transform: scale(.965);
}

/* primary / CTA surfaces: a restrained rose→plum gradient + breathing ring.
   Verified shipped selector: button.VERcba_primary (34x34 round send/stop,
   background: var(--dsw-alias-button-info-fill)) — the info fill is what the
   stock UI paints the send key with, so this is where the Kurisu red lives. */
html[data-ks-polish="on"] button.VERcba_primary,
html[data-ks-polish="on"] :where(button, [role="button"])[data-variant="primary"]:not(:disabled),
html[data-ks-polish="on"] :where(button, [role="button"])[aria-label*="发送"]:not(:disabled) {
  background-image: linear-gradient(135deg,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 94%, white) 0%,
    var(--dsw-alias-brand-primary) 52%,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 72%, #2a1020) 100%) !important;
  background-color: var(--dsw-alias-brand-primary) !important;
  color: #fff;
  box-shadow: 0 4px 18px -8px var(--ks-glow), inset 0 1px 0 rgba(255,255,255,.22);
  transition: transform var(--ks-fast) var(--ks-ease), box-shadow var(--ks-med) var(--ks-ease), background-color var(--ks-med) var(--ks-ease);
}
html[data-ks-polish="on"] button.VERcba_primary:hover:not(:disabled),
html[data-ks-polish="on"] :where(button, [role="button"])[data-variant="primary"]:not(:disabled):hover {
  background-image: linear-gradient(135deg,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 88%, white) 0%,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 96%, white) 48%,
    var(--dsw-alias-brand-primary) 100%) !important;
  box-shadow: 0 6px 22px -8px var(--ks-glow), 0 0 0 3px var(--ks-glow-soft), inset 0 1px 0 rgba(255,255,255,.26);
}

/* the composer "+" round button */
html[data-ks-polish="on"] button.VERcba_add {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent);
  transition: transform var(--ks-fast) var(--ks-ease), box-shadow var(--ks-med) var(--ks-ease);
}
html[data-ks-polish="on"] button.VERcba_add:hover:not(:disabled) {
  box-shadow: 0 0 0 2px var(--ks-glow-soft), 0 0 16px -4px var(--ks-glow);
}

/* composer toolbar chips (primitives Pill) */
html[data-ks-polish="on"] div.VERcba_row [class*="pill"] {
  border: 1px solid transparent;
  transition: border-color var(--ks-med) var(--ks-ease), background-color var(--ks-med) var(--ks-ease), box-shadow var(--ks-med) var(--ks-ease);
}
html[data-ks-polish="on"] div.VERcba_row [class*="pill"]:hover {
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
  box-shadow: 0 0 12px -6px var(--ks-glow);
}

/* user bubble: a thin crimson edge instead of a flat panel */
html[data-ks-polish="on"] div[class*="bubble"] {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent);
}

/* -- focus ring ----------------------------------------------------------- */
/* Shipped convention: :focus-visible{outline:var(--dsw-focus-ring-width) solid
   var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
   outline-offset:-2px}. We keep the geometry and only recolor it crimson, so
   no layout shifts. */
html[data-ks-polish="on"] div.MnhYfG_frame :focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
html[data-ks-polish="on"] div.MnhYfG_frame :where(input, textarea, [contenteditable="true"]):focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--ks-glow), inset 0 0 0 1px var(--ks-glow-soft);
}

/* -- composer / cards: CRT sheen ------------------------------------------ */
/* Verified shipped selectors: .VERcba_card is the composer panel
   (dsh-client-ui-conversation.css:183) and .VERcba_row its toolbar row
   (:208). The sheen is a pseudo-element on the card, pointer-events off. */
html[data-ks-polish="on"] div.VERcba_card,
html[data-ks-polish="on"] :where([class*="composer"], [class*="inputBox"], [class*="chatInput"]) {
  position: relative;
  isolation: isolate;
}
html[data-ks-polish="on"] div.VERcba_card::after,
html[data-ks-polish="on"] :where([class*="composer"], [class*="inputBox"], [class*="chatInput"])::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(115deg, transparent 32%, var(--ks-glow-soft) 48%, transparent 64%);
  background-size: 260% 100%;
  background-repeat: no-repeat;
  opacity: 0;
  animation: ks-sheen 9s linear infinite;
}

/* -- scrollbar ------------------------------------------------------------ */
/* Shipped tokens: --dsw-alias-scrollbar-bg-l1/-l2 and
   --dsw-alias-scrollbar-hover-l1/-l2 (already overridden by this skin's token
   layer). The composer card reads --dsh-scrollbar-thumb instead, so both
   channels are themed. */
html[data-ks-polish="on"] ::-webkit-scrollbar { width: 10px; height: 10px; }
html[data-ks-polish="on"] ::-webkit-scrollbar-track { background: transparent; }
html[data-ks-polish="on"] ::-webkit-scrollbar-thumb {
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, var(--dsw-alias-scrollbar-bg-l1));
}
html[data-ks-polish="on"] ::-webkit-scrollbar-thumb:hover {
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 70%, transparent);
}
html[data-ks-polish="on"] div.VERcba_card {
  --dsh-scrollbar-thumb: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, var(--dsw-alias-scrollbar-bg-l2));
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}

/* -- code / quotes: lab terminal ------------------------------------------ */
html[data-ks-polish="on"] div.MnhYfG_frame :where(code, pre) {
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, "SF Mono", monospace;
}
html[data-ks-polish="on"] div.MnhYfG_frame :where(blockquote) {
  border-left: 2px solid var(--dsw-alias-brand-primary);
  background: var(--ks-glow-soft);
}

/* -- divergence meter widget (sidebar footer slot) ------------------------ */
.ks-meter {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 26px;
  padding: 0 10px 0 8px;
  border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--dsw-alias-bg-layer-2) 82%, transparent);
  color: var(--ks-rose);
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 11px;
  line-height: 1;
  letter-spacing: .06em;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  transition: border-color var(--ks-med) var(--ks-ease), box-shadow var(--ks-med) var(--ks-ease), transform var(--ks-fast) var(--ks-ease);
}
.ks-meter:hover {
  border-color: var(--dsw-alias-brand-primary);
  box-shadow: 0 0 14px -4px var(--ks-glow);
  transform: translateY(-1px);
}
.ks-meter:active { transform: translateY(0) scale(.97); }
.ks-meter .ks-led {
  width: 9px; height: 9px; flex: none;
  border-radius: 50%;
  background: var(--ks-teal);
  box-shadow: 0 0 10px var(--ks-teal), 0 0 22px -2px var(--ks-teal);
  animation: ks-led 2.6s ease-in-out infinite;
}
.ks-meter[data-flip="true"] .ks-led { background: var(--dsw-alias-state-warn-primary); box-shadow: 0 0 10px var(--dsw-alias-state-warn-primary), 0 0 22px -2px var(--dsw-alias-state-warn-primary); }
/* the meter itself is the "lamp": an ambient halo that breathes around the pill */
.ks-meter { animation: ks-meter-glow 3.4s ease-in-out infinite; }
@keyframes ks-meter-glow {
  0%, 100% { box-shadow: 0 0 10px -6px var(--ks-teal); }
  50% { box-shadow: 0 0 20px -4px var(--ks-teal); }
}
.ks-meter .ks-digits { animation: ks-digits 5.5s steps(1) infinite; }
.ks-meter[data-flip="true"] .ks-digits { animation: none; }
html[data-ks-polish="off"] .ks-meter { display: none; }

/* -- brand mark ------------------------------------------------------------ */
.ks-mark {
  display: block;
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--dsw-alias-brand-primary) 70%, transparent));
  animation: ks-mark-breathe 5.2s ease-in-out infinite;
}
html[data-ks-polish="off"] .ks-mark { filter: none; animation: none; }
@keyframes ks-mark-breathe {
  0%, 100% { filter: drop-shadow(0 0 5px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent)); }
  50% {
    filter: drop-shadow(0 0 18px color-mix(in srgb, var(--dsw-alias-brand-primary) 95%, transparent))
            drop-shadow(0 0 34px color-mix(in srgb, var(--dsw-alias-state-business-primary) 60%, transparent));
  }
}

/* -- live glow: always-on motion ----------------------------------------- */
/* Hover-only highlights are invisible until you point at them, which is why a
   "dynamic" skin can still look completely static. Everything below moves on
   its own. All of it stays gated by html[data-ks-polish="on"] and by
   prefers-reduced-motion. */

/* send key: a radar ping so the primary action reads as live */
html[data-ks-polish="on"] button.VERcba_primary {
  position: relative;
  animation: ks-ping 3.2s cubic-bezier(.22, .61, .36, 1) infinite;
}
@keyframes ks-ping {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--dsw-alias-brand-primary) 58%, transparent),
                inset 0 1px 0 rgba(255,255,255,.34);
  }
  60% {
    box-shadow: 0 0 0 16px transparent,
                inset 0 1px 0 rgba(255,255,255,.34);
  }
  100% {
    box-shadow: 0 0 0 0 transparent,
                inset 0 1px 0 rgba(255,255,255,.34);
  }
}

/* composer: a light running around the border (conic ring masked to 1px) */
@property --ks-ring {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}
html[data-ks-polish="on"] div.VERcba_card::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: 2;
  padding: 2px;
  border-radius: inherit;
  pointer-events: none;
  background: conic-gradient(from var(--ks-ring),
    transparent 0deg 185deg,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 78%, transparent) 248deg,
    color-mix(in srgb, var(--dsw-alias-state-business-primary) 60%, transparent) 300deg,
    transparent 352deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  opacity: .9;
  animation: ks-ring 7s linear infinite;
}
@keyframes ks-ring { to { --ks-ring: 360deg; } }
html[data-ks-polish="on"] div.VERcba_card:focus-within::before {
  opacity: 1;
  animation-duration: 2.4s;
}
html[data-ks-polish="on"] div.VERcba_card:focus-within {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 42%, transparent),
              0 0 26px -8px var(--ks-glow);
}

/* worldline meter: brighter LED plus a highlight crossing the digits */
.ks-meter::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(100deg, transparent 38%,
    color-mix(in srgb, var(--dsw-alias-state-business-primary) 42%, transparent) 50%,
    transparent 62%);
  background-size: 220% 100%;
  background-repeat: no-repeat;
  opacity: 0;
  animation: ks-meter-scan 4.8s linear infinite;
}
.ks-meter .ks-led,
.ks-meter .ks-digits { position: relative; z-index: 1; }
@keyframes ks-meter-scan {
  0% { background-position: 160% 0; opacity: 0; }
  12% { opacity: .9; }
  38% { background-position: -60% 0; opacity: 0; }
  100% { background-position: -60% 0; opacity: 0; }
}

/* -- settings toggle ------------------------------------------------------- */
.ks-toggle {
  display: inline-flex; align-items: center; gap: 8px;
  width: fit-content; padding: 6px 10px 6px 7px; margin-top: 2px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 11px; line-height: 16px;
  cursor: pointer;
}
.ks-toggle:hover { border-color: var(--dsw-alias-brand-primary); }
.ks-toggle-knob {
  position: relative; width: 26px; height: 14px; flex: none;
  border-radius: 999px; background: var(--dsw-alias-border-l4);
  transition: background-color var(--ks-med) var(--ks-ease);
}
.ks-toggle-knob::after {
  content: ""; position: absolute; top: 2px; left: 2px;
  width: 10px; height: 10px; border-radius: 50%;
  background: #fff;
  transition: transform var(--ks-med) var(--ks-ease);
}
.ks-toggle[data-on="true"] .ks-toggle-knob { background: var(--dsw-alias-brand-primary); }
.ks-toggle[data-on="true"] .ks-toggle-knob::after { transform: translateX(12px); }
.ks-toggle-state { color: var(--dsw-alias-label-tertiary); min-width: 12px; }

/* -- keyframes ------------------------------------------------------------ */
@keyframes ks-led {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: .3; transform: scale(.78); }
}
@keyframes ks-sheen {
  0% { background-position: 180% 0; opacity: 0; }
  6% { opacity: .9; }
  24% { background-position: -80% 0; opacity: 0; }
  100% { background-position: -80% 0; opacity: 0; }
}
@keyframes ks-digits {
  0%, 93%, 100% { opacity: 1; }
  94% { opacity: .35; }
  95% { opacity: 1; }
  96% { opacity: .5; }
  97% { opacity: 1; }
}

/* -- accessibility -------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  html[data-ks-polish="on"] *,
  html[data-ks-polish="on"] *::before,
  html[data-ks-polish="on"] *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .001ms !important;
  }
  html[data-ks-polish="on"] div.VERcba_card::after,
  html[data-ks-polish="on"] :where([class*="composer"], [class*="inputBox"], [class*="chatInput"])::after { display: none; }
}
`;

		// ---------------------------------------------------------------- helpers
		const readSaved = () => {
			try {
				const value = window.localStorage.getItem(STORAGE_KEY);
				if (value === "none") return "none";
				if (value && Object.prototype.hasOwnProperty.call(WALLPAPERS, value)) return value;
			} catch (error) {
				/* localStorage may be unavailable */
			}
			return DEFAULT_WALLPAPER;
		};

		const save = (id) => {
			try {
				window.localStorage.setItem(STORAGE_KEY, id);
			} catch (error) {
				/* ignore */
			}
		};

		const readPolish = () => {
			try {
				return window.localStorage.getItem(POLISH_KEY) !== "off";
			} catch (error) {
				return true;
			}
		};

		const savePolish = (on) => {
			try {
				window.localStorage.setItem(POLISH_KEY, on ? "on" : "off");
			} catch (error) {
				/* ignore */
			}
		};

		const applyPolish = (on) => {
			document.documentElement.setAttribute("data-ks-polish", on ? "on" : "off");
		};

		// Transparency of the four big surfaces: left nav, panel layers,
		// composer and code blocks. Values live in CSS (see the glass-level
		// block) so switching is a single attribute flip.
		const GLASS_LEVELS = ["solid", "mid", "clear"];
		const GLASS_LABELS = { solid: "偏实", mid: "标准", clear: "通透" };

		const readGlass = () => {
			try {
				const v = window.localStorage.getItem(GLASS_KEY);
				return GLASS_LEVELS.indexOf(v) >= 0 ? v : "mid";
			} catch (error) {
				return "mid";
			}
		};

		const saveGlass = (level) => {
			try {
				window.localStorage.setItem(GLASS_KEY, level);
			} catch (error) {
				/* ignore */
			}
		};

		const applyGlass = (level) => {
			const next = GLASS_LEVELS.indexOf(level) >= 0 ? level : "mid";
			document.documentElement.setAttribute("data-ks-glass", next);
			return next;
		};

		let wallStyleEl = null;

		// The wallpaper CSS is regenerated only when the selection changes. Each
		// image is inline base64, so it lives in this dedicated stylesheet rather
		// than in inherited custom properties.
		//
		// Verified from shipped source (dsh-client-ui-layout/lib/client.js:72-91):
		//   .MnhYfG_frame  — AppFrame, the grid root; the common React parent of
		//                     sidebarCol + centerCol. It paints its own opaque
		//                     background (--dsw-alias-bg-base, or
		//                     --dsw-specific-sidebar-fill under the Windows
		//                     title bar), so a body-level wallpaper is hidden.
		//   .MnhYfG_centerCol — paints --dsw-alias-bg-base on Windows/macOS.
		// Both are addressed here; `#root > div` is the stable fallback for the
		// same element when the CSS-module hash changes between builds.
		const buildWallCss = (wp) => `
html[data-ks-wall="on"] body,
html[data-ks-wall="on"] #root > div,
html[data-ks-wall="on"] div.MnhYfG_frame {
  background-color: #06080f !important;
  background-image:
    radial-gradient(120% 92% at 52% 42%, transparent 54%, rgba(2,4,8,.42) 100%),
    linear-gradient(101deg, rgba(4,6,12,.94) 0%, rgba(6,9,16,.88) 30%, rgba(8,11,20,.70) 52%, rgba(10,13,22,.30) 74%, rgba(7,10,17,.52) 100%),
    radial-gradient(78rem 48rem at 84% 38%, rgba(133,48,64,.24), transparent 62%),
    url("${wp.dark}") !important;
  background-size: cover, cover, cover, cover;
  background-position: center, center, center, ${wp.pos};
  background-repeat: no-repeat;
  background-attachment: scroll, scroll, scroll, fixed;
}
/* The theme presenter toggles data-ds-dark-theme on <body>, so the light
   variant is selected with body:not([data-ds-dark-theme]). */
html[data-ks-wall="on"] body:not([data-ds-dark-theme]),
html[data-ks-wall="on"] body:not([data-ds-dark-theme]) #root > div,
html[data-ks-wall="on"] body:not([data-ds-dark-theme]) div.MnhYfG_frame {
  background-color: #f4eee6 !important;
  background-image:
    radial-gradient(120% 92% at 52% 42%, transparent 70%, rgba(120,86,74,.10) 100%),
    linear-gradient(101deg, rgba(253,250,246,.74) 0%, rgba(252,248,243,.60) 30%, rgba(250,245,239,.34) 52%, rgba(250,245,239,.08) 74%, rgba(252,248,243,.30) 100%),
    radial-gradient(70rem 44rem at 86% 36%, rgba(196,110,104,.14), transparent 60%),
    url("${wp.light}") !important;
}
/* The conversation chain paints --dsw-alias-bg-base on several nested layers
   (centerCol -> conversation root -> body). With a translucent token those
   stack into a nearly opaque cream wash, so every intermediate layer is
   cleared and exactly one scrim is kept on the center column. The
   conversation root's stable hook is its data-phase attribute; its CSS-module
   hash differs per build. */
html[data-ks-wall="on"] div.MnhYfG_centerCol,
html[data-ks-wall="on"] #root > div > div.MnhYfG_centerCol {
  background-color: var(--ks-scrim, rgba(7,10,18,.38)) !important;
  background-image: none !important;
}
html[data-ks-wall="on"] body:not([data-ds-dark-theme]) div.MnhYfG_centerCol,
html[data-ks-wall="on"] body:not([data-ds-dark-theme]) #root > div > div.MnhYfG_centerCol {
  background-color: var(--ks-scrim-light, rgba(250,246,241,.20)) !important;
}
html[data-ks-wall="on"] div[data-phase],
html[data-ks-wall="on"] div.MnhYfG_bottomRow {
  background-color: transparent !important;
  background-image: none !important;
}
html[data-ks-wall="off"] body,
html[data-ks-wall="off"] #root > div,
html[data-ks-wall="off"] div.MnhYfG_frame,
html[data-ks-wall="off"] div.MnhYfG_centerCol { background-image: none !important; }

@media (max-width: 900px) {
  html[data-ks-wall="on"] body,
  html[data-ks-wall="on"] #root > div,
  html[data-ks-wall="on"] div.MnhYfG_frame { background-position: center, center, center, 68% 38%; }
}
`;

		const applyWallpaper = (id) => {
			const root = document.documentElement;
			if (!root) return;
			if (id === "none") {
				root.setAttribute("data-ks-wall", "off");
				if (wallStyleEl) wallStyleEl.textContent = "";
				return;
			}
			const wp = WALLPAPERS[id] || WALLPAPERS[DEFAULT_WALLPAPER];
			root.setAttribute("data-ks-wall", "on");
			if (wallStyleEl) wallStyleEl.textContent = buildWallCss(wp);
		};

		const clearWallpaper = () => {
			const root = document.documentElement;
			if (root) root.removeAttribute("data-ks-wall");
			if (wallStyleEl) {
				wallStyleEl.remove();
				wallStyleEl = null;
			}
		};

		const controller = {
			apply: applyWallpaper,
			save,
			polish: { read: readPolish, save: savePolish, apply: applyPolish },
			glass: { read: readGlass, save: saveGlass, apply: applyGlass }
		};

		// ---------------------------------------------------------------- brand
		// "sidebar.brand.mark" is a documented *single* extension point with
		// props { size }. Registering here makes us its sole occupant (both the
		// collapsed rail and expanded brand row render this component), which is
		// exactly the icon adaptation a skin is for. We respect props.size.
		let markSeq = 0;

		function KurisuMark(props) {
			const size = (props && props.size) || 24;
			const gid = "ks-mark-g-" + ++markSeq;
			// Both shipped render sites pass only { size }; the hero one also
			// passes a className that carries its own sizing, so it is preserved.
			const cls = "ks-mark" + (props && props.className ? " " + props.className : "");
			return React.createElement(
				"svg",
				{
					className: cls,
					width: size,
					height: size,
					viewBox: "0 0 24 24",
					"aria-hidden": "true",
					focusable: "false"
				},
				React.createElement(
					"defs",
					null,
					React.createElement(
						"linearGradient",
						{ id: gid, x1: "0", y1: "0", x2: "1", y2: "1" },
						React.createElement("stop", { offset: "0%", stopColor: "var(--dsw-alias-brand-primary)" }),
						React.createElement("stop", { offset: "100%", stopColor: "var(--dsw-alias-state-business-primary)" })
					)
				),
				React.createElement("rect", { x: 1, y: 1, width: 22, height: 22, rx: 7, fill: "url(#" + gid + ")" }),
				React.createElement("path", {
					d: "M12 5 L6.5 18 M12 5 L17.5 18 M8.4 14 h7.2",
					fill: "none",
					stroke: "#fff",
					strokeWidth: 1.8,
					strokeLinecap: "round",
					strokeLinejoin: "round",
					opacity: .95
				}),
				React.createElement("circle", { cx: 19, cy: 5.5, r: 1.8, fill: "#fff", opacity: .9 })
			);
		}

		// ---------------------------------------------------------------- ui
		function KurisuRow(props) {
			const [active, setActive] = React.useState(readSaved);
			const [polishOn, setPolishOn] = React.useState(readPolish);
			const [glass, setGlass] = React.useState(readGlass);
			const ctrl = props.controller || controller;
			const choose = (id) => {
				setActive(id);
				ctrl.save(id);
				ctrl.apply(id);
			};
			const items = ORDER.concat(["none"]).map((id) => {
				const none = id === "none";
				const wp = WALLPAPERS[id];
				return React.createElement(
					"button",
					{
						key: id,
						type: "button",
						className: none ? "ks-thumb ks-none" : "ks-thumb",
						title: none ? "移除皮肤壁纸（配色仍然保留）" : wp.label + " — " + wp.hint,
						"data-active": String(active === id),
						"aria-pressed": active === id,
						style: none ? undefined : { backgroundImage: 'url("' + wp.thumb + '")' },
						onClick: () => choose(id)
					},
					React.createElement("span", null, none ? "无壁纸" : wp.label)
				);
			});
			return React.createElement(
				"div",
				{ className: "ks-row" },
				React.createElement(
					"div",
					{ className: "ks-head" },
					React.createElement("span", { className: "ks-title" }, "Makise Kurisu"),
					React.createElement("span", { className: "ks-sub" }, "Amadeus 配色 · 壁纸与界面同步")
				),
				React.createElement("div", { className: "ks-thumbs" }, items),
				React.createElement(
					"div",
					{ className: "ks-glassRow" },
					React.createElement("span", { className: "ks-glassLabel" }, "面板透明度"),
					React.createElement(
						"div",
						{ className: "ks-seg", role: "group", "aria-label": "面板透明度" },
						GLASS_LEVELS.map((level) =>
							React.createElement(
								"button",
								{
									key: level,
									type: "button",
									"data-on": String(glass === level),
									"aria-pressed": glass === level,
									title: "左栏 / 会话框 / 输入框 / 代码块：" + GLASS_LABELS[level],
									onClick: () => {
										setGlass(level);
										ctrl.glass.save(level);
										ctrl.glass.apply(level);
									}
								},
								GLASS_LABELS[level]
							)
						)
					)
				),
				React.createElement(
					"p",
					{ className: "ks-hint" },
					active === "none"
						? "当前只启用配色，不显示壁纸。"
						: "壁纸会随浅色 / 深色模式自动换图；素材来自本地 wallpaper 图库。"
				),
				React.createElement(
					"button",
					{
						type: "button",
						className: "ks-toggle",
						"data-on": String(polishOn),
						"aria-pressed": polishOn,
						title: "图标辉光、按钮渐变、CRT 扫描线、辉光管与启动动画",
						onClick: () => {
							const next = !polishOn;
							setPolishOn(next);
							ctrl.polish.save(next);
							ctrl.polish.apply(next);
						}
					},
					React.createElement("span", { className: "ks-toggle-knob" }),
					React.createElement("span", null, "图标 / 按钮 / 动效"),
					React.createElement("span", { className: "ks-toggle-state" }, polishOn ? "开" : "关")
				)
			);
		}

		// A small Steins;Gate divergence meter, parked in the sidebar footer's
		// list slot. Tube rendering is the v4 Web Component from
		// steins-gate-nixie-assets (src/sg-nixie.inline.js); this file only drives
		// its value and load progress. β 世界线按 S;G 设定为 1.130205，7 位有效
		// 数字 + 1 支小数点管 = 8 支；不再在有效位之后补零。
		const WORLDLINES = [
			{ value: "1.130205", label: "β 世界线" },
			{ value: "1.048596", label: "Steins Gate" },
			{ value: "0.334581", label: "α 世界线" },
			{ value: "3.019304", label: "δ 世界线" },
			{ value: "1.064750", label: "Ω 世界线" }
		];
		// 8 tubes = 1 integer + 1 dot + 6 decimals. Every worldline has exactly 7
		// significant digits, so digitsOf never pads with zeros; the component
		// leaves a missing position as a DARK tube rather than inventing a zero.
		const NIXIE_CELLS = 7;
		const V4_TUBES = NIXIE_CELLS + 1;
		const digitsOf = (value) => String(value).replace(/[^0-9]/g, "").slice(0, NIXIE_CELLS);
		const BETA_DIGITS = digitsOf("1.130205");

		// Both the host boot injection and the client plugin ship the same v4
		// source; the guard inside the component makes registration idempotent.
		const ensureNixieV4 = () => {
			try {
				if (typeof customElements === "undefined" || typeof SG_NIXIE_JS !== "string") return;
				if (customElements.get("sg-nixie")) return;
				const tag = document.createElement("script");
				tag.textContent = SG_NIXIE_JS;
				(document.head || document.documentElement).appendChild(tag);
			} catch (error) {}
		};

		// noignite=1 disables the component's own ignition animation so that the
		// boot boards can drive the tubes with the real --dsh-boot-arc progress.
		const makeV4Meter = (className, span) => {
			const el = document.createElement("sg-nixie");
			el.setAttribute("tubes", String(V4_TUBES));
			el.setAttribute("noignite", "1");
			el.setAttribute("value", "1.130205");
			if (className) el.className = className;
			if (span) el.style.setProperty("--nx-span", span);
			el.style.setProperty("--nx-gr", ".12");
			return el;
		};

		const convergeV4 = (meter, progress) => {
			if (!meter || typeof meter.lockProgress !== "function") return;
			meter.lockProgress(Math.max(0, Math.min(1, progress)), BETA_DIGITS);
		};

		function NixieRow(props) {
			const digits = digitsOf(props.value);
			const attach = (el) => {
				if (!el) return;
				const paint = () => {
					if (typeof el.lockProgress === "function") el.lockProgress(1, digits);
					else window.setTimeout(paint, 60);
				};
				paint();
			};
			return React.createElement(
				"button",
				{
					type: "button",
					className: "ks-nixie-row",
					title: props.label + " · 点击切换世界线",
					"aria-label": "世界线变动率 " + props.value,
					onClick: props.onClick
				},
				React.createElement("sg-nixie", {
					ref: attach,
					tubes: String(V4_TUBES),
					noignite: "1",
					value: props.value,
					style: { "--nx-span": "150px", "--nx-gr": ".13" }
				})
			);
		}

		function DivergenceMeter() {
			const [index, setIndex] = React.useState(0);
			const line = WORLDLINES[index % WORLDLINES.length];
			return React.createElement(NixieRow, {
				label: line.label,
				value: line.value,
				onClick: () => setIndex((i) => (i + 1) % WORLDLINES.length)
			});
		}

		// ------------------------------------------------- splash takeover
		// The shipped product splash is built by the web shell *before* plugins
		// activate, and it stays on screen while they do. Its own spinner exposes
		// the real progress as `--dsh-boot-arc` (72deg..288deg), so the board can
		// converge in step with actual plugin loading instead of faking a timer.
		// Verified from the shell source: root gets `data-dsh-boot`, spinner gets
		// `data-dsh-boot-spinner`, and updateProgress writes that angle.
		// Same geometry as the KurisuMark component, as markup: the splash badge is
		// injected before React is available, so it cannot go through a React root.
		// Keep the two in sync if the badge art changes.
		let markHtmlSeq = 0;
		const MARK_HTML = () => {
			const gid = "ks-boot-mark-g-" + ++markHtmlSeq;
			return (
				'<svg class="ks-mark" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
				'<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
				'<stop offset="0%" style="stop-color:var(--dsw-alias-brand-primary,#9c3140)"/>' +
				'<stop offset="100%" style="stop-color:var(--dsw-alias-state-business-primary,#2f8f7c)"/>' +
				"</linearGradient></defs>" +
				'<rect x="1" y="1" width="22" height="22" rx="7" fill="url(#' + gid + ')"/>' +
				'<path d="M12 5 L6.5 18 M12 5 L17.5 18 M8.4 14 h7.2" fill="none" stroke="#fff"' +
				' stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>' +
				'<circle cx="19" cy="5.5" r="1.8" fill="#fff" opacity="0.9"/>' +
				"</svg>"
			);
		};
		const ARC_MIN = 72;
		const ARC_SPAN = 216;

		const splashProgress = (spinner) => {
			if (!spinner) return null;
			const arc = parseFloat(spinner.style.getPropertyValue("--dsh-boot-arc"));
			if (!isFinite(arc)) return null;
			return Math.max(0, Math.min(1, (arc - ARC_MIN) / ARC_SPAN));
		};

		const takeOverSplash = () => {
			// The host plugin injects the load screen through the boot table, which is
			// strictly earlier than anything a client plugin can do. If it is already
			// on screen, do not draw a second one.
			if (document.getElementById("ks-loadscreen")) return true;
			const root = document.querySelector("[data-dsh-boot]");
			if (!root) return false;
			if (document.querySelector(".ks-splash")) return true;
			// Hides the shell's own card (CSS keys off this attribute) and marks the
			// takeover so we never run twice.
			root.setAttribute("data-ks-boot", "true");

			const spinner = root.querySelector("[data-dsh-boot-spinner]");

			const el = document.createElement("div");
			el.className = "ks-splash";
			el.setAttribute("role", "presentation");

			const brand = document.createElement("div");
			brand.className = "ks-splash-brand";
			brand.innerHTML = MARK_HTML();
			const word = document.createElement("span");
			word.className = "ks-splash-word";
			word.textContent = "HARNESS";
			brand.appendChild(word);

			const cap = document.createElement("div");
			cap.className = "ks-splash-cap";
			cap.textContent = "world line divergence";

			const row = document.createElement("div");
			row.className = "ks-splash-row";
			const meter = makeV4Meter("ks-v4-splash", "min(560px, 78vw)");
			row.appendChild(meter);

			const val = document.createElement("div");
			val.className = "ks-splash-val";
			val.textContent = "CONVERGING";

			const bar = document.createElement("div");
			bar.className = "ks-splash-bar";
			const fill = document.createElement("i");
			bar.appendChild(fill);

			const hint = document.createElement("div");
			hint.className = "ks-splash-hint";
			hint.textContent = "AMADEUS LINK · β";

			el.appendChild(brand);
			el.appendChild(cap);
			el.appendChild(row);
			el.appendChild(val);
			el.appendChild(bar);
			el.appendChild(hint);
			(document.body || document.documentElement).appendChild(el);

			const startedAt = Date.now();
			let finished = false;
			let ticker = 0;
			const timers = [];

			const finish = () => {
				if (finished) return;
				finished = true;
				if (ticker) window.clearInterval(ticker);
				el.setAttribute("data-out", "true");
				const timer = window.setTimeout(() => el.remove(), 440);
				timers.push(timer);
			};

			const step = () => {
				if (finished) return;
				const elapsed = Date.now() - startedAt;
				const real = splashProgress(spinner);
				const progress = real === null ? Math.min(1, elapsed / 2600) : real;
				convergeV4(meter, progress);
				fill.style.width = (progress * 100).toFixed(1) + "%";
				val.textContent = progress < 1
					? "CONVERGING " + String(Math.round(progress * 100)).padStart(3, " ") + "%"
					: "β  1.130205";
				// Hand back as soon as the shell tears its splash down. A short floor
				// keeps it from blinking out if the splash goes very early.
				if (!document.body.contains(root) && elapsed > 620) finish();
			};

			ticker = window.setInterval(step, 70);
			step();
			// Hard ceiling: never outlive the load screen.
			timers.push(window.setTimeout(finish, 9000));

			return true;
		};

		// A one-per-launch nixie board: 8 tubes spin, then lock left to right to
		// the β worldline digits as the progress bar fills, then fade out.
		// Skipped entirely under prefers-reduced-motion, when the polish layer is
		// off, or when this document already showed it this session.
		const BOOT_KEY = "{{SECRET_ksboot0001}}";

		const prefersReducedMotion = () => {
			try {
				return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			} catch (error) {
				return false;
			}
		};

		const bootAlreadyShown = () => {
			try {
				return window.sessionStorage.getItem(BOOT_KEY) === "1";
			} catch (error) {
				return false;
			}
		};

		const markBootShown = () => {
			try {
				window.sessionStorage.setItem(BOOT_KEY, "1");
			} catch (error) {
				/* ignore */
			}
		};

		// Once per page load: see armSplashHandoff().
		let splashHandoffFired = false;

		const showBootScreen = () => {
			if (prefersReducedMotion()) return function () {};
			if (!readPolish()) return function () {};
			if (bootAlreadyShown()) return function () {};
			markBootShown();

			const el = document.createElement("div");
			el.className = "ks-boot";
			el.setAttribute("role", "presentation");

			const row = document.createElement("div");
			row.className = "ks-boot-row";
			const meter = makeV4Meter("ks-v4-boot", "min(720px, 86vw)");
			row.appendChild(meter);

			const cap = document.createElement("div");
			cap.className = "ks-boot-cap";
			cap.textContent = "world line divergence";
			const val = document.createElement("div");
			val.className = "ks-boot-val";
			val.textContent = "CONVERGING";
			const bar = document.createElement("div");
			bar.className = "ks-boot-bar";
			const fill = document.createElement("i");
			bar.appendChild(fill);
			const hint = document.createElement("div");
			hint.className = "ks-boot-hint";
			hint.textContent = "CLICK OR ESC TO SKIP";

			el.appendChild(cap);
			el.appendChild(row);
			el.appendChild(val);
			el.appendChild(bar);
			el.appendChild(hint);
			document.body.appendChild(el);

			let finished = false;
			const timers = [];
			let ticker = 0;
			const cleanup = () => {
				document.removeEventListener("keydown", onKey);
				if (ticker) window.clearInterval(ticker);
				timers.forEach((t) => window.clearTimeout(t));
			};
			const finish = () => {
				if (finished) return;
				finished = true;
				el.setAttribute("data-out", "true");
				const t = window.setTimeout(() => {
					el.remove();
					cleanup();
				}, 620);
				timers.push(t);
			};
			const onKey = (event) => {
				if (event.key === "Escape") finish();
			};
			el.addEventListener("click", finish);
			document.addEventListener("keydown", onKey);
			// Hard safety: the board can never outlive this, whatever happens to
			// the ticker (throttled background tab, suspended renderer, ...).
			timers.push(window.setTimeout(finish, 8000));

			// Timers rather than rAF: a backgrounded window throttles rAF to a
			// standstill, which would leave the board frozen on screen forever.
			const DURATION = 2600;
			const started = Date.now();
			const step = () => {
				if (finished) return;
				const elapsed = Date.now() - started;
				const progress = Math.min(1, elapsed / DURATION);
				convergeV4(meter, progress);
				fill.style.width = (progress * 100).toFixed(1) + "%";
				val.textContent = progress < 1
					? "CONVERGING " + String(Math.round(progress * 100)).padStart(3, " ") + "%"
					: "β  1.130205";
				if (progress < 1) return;
				convergeV4(meter, 1);
				window.clearInterval(ticker);
				ticker = 0;
				timers.push(window.setTimeout(finish, 640));
			};
			ticker = window.setInterval(step, 70);
			step();
			return () => {
				finished = true;
				el.remove();
				cleanup();
			};
		};

		// ---------------------------------------------------------------- plugin
		const name = "dsh-skin-kurisu";
		const inject = ["theme", "slots"];

		// ---------------------------------------------------------- first frame
		// There is one unavoidable frame the skin cannot own: the shell paints its
		// own splash before any plugin runs. Dropping an opaque mask synchronously
		// on activation turns that hand-off from "white HARNESS flashes, then goes
		// dark" into "goes dark once, then the themed board lights up".
		// Inline styles only: it must not depend on our stylesheet being injected.
		const dropFirstFrameMask = () => {
			if (prefersReducedMotion()) return function () {};
			// The host-injected load screen is already an opaque full-viewport layer,
			// so a mask on top of it would only hide the thing we want seen.
			if (document.getElementById("ks-loadscreen")) return function () {};
			const mask = document.createElement("div");
			mask.setAttribute("aria-hidden", "true");
			mask.style.cssText = [
				"position:fixed", "inset:0", "z-index:2147483600",
				"pointer-events:none", "opacity:1", "will-change:opacity",
				"transition:opacity .34s ease",
				"background:radial-gradient(130% 96% at 50% 42%,#101728 0%,#080b14 52%,#03050a 100%)"
			].join(";");
			(document.body || document.documentElement).appendChild(mask);
			let released = false;
			const release = () => {
				if (released) return;
				released = true;
				mask.style.opacity = "0";
				window.setTimeout(() => mask.remove(), 380);
			};
			// Two frames so the themed splash has painted underneath, then hand over.
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.setTimeout(release, 260)));
			} else {
				window.setTimeout(release, 300);
			}
			// Never let it outlive this.
			window.setTimeout(release, 1400);
			return release;
		};

		// ------------------------------------------------------- splash hand-off
		// The asar-native + host-injected #ks-loadscreen is ONE continuous layer.
		// When it starts dissolving, the host sets data-ks-ready="1" on <html>;
		// ignite the sidebar meter so the 1.130205 reading visibly travels from
		// the centre of the screen into its permanent home in the sidebar.
		const pulseSidebarMeter = () => {
			const row = document.querySelector(".ks-nixie-row");
			if (!row) { window.setTimeout(pulseSidebarMeter, 160); return; }
			row.classList.remove("ks-meter-arrive");
			// Force a reflow so re-adding the class restarts the keyframes.
			void row.offsetWidth;
			row.classList.add("ks-meter-arrive");
			window.setTimeout(() => row.classList.remove("ks-meter-arrive"), 1500);
		};
		const syncSplashTheme = () => {
			try {
				const mount = document.getElementById("ks-loadscreen");
				if (!mount) return;
				const body = document.body;
				let dark = !window.matchMedia("(prefers-color-scheme: light)").matches;
				if (body && body.hasAttribute("data-ds-dark-theme")) dark = true;
				if (dark) mount.removeAttribute("data-ks-light");
				else mount.setAttribute("data-ks-light", "1");
				// Keep the boot layer on exactly the wallpaper the skin is showing,
				// so the 700ms dissolve reveals the same picture (not a different
				// wallpaper fading out underneath it).
				const wall = readSaved();
				if (wall === "none") mount.setAttribute("data-ks-wall", "none");
				else mount.setAttribute("data-ks-wall", wall);
			} catch (error) {}
		};
		const armSplashHandoff = () => {
			try {
				const root = document.documentElement;
				// Module-scope latch, NOT a closure local. apply() runs again on a
				// plugin reload / HMR within the same page, and a per-call flag let
				// the 15s hard stop re-fire the whole hand-off hours later: it
				// re-flushed the full boot timeline to the probe collector three
				// times in one session and re-pulsed the sidebar meter for no
				// reason. The hand-off is once per page load.
				const fire = () => {
					if (splashHandoffFired) return;
					splashHandoffFired = true;
					// Close the boot timeline: the sidebar meter has received the
					// 1.130205 reading, so the hand-off is complete end-to-end.
					try {
						if (window.KS_PROBE && typeof window.KS_PROBE.mark === "function") {
							window.KS_PROBE.mark("client-handoff");
							window.KS_PROBE.flush("client-handoff");
						}
					} catch (error) {}
					// The unified splash already did this launch's boot animation.
					// Mark it so a later plugin reload cannot replay the standalone
					// board once #ks-loadscreen has been removed.
					try { markBootShown(); } catch (error) {}
					pulseSidebarMeter();
				};
				if (root.getAttribute("data-ks-ready") === "1") { fire(); return; }
				syncSplashTheme();
				const obs = new MutationObserver(() => {
					if (root.getAttribute("data-ks-ready") === "1") {
						fire();
						obs.disconnect();
					} else {
						syncSplashTheme();
					}
				});
				obs.observe(root, { attributes: true, attributeFilter: ["data-ks-ready", "data-ks-wall"] });
				// Keep the splash wallpaper in step with a theme flip while it is
				// still on screen. The 15s timer is a hard stop, not a trigger.
				const themeObs = new MutationObserver(syncSplashTheme);
				if (document.body) themeObs.observe(document.body, { attributes: true, attributeFilter: ["data-ds-dark-theme"] });
				window.setTimeout(() => { fire(); obs.disconnect(); themeObs.disconnect(); }, 15000);
			} catch (error) {}
		};

		function apply(ctx) {
		ensureNixieV4();
			armSplashHandoff();
			const releaseFirstFrame = dropFirstFrameMask();
			ctx.effect(() => () => releaseFirstFrame(), "kurisu-skin: first frame mask");
			ctx.effect(() => {
				applyPolish(readPolish());
				return () => document.documentElement.removeAttribute("data-ks-polish");
			}, "kurisu-skin: polish flag");
			ctx.effect(() => {
				applyGlass(readGlass());
				return () => document.documentElement.removeAttribute("data-ks-glass");
			}, "kurisu-skin: glass level");
			ctx.effect(() => {
				wallStyleEl = document.createElement("style");
				wallStyleEl.dataset.plugin = "dsh-skin-kurisu";
				wallStyleEl.dataset.pluginCss = "dsh-skin-kurisu/wallpaper.css";
				document.head.appendChild(wallStyleEl);
				applyWallpaper(readSaved());
				return () => clearWallpaper();
			}, "kurisu-skin: wallpaper stylesheet");

			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-skin-kurisu";
				tag.dataset.pluginCss = "dsh-skin-kurisu/skin.css";
				tag.textContent = CSS;
				document.head.appendChild(tag);
				return () => tag.remove();
			}, "kurisu-skin: stylesheet");

			ctx.effect(() => {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-skin-kurisu";
				tag.dataset.pluginCss = "dsh-skin-kurisu/polish.css";
				tag.textContent = POLISH_CSS;
				document.head.appendChild(tag);
				return () => tag.remove();
			}, "kurisu-skin: icon/button/motion polish");

			// Registered after the stylesheets above so the board mounts with its
			// CSS already in the document, then one frame later so it lands on a
			// laid-out UI instead of a blank document.
			ctx.effect(() => {
				// The product splash is up right now (we are being activated inside
				// it). Re-skin it and drive its board from real load progress; only
				// fall back to the standalone post-load board when it is gone.
				if (takeOverSplash()) {
					return () => {};
				}
				let dispose = null;
				const timer = window.setTimeout(() => {
					dispose = showBootScreen();
				}, 140);
				return () => {
					window.clearTimeout(timer);
					if (typeof dispose === "function") dispose();
				};
			}, "kurisu-skin: nixie boot");

			const releaseTokens = ctx.theme.overrideTokens("dsh-skin-kurisu", TOKENS);
			ctx.effect(() => releaseTokens, "kurisu-skin: token layer");

			const releaseDark = ctx.theme.register({
				id: "kurisu-amadeus",
				colorScheme: "dark",
				tokens: flatten("dark")
			});
			ctx.effect(() => releaseDark, "kurisu-skin: dark theme registration");

			const releaseLight = ctx.theme.register({
				id: "kurisu-amadeus-day",
				colorScheme: "light",
				tokens: flatten("light")
			});
			ctx.effect(() => releaseLight, "kurisu-skin: light theme registration");

			ctx.slots.inject("settings.general.item", () => {
				try {
					return ctx.slots.register(
						{
							name: "settings.general.item",
							id: "kurisu-skin",
							order: 12,
							label: "Kurisu 皮肤"
						},
						(props) => React.createElement(KurisuRow, props)
					);
				} catch (error) {
					return function () {};
				}
			});

			// list slot, replaceRisk "none": adds one tiny widget beside Settings
			ctx.slots.inject("sidebar.footer.action", () => {
				try {
					return ctx.slots.register(
						{
							name: "sidebar.footer.action",
							id: "kurisu-divergence-meter",
							order: 40,
							label: "世界线变动率"
						},
						(props) => React.createElement(DivergenceMeter, props)
					);
				} catch (error) {
					return function () {};
				}
			});

			// single brand-mark extension point: replaces the shipped fish logo.
			// "single" slots allow one occupant per priority, and the lowest
			// priority renders — so we register at a negative priority to shadow
			// the official brand plugin if it is enabled, and never throw.
			ctx.slots.inject("sidebar.brand.mark", () => {
				try {
					return ctx.slots.register(
						{
							name: "sidebar.brand.mark",
							id: "kurisu-brand-mark",
							priority: -10,
							order: 1,
							label: "Amadeus 徽记"
						},
						(props) => React.createElement(KurisuMark, props)
					);
				} catch (error) {
					return function () {};
				}
			});

			// The empty-session hero renders its own brand mark from the same
			// single-slot pattern ("conversation.hero.brand.mark", props
			// { size: 34, className }), with the shipped fish as fallback. Without
			// this the sidebar shows the Amadeus badge while the hero still shows
			// the stock glyph — the exact mismatch a themed skin must not have.
			ctx.slots.inject("conversation.hero.brand.mark", () => {
				try {
					return ctx.slots.register(
						{
							name: "conversation.hero.brand.mark",
							id: "kurisu-hero-brand-mark",
							priority: -10,
							order: 1,
							label: "Amadeus 徽记（Hero）"
						},
						(props) => React.createElement(KurisuMark, props)
					);
				} catch (error) {
					return function () {};
				}
			});

			[400, 1500, 4000, 8000].forEach(function (ms) {
				window.setTimeout(tagBotChip, ms);
			});
			window.setTimeout(reportBootTimeline, 600);
			[400, 1500, 4000, 8000].forEach(function (ms) {
				window.setTimeout(ksToggleMirror, ms);
			});
			window.setInterval(ksToggleMirror, 5000);
		}

		// Marks the sidebar "DS Bot" chip so CSS can theme its glyph. Retried a few
		// times because the sidebar paints after activation.
		const tagBotChip = () => {
			try {
				const all = document.querySelectorAll('body *, [aria-label*="DS Bot"], [title*="DS Bot"]');
				for (let i = 0; i < all.length; i += 1) {
					const el = all[i];
					const txt = String(el.textContent || "").replace(/\s+/g, " ").trim();
					if (!txt.startsWith("DS Bot") || txt.length > 14) continue;
					const r = el.getBoundingClientRect();
					if (r.height < 10 || r.height > 60) continue;
					let node = el;
					let depth = 0;
					while (node && node !== document.body && depth < 3) {
						node.classList.add("ks-bot-chip");
						node = node.parentElement;
						depth += 1;
					}
					return true;
				}
			} catch (error) {
				return false;
			}
			// geometry pass: the bot chip lives in the same footer container as our
			// nixie row, so tag foreign glyphs there without relying on any text.
			try {
				const meter = document.querySelector(".ks-nixie-row");
				if (meter) {
					let box = meter.parentElement;
					for (let up = 0; up < 2 && box && box.parentElement; up += 1) box = box.parentElement;
					if (box) {
						Array.prototype.forEach.call(box.querySelectorAll("svg, img"), (el) => {
							if (el.closest(".ks-nixie-row")) return;
							el.classList.add("ks-bot-chip");
						});
						return true;
					}
				}
			} catch (error) {}
			return false;
		};

				// Re-posts the boot timeline the injected load screen left in localStorage, so a
		// restart can be diagnosed even if the sink was unreachable at boot time.
		const reportBootTimeline = () => {
			try {
				const stored = localStorage.getItem("ks-boot-tl");
				if (!stored) return;
				if (stored.indexOf("consumed:") === 0) return;
				fetch("http://127.0.0.1:8791/report", { method: "POST", mode: "no-cors", body: stored }).catch(function () {});
				localStorage.setItem("ks-boot-tl", "consumed:" + stored);
			} catch (error) {}
		};

		// Mounts a first-row mirror of the sidebar collapse toggle. The source stays
		// where React put it, so its delegated click handler keeps working.
		const ksToggleMirror = () => {
			try {
				const src = document.querySelector('[class*="_toggle"]:not(.ks-toggle-mirror)');
				if (!src) return false;
				let mirror = document.querySelector('.ks-toggle-mirror');
				if (!mirror) {
					mirror = src.cloneNode(true);
					mirror.classList.add('ks-toggle-mirror');
					mirror.removeAttribute('id');
					mirror.addEventListener('click', function (ev) {
						ev.preventDefault(); ev.stopPropagation();
						const live = document.querySelector('[class*="_toggle"]:not(.ks-toggle-mirror)') || src;
						live.click();
						window.setTimeout(function () { mirror.innerHTML = live.innerHTML; }, 120);
					});
					document.body.appendChild(mirror);
					try {
						const obs = new MutationObserver(function () {
							const live = document.querySelector('[class*="_toggle"]:not(.ks-toggle-mirror)');
							if (live && mirror.innerHTML !== live.innerHTML) mirror.innerHTML = live.innerHTML;
						});
						obs.observe(src, { childList: true, subtree: true, attributes: true });
					} catch (e) {}
				}
				src.classList.add('ks-toggle-source');
				mirror.innerHTML = src.innerHTML;
				["aria-label", "title", "aria-expanded"].forEach(function (a) {
					const v = src.getAttribute(a);
					if (v) mirror.setAttribute(a, v);
				});
				return true;
			} catch (error) {
				return false;
			}
		};

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
