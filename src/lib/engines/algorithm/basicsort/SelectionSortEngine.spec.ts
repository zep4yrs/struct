import { describe, it, expect } from 'vitest';
import { SelectionSortEngine } from './SelectionSortEngine';

describe('SelectionSortEngine', () => {
	it('选择排序：最终数组升序', () => {
		const e = new SelectionSortEngine();
		e.init([5, 2, 8, 1, 9]);
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([1, 2, 5, 8, 9]);
	});

	it('第一轮把全局最小值交换到位置 0', () => {
		const e = new SelectionSortEngine();
		e.init([5, 2, 8, 1]);
		const swapStep = e.steps.find((s) => s.highlights.some((h) => h.type === 'swap'));
		expect(swapStep).toBeDefined();
		expect(swapStep!.data).toEqual([1, 2, 8, 5]);
	});

	it('每轮结束固定前缀（sorted 高亮递增）', () => {
		const e = new SelectionSortEngine();
		e.init([3, 1, 2]);
		const ends = e.steps.filter((s) => s.type === 'partition-end');
		expect(ends).toHaveLength(2);
		expect(ends[0].highlights.find((h) => h.type === 'sorted')!.indices).toEqual([0]);
		expect(ends[1].highlights.find((h) => h.type === 'sorted')!.indices).toEqual([0, 1]);
	});

	it('已有序数组不产生交换', () => {
		const e = new SelectionSortEngine();
		e.init([1, 2, 3]);
		const swaps = e.steps.filter((s) => s.highlights.some((h) => h.type === 'swap'));
		expect(swaps).toHaveLength(0);
	});
});
