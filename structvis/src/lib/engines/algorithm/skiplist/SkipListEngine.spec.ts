import { describe, it, expect } from 'vitest';
import { SkipListEngine } from './SkipListEngine';

function run(): SkipListEngine {
	const e = new SkipListEngine();
	e.init([0]);
	return e;
}

describe('SkipListEngine 跳表', () => {
	it('生成完整步骤（init + 4 键插入 × 3 + complete）', () => {
		const e = run();
		expect(e.totalSteps).toBeGreaterThanOrEqual(10);
	});

	it('每步带 skiplist 快照，底层键始终有序', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.skipList).toBeDefined();
			const baseLevel = s.skipList!.levels[0];
			const keys = baseLevel.nodes;
			for (let i = 0; i < keys.length - 1; i++) {
				expect(keys[i]).toBeLessThan(keys[i + 1]);
			}
		}
	});

	it('所有插入键最终都在底层', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		const baseKeys = last.skipList!.levels[0].nodes;
		for (const k of [25, 8, 60, 15]) expect(baseKeys).toContain(k);
	});
});
