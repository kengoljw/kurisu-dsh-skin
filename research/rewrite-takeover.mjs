// Replaces takeOverSplash() with a self-owned overlay board.
//
// Why: the first version appended its board INTO the shell's splash card, which
// lives inside #root. React's first mount into #root can clear that subtree, so
// the board could vanish (or never be seen) while the app was still loading.
// The shell's own splash is now only *hidden*, and the board is our own
// full-screen layer appended to <body>, so nothing the app does to #root can
// take it away.
import fs from 'node:fs';

const f = '<workspace>\\kurisu-skin\\src\\client.template.js';
let t = fs.readFileSync(f, 'utf8');

const START = 'const takeOverSplash = () => {';
const END = '\t\t// A one-per-launch nixie board:';
const s = t.indexOf(START);
const e = t.indexOf(END, s);
if (s < 0 || e < 0) throw new Error('markers not found');

const block = `const takeOverSplash = () => {
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
			const cells = [];
			for (let i = 0; i < NIXIE_CELLS; i += 1) {
				const tube = buildTube(i * 0.31);
				paintTube(tube, 8);
				row.appendChild(tube);
				cells.push(tube);
				if (i === DOT_AFTER) row.appendChild(buildDotTube());
			}

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
				const locked = progress >= 1 ? NIXIE_CELLS : Math.floor(progress * NIXIE_CELLS);
				for (let i = 0; i < cells.length; i += 1) {
					if (i < locked) paintTube(cells[i], BETA_DIGITS[i]);
					else paintTube(cells[i], Math.floor(Math.random() * 10));
				}
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

`;

t = t.slice(0, s) + block + t.slice(e);
fs.writeFileSync(f, t, 'utf8');
console.log('takeover rewritten');
