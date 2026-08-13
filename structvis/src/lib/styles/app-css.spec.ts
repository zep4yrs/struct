import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

/**
 * 设计 token 契约测试 — 防止 --color-* 类变量缺失（如历史 bug：
 * GraphRenderer 引用 --color-success-deep 但 app.css 从未定义，done 态节点
 * 静默渲染成灰色 #999，且测试注入表同样缺失，未被任何测试发现）。
 *
 * 规则：
 * 1. 源码中 resolveCSSVar('--x') 引用的每个变量，必须在 app.css 中定义；
 * 2. 每个变量必须在 @theme（亮色）与 .dark（暗色）两套主题中都定义；
 * 3. 测试注入表（test-setup.ts）必须包含渲染器用到的全部颜色变量，
 *    否则组件测试中 resolveCSSVar 返回 '#999' 兜底值，掩盖真实颜色。
 */
const APP_CSS = readFileSync(new URL('./app.css', import.meta.url), 'utf-8');
const TEST_SETUP = readFileSync(new URL('../../test-setup.ts', import.meta.url), 'utf-8');

/** 源码中 resolveCSSVar('--x') 的全部引用（排除 spec/测试文件） */
function collectVarRefs(): Set<string> {
	const refs = new Set<string>();
	// node:fs globSync 的 ignore 选项在此环境下不可靠，改用显式过滤
	const files = globSync('src/**/*.{ts,svelte}').filter(
		(f) => !f.endsWith('.spec.ts') && !f.includes('vitest-examples')
	);
	for (const f of files) {
		const src = readFileSync(f, 'utf-8');
		for (const m of src.matchAll(/resolveCSSVar\(\s*['"](--[\w-]+)['"]\s*\)/g)) {
			refs.add(m[1]!);
		}
	}
	return refs;
}

/** app.css 中某主题块内定义的变量名集合 */
function collectDefs(block: string): Set<string> {
	const defs = new Set<string>();
	for (const m of block.matchAll(/(--[\w-]+)\s*:/g)) defs.add(m[1]!);
	return defs;
}

// 亮色 token 定义在 Tailwind v4 的 @theme 块内（构建时生成 :root），暗色在 .dark 块
const rootBlock = APP_CSS.slice(APP_CSS.indexOf('@theme'), APP_CSS.indexOf('.dark'));
const darkBlock = APP_CSS.slice(APP_CSS.indexOf('.dark'));
const rootDefs = collectDefs(rootBlock);
const darkDefs = collectDefs(darkBlock);

describe('设计 token 契约', () => {
	it('渲染器引用的每个 CSS 变量都在 app.css 中定义（防 H4 类静默回退）', () => {
		const refs = collectVarRefs();
		expect(refs.size).toBeGreaterThan(10);
		const missing = [...refs].filter((v) => !rootDefs.has(v));
		expect(missing).toEqual([]);
	});

	it('每个变量在 :root 与 .dark 两套主题中都定义（暗色缺 token 同样会回退 #999）', () => {
		const refs = collectVarRefs();
		const missingDark = [...refs].filter((v) => !darkDefs.has(v));
		expect(missingDark).toEqual([]);
	});

	it('渲染器引用的颜色变量已注入测试环境（test-setup.ts），组件测试不落到 #999 兜底', () => {
		const refs = collectVarRefs();
		const injected = new Set<string>();
		for (const m of TEST_SETUP.matchAll(/'(--[\w-]+)'/g)) injected.add(m[1]!);
		const missing = [...refs].filter((v) => !injected.has(v));
		expect(missing).toEqual([]);
	});
});
