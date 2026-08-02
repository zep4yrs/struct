import { describe, it, expect } from 'vitest';
import { BubbleSortEngine } from './BubbleSortEngine';

describe('BubbleSortEngine', () => {
	it('冒泡排序：最终数组升序', () => {
		const e = new BubbleSortEngine();
		e.init([5, 2, 8, 1, 9]);
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([1, 2, 5, 8, 9]);
	});

	it('交换步骤：较大值上浮', () => {
		const e = new BubbleSortEngine();
		e.init([3, 1]);
		// 第一轮比较后交换
		const swapStep = e.steps.find((s) => s.highlights.some((h) => h.type === 'swap'));
		expect(swapStep).toBeDefined();
		expect(swapStep!.data).toEqual([1, 3]);
	});

	it('每轮结束后末尾元素排定（sorted 高亮覆盖尾部）', () => {
		const e = new BubbleSortEngine();
		e.init([5, 2, 8]);
		const endStep = e.steps.find((s) => s.type === 'partition-end');
		expect(endStep).toBeDefined();
		const sorted = endStep!.highlights.find((h) => h.type === 'sorted');
		expect(sorted!.indices).toContain(2);
	});

	it('已有序数组不产生交换步骤', () => {
		const e = new BubbleSortEngine();
		e.init([1, 2, 3]);
		const swaps = e.steps.filter((s) => s.highlights.some((h) => h.type === 'swap'));
		expect(swaps).toHaveLength(0);
	});
});
