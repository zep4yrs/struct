import { describe, it, expect } from 'vitest';
import { LRUEngine } from './LRUEngine';

function run(): LRUEngine {
	const e = new LRUEngine();
	e.init([0]);
	return e;
}

describe('LRUEngine LRU 缓存', () => {
	it('淘汰顺序符合 LRU 语义', () => {
		const e = run();
		const descs = e.steps.map((s) => s.description).join(' ');
		// 容量 4: put1,2,3 → get1(1 移头) → put4 → put5 淘汰 2(get 后 2 是 LRU? 不,get1 后序列 [1,3,2], put4 [4,1,3,2], put5 淘汰 2)
		expect(descs).toContain('淘汰尾部 LRU 节点 key=2');
	});

	it('get 命中会把节点移到头部', () => {
		const e = run();
		const hit = e.steps.find((s) => s.description.includes('get(1) 命中'));
		expect(hit).toBeDefined();
		expect(hit!.data[0]).toBe(1);
	});

	it('每步 data 为缓存键序列', () => {
		const e = run();
		for (const s of e.steps) {
			expect(s.data.length).toBeLessThanOrEqual(4);
		}
	});
});
