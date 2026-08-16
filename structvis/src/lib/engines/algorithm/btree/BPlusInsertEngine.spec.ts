import { describe, it, expect } from 'vitest';
import { BPlusInsertEngine } from './BPlusInsertEngine';

function run(keys: number[]): BPlusInsertEngine {
	const e = new BPlusInsertEngine();
	e.init(keys);
	return e;
}

describe('BPlusInsertEngine B+ 树插入', () => {
	it('教材序列生成完整步骤', () => {
		const e = run([8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13]);
		expect(e.totalSteps).toBeGreaterThan(30);
	});

	it('每步带 btree 快照，键有序', () => {
		const e = run([8, 5, 12, 3]);
		for (const s of e.steps) {
			expect(s.btree).toBeDefined();
			for (const n of s.btree!.nodes) {
				const ks = [...n.keys];
				expect(ks).toEqual([...ks].sort((a, b) => (a as number) - (b as number)));
			}
		}
	});

	it('完成时树根含分隔键，叶子键数 ≤ 2', () => {
		const e = run([8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13]);
		const last = e.steps[e.totalSteps - 1];
		for (const n of last.btree!.nodes) {
			expect(n.keys.length).toBeLessThanOrEqual(2);
		}
		// 存在非叶节点(根为内部节点)
		expect(last.btree!.nodes.some((n) => !n.leaf)).toBe(true);
	});

	it('所有插入的键都在叶子中出现（数据不丢失）', () => {
		const keys = [8, 5, 12, 3, 7, 10, 15, 1, 9, 14, 6, 13];
		const e = run(keys);
		const last = e.steps[e.totalSteps - 1];
		const leafKeys = last.btree!.nodes.filter((n) => n.leaf).flatMap((n) => n.keys as number[]);
		expect(leafKeys.sort((a, b) => a - b)).toEqual([...keys].sort((a, b) => a - b));
	});

	it('单键插入：根即叶子', () => {
		const e = run([42]);
		const last = e.steps[e.totalSteps - 1];
		expect(last.btree!.nodes.length).toBe(1);
		expect(last.btree!.nodes[0].leaf).toBe(true);
		expect(last.btree!.nodes[0].keys).toEqual([42]);
	});
});
