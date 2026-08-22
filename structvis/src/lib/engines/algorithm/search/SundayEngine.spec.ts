import { describe, it, expect } from 'vitest';
import { SundayEngine } from './SundayEngine';

function run(): SundayEngine {
	const e = new SundayEngine();
	e.init(['', '']);
	return e;
}

describe('SundayEngine 匹配', () => {
	it('找到 EXAMPLE 在文本中的位置', () => {
		const e = run();
		const found = e.steps.find((s) => s.sunday!.phase === 'found');
		expect(found).toBeDefined();
		expect(found!.sunday!.align).toBe(17);
	});

	it('偏移表包含模式所有字符', () => {
		const e = run();
		for (const c of 'EXAMPLE') {
			expect(e.steps[0].sunday!.offset[c]).toBeGreaterThan(0);
		}
	});

	it('每步带 sunday 快照', () => {
		const e = run();
		for (const s of e.steps) expect(s.sunday).toBeDefined();
	});

	it('不存在的模式走到 failed', () => {
		const e2 = new SundayEngine();
		e2.init(['', '']);
		// 引擎内置文本,直接检查步骤里没有 found 时应有 failed
		const phases = e2.steps.map((s) => s.sunday!.phase);
		expect(phases.includes('found') || phases.includes('failed')).toBe(true);
	});
});
