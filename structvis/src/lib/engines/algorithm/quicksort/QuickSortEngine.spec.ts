import { describe, it, expect } from 'vitest';
import { QuickSortEngine } from './QuickSortEngine';

function run(data: number[]): QuickSortEngine {
	const e = new QuickSortEngine();
	e.init(data);
	return e;
}

function highlightsOf(
	step: { highlights: { type: string; indices: number[] }[] },
	type: string
): number[] {
	return step.highlights.find((h) => h.type === type)?.indices ?? [];
}

describe('QuickSortEngine 基本流程', () => {
	it('首帧为 init，数据与输入一致', () => {
		const e = run([6, 2, 8, 5, 1, 9, 3, 7]);
		const first = e.steps[0];
		expect(first.type).toBe('init');
		expect(first.data).toEqual([6, 2, 8, 5, 1, 9, 3, 7]);
		expect(first.recursionDepth).toBe(0);
	});

	it('终态有序且 complete 帧全量 sorted 高亮', () => {
		const e = run([6, 2, 8, 5, 1, 9, 3, 7]);
		const last = e.steps[e.totalSteps - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([1, 2, 3, 5, 6, 7, 8, 9]);
		expect(highlightsOf(last, 'sorted')).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
	});

	it('单元素与两元素数组也能完成排序', () => {
		expect(run([5]).steps.at(-1)?.data).toEqual([5]);
		expect(run([9, 3]).steps.at(-1)?.data).toEqual([3, 9]);
	});

	it('已有序输入：结果保持有序，过程不崩溃', () => {
		const e = run([1, 2, 3, 4]);
		expect(e.steps.at(-1)?.data).toEqual([1, 2, 3, 4]);
	});

	it('步骤 id 连续且类型序列含 pivot-select / partition-start / partition-end', () => {
		const e = run([6, 2, 8, 5, 1, 9, 3, 7]);
		e.steps.forEach((s, i) => expect(s.id).toBe(i));
		const types = new Set(e.steps.map((s) => s.type));
		expect(types.has('pivot-select')).toBe(true);
		expect(types.has('partition-start')).toBe(true);
		expect(types.has('partition-end')).toBe(true);
		expect(types.has('recurse-enter')).toBe(true);
		expect(types.has('recurse-exit')).toBe(true);
		expect(types.has('swap')).toBe(true);
	});
});

describe('QuickSortEngine Lomuto 分区关键帧', () => {
	const data = [6, 2, 8, 5, 1, 9, 3, 7];

	it('pivot-select 帧：pivot 高亮区间最右元素，partition 高亮整个区间', () => {
		const e = run(data);
		const ps = e.steps.find((s) => s.type === 'pivot-select')!;
		expect(highlightsOf(ps, 'pivot')).toEqual([7]);
		expect(highlightsOf(ps, 'partition')).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
	});

	it('partition-start 帧带 pointer-i 与 pointer-j 标注', () => {
		const e = run(data);
		const start = e.steps.find((s) => s.type === 'partition-start')!;
		expect(highlightsOf(start, 'pointer-i').length).toBe(1);
		expect(highlightsOf(start, 'pointer-j')).toEqual([0]);
	});

	it('compare 帧同时高亮 arr[j] 与 pivot', () => {
		const e = run(data);
		const cmp = e.steps.find((s) => s.type === 'compare')!;
		expect(highlightsOf(cmp, 'compare')).toHaveLength(2);
		expect(highlightsOf(cmp, 'compare')[1]).toBe(7);
	});

	it('swap 帧的数据在下一步已实际交换', () => {
		const e = run(data);
		for (let i = 0; i < e.steps.length - 1; i++) {
			const s = e.steps[i];
			if (s.type !== 'swap') continue;
			const [a, b] = highlightsOf(s, 'swap');
			const before = s.data;
			const after = e.steps[i + 1].data;
			expect(after[a]).toBe(before[b]);
			expect(after[b]).toBe(before[a]);
		}
	});

	it('每个 partition-end 帧满足分区不变式：左侧 ≤ pivot < 右侧', () => {
		const e = run(data);
		const ends = e.steps.filter((s) => s.type === 'partition-end');
		expect(ends.length).toBeGreaterThan(0);
		for (const s of ends) {
			const [pos] = highlightsOf(s, 'pivot');
			const d = s.data;
			const pivot = d[pos];
			for (let i = 0; i < pos; i++) expect(d[i]).toBeLessThanOrEqual(pivot);
			for (let i = pos + 1; i < d.length; i++) expect(d[i]).toBeGreaterThan(pivot);
			expect(highlightsOf(s, 'sorted')).toContain(pos);
		}
	});

	it('recurse-enter 深度递增，recurse-exit 深度递减回退', () => {
		const e = run(data);
		let maxDepth = 0;
		let current = 0;
		for (const s of e.steps) {
			if (s.type === 'recurse-enter') {
				current = s.recursionDepth ?? 0;
				maxDepth = Math.max(maxDepth, current);
			} else if (s.type === 'recurse-exit') {
				expect(s.recursionDepth).toBeLessThanOrEqual(current);
			}
		}
		expect(maxDepth).toBeGreaterThan(0);
	});
});

describe('QuickSortEngine 输入与接口', () => {
	it('applyCustom：非法输入被拒绝，合法输入重建步骤', () => {
		const e = new QuickSortEngine();
		expect(() => e.applyCustom({ data: '1, a' })).toThrow(/数字/);
		expect(() => e.applyCustom({ data: '5' })).toThrow(/至少/);
		const before = e.totalSteps;
		e.applyCustom({ data: '9, 4, 7, 2' });
		expect(e.totalSteps).not.toBe(before);
		expect(e.steps[0].data).toEqual([9, 4, 7, 2]);
	});

	it('applyPreset：逆序预设最终有序', () => {
		const e = new QuickSortEngine();
		e.applyPreset('逆序 8 个');
		expect(e.steps.at(-1)?.data).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
	});

	it('练习题的 stepIndex 均在有效范围内', () => {
		const e = run([6, 2, 8, 5, 1, 9, 3, 7]);
		for (const q of e.practiceQuestions) {
			expect(q.stepIndex).toBeGreaterThanOrEqual(0);
			expect(q.stepIndex).toBeLessThan(e.totalSteps);
		}
	});

	it('播放器状态接口：getCurrentStep / getProgress / setProgress / reset', () => {
		const e = run([6, 2, 8, 5, 1, 9, 3, 7]);
		expect(e.getCurrentStep().id).toBe(0);
		e.setProgress(3);
		expect(e.getProgress()).toBe(3);
		expect(e.getCurrentStep().id).toBe(3);
		e.setProgress(e.totalSteps + 5);
		expect(e.getProgress()).toBeLessThanOrEqual(e.totalSteps);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});

	it('伪代码行号均在合法范围内', () => {
		const e = run([6, 2, 8, 5, 1, 9, 3, 7]);
		for (const s of e.steps) {
			expect(s.pseudocodeLine).toBeGreaterThanOrEqual(0);
			expect(s.pseudocodeLine).toBeLessThan(e.pseudocode.length);
		}
	});
});
