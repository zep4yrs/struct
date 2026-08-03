import { describe, it, expect } from 'vitest';
import { MergeSortEngine } from './MergeSortEngine';

describe('MergeSortEngine', () => {
	it('归并排序：最终数组升序', () => {
		const e = new MergeSortEngine();
		e.init([5, 2, 8, 1, 9]);
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([1, 2, 5, 8, 9]);
	});

	it('奇数长度数组也能正确归并', () => {
		const e = new MergeSortEngine();
		e.init([3, 7, 1, 9, 4, 6, 2]);
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([1, 2, 3, 4, 6, 7, 9]);
	});

	it('合并步骤用 partition 高亮两个子区间', () => {
		const e = new MergeSortEngine();
		e.init([5, 2, 8, 1]);
		const mergeStep = e.steps.find((s) => s.type === 'recurse-enter');
		expect(mergeStep).toBeDefined();
		const partitions = mergeStep!.highlights.filter((h) => h.type === 'partition');
		expect(partitions).toHaveLength(2);
		expect(partitions[0].indices).toEqual([0]);
		expect(partitions[1].indices).toEqual([1]);
	});

	it('合并写回步骤存在（swap 高亮覆盖整个区间）', () => {
		const e = new MergeSortEngine();
		e.init([2, 1]);
		const writeStep = e.steps.find((s) => s.highlights.some((h) => h.type === 'swap'));
		expect(writeStep).toBeDefined();
		expect(writeStep!.data).toEqual([1, 2]);
		expect(writeStep!.highlights.find((h) => h.type === 'swap')!.indices).toEqual([0, 1]);
	});
});
