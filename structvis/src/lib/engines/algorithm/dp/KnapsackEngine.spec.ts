import { describe, it, expect } from 'vitest';
import { KnapsackEngine } from './KnapsackEngine';

function run(items: number[]): KnapsackEngine {
	const e = new KnapsackEngine();
	e.init(items);
	return e;
}

describe('KnapsackEngine 0-1 背包', () => {
	it('教材示例（w=2,3,4,5; v=3,4,5,8; 容量 8）最优价值 = 12', () => {
		const e = run([2, 3, 3, 4, 4, 5, 5, 8]);
		const last = e.steps[e.totalSteps - 1];
		expect(last.description).toContain('12');
		expect(last.dp).toBeDefined();
	});

	it('每步都带 dp 表格快照（含表头）', () => {
		const e = run([2, 3, 3, 4, 4, 5, 5, 8]);
		expect(e.totalSteps).toBeGreaterThan(20);
		for (const s of e.steps) {
			expect(s.dp).toBeDefined();
			expect(s.dp!.grid.length).toBe(5); // 4 物品 + 表头行
			expect(s.dp!.grid[0].length).toBe(9); // 容量 0..8
		}
	});

	it('首步 init 描述包含物品与容量', () => {
		const e = run([2, 3, 3, 4, 4, 5, 5, 8]);
		expect(e.steps[0].description).toContain('容量 8');
		expect(e.steps[0].description).toContain('4 件物品');
	});
});
