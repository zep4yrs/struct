import { describe, it, expect } from 'vitest';
import { InsertionSortEngine } from './InsertionSortEngine';

describe('InsertionSortEngine', () => {
	it('插入排序：最终数组升序', () => {
		const e = new InsertionSortEngine();
		e.init([5, 2, 8, 1, 9]);
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([1, 2, 5, 8, 9]);
	});

	it('轮次开始仅用 partition 背景标记区间，指针在首次比较时出现', () => {
		const e = new InsertionSortEngine();
		e.init([5, 2, 8]);
		const roundStart = e.steps.find((s) => s.type === 'partition-start');
		expect(roundStart).toBeDefined();
		expect(roundStart!.highlights).toEqual([{ type: 'partition', indices: [0, 1] }]);
		const compare = e.steps.find((s) => s.type === 'compare');
		expect(compare).toBeDefined();
		expect(compare!.highlights.some((h) => h.type === 'pointer-j' && h.label === 'j')).toBe(true);
	});

	it('后移步骤把较大元素右移一位', () => {
		const e = new InsertionSortEngine();
		e.init([5, 2]);
		const moveStep = e.steps.find((s) => s.highlights.some((h) => h.type === 'swap'));
		expect(moveStep).toBeDefined();
		expect(moveStep!.data).toEqual([5, 5]);
	});

	it('已有序数组无需后移，直接插入', () => {
		const e = new InsertionSortEngine();
		e.init([1, 2, 3]);
		const last = e.steps[e.steps.length - 1];
		expect(last.data).toEqual([1, 2, 3]);
	});
});
