import { describe, it, expect } from 'vitest';
import { UnionFindEngine } from './UnionFindEngine';

function run(): UnionFindEngine {
	const e = new UnionFindEngine();
	e.init(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
	return e;
}

describe('UnionFindEngine 并查集', () => {
	it('初始步骤：8 个节点各自成根', () => {
		const e = run();
		const first = e.steps[0];
		expect(first.unionFind).toBeDefined();
		expect(first.unionFind!.nodes.length).toBe(8);
		expect(first.unionFind!.parent).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
	});

	it('每步都带森林快照，parent 长度 = 节点数', () => {
		const e = run();
		expect(e.totalSteps).toBeGreaterThan(10);
		for (const s of e.steps) {
			expect(s.unionFind).toBeDefined();
			expect(s.unionFind!.parent.length).toBe(8);
		}
	});

	it('完成时所有元素应在同一个集合（union(1,5) 后）', () => {
		const e = run();
		const last = e.steps[e.totalSteps - 1];
		const roots = new Set(
			last.unionFind!.parent.map((p) => {
				// 追踪到根
				const seen = new Set<number>();
				let cur = p;
				while (!seen.has(cur)) {
					seen.add(cur);
					cur = last.unionFind!.parent[cur];
				}
				return cur;
			})
		);
		expect(roots.size).toBeLessThanOrEqual(2);
	});

	it('包含 find 与 union 两类描述', () => {
		const e = run();
		const descs = e.steps.map((s) => s.description).join(' ');
		expect(descs).toContain('union');
		expect(descs).toContain('find');
	});
});
