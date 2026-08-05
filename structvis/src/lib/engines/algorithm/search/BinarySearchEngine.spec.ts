import { describe, it, expect } from 'vitest';
import { BinarySearchEngine } from './BinarySearchEngine';

describe('BinarySearchEngine', () => {
	it('renderType / 名称正确', () => {
		const e = new BinarySearchEngine();
		expect(e.renderType).toBe('array');
		expect(e.name).toBe('二分查找');
	});

	it('11 元素表查找命中目标 21：经过 3 次比较，步骤记录完整', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92], target: 21 });
		expect(e.steps.length).toBe(8);
		// 第一次比较取中点 56
		const first = e.steps[1];
		expect(first.description).toContain('56');
		// 命中步骤
		const hitIdx = e.steps.findIndex((s) => s.type === 'edge-select');
		expect(hitIdx).toBeGreaterThanOrEqual(0);
		expect(e.steps[hitIdx].description).toContain('位置 4');
		// 完成步
		const done = e.steps[e.steps.length - 1];
		expect(done.type).toBe('complete');
		expect(done.description).toContain('成功');
	});

	it('查找不存在的目标 90：区间收缩到空，报告失败', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92], target: 90 });
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.description).toContain('失败');
		// 有区间为空的标记步
		expect(e.steps.some((s) => s.type === 'recurse-exit')).toBe(true);
	});

	it('单元素表：命中即完成', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [42], target: 42 });
		expect(e.steps.some((s) => s.type === 'edge-select')).toBe(true);
		expect(e.steps.at(-1)?.type).toBe('complete');
	});

	it('单元素表：不命中则失败', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [42], target: 1 });
		expect(e.steps.some((s) => s.type === 'edge-select')).toBe(false);
		expect(e.steps.at(-1)?.description).toContain('失败');
	});

	it('自定义输入校验：非升序序列被拒绝', () => {
		const e = new BinarySearchEngine();
		expect(() => e.applyCustom({ data: '5, 2, 8', target: '5' })).toThrow(/升序/);
	});

	it('自定义输入校验：目标值须为整数', () => {
		const e = new BinarySearchEngine();
		expect(() => e.applyCustom({ data: '1, 2, 3', target: 'abc' })).toThrow();
	});

	it('自定义输入执行成功', () => {
		const e = new BinarySearchEngine();
		e.applyCustom({ data: '1, 3, 5, 7, 9', target: '7' });
		expect(e.steps.at(-1)?.description).toContain('成功');
	});

	it('预设：失败示例用不存在目标', () => {
		const e = new BinarySearchEngine();
		e.applyPreset('示例（失败）');
		expect(e.steps.at(-1)?.description).toContain('失败');
	});

	it('播放器状态接口正常', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [1, 2, 3, 4, 5], target: 3 });
		e.setProgress(e.steps.length - 1);
		expect(e.getProgress()).toBe(e.steps.length - 1);
		expect(e.getCurrentStep()).toBe(e.steps[e.steps.length - 1]);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});

	it('伪代码行号均在合法范围内', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [5, 13, 19, 21, 37, 56], target: 21 });
		for (const s of e.steps) {
			expect(s.pseudocodeLine).toBeGreaterThanOrEqual(0);
			expect(s.pseudocodeLine).toBeLessThan(e.pseudocode.length);
		}
	});

	it('练习问题存在且 stepIndex 指向命中/完成步', () => {
		const e = new BinarySearchEngine();
		e.init({ data: [5, 13, 19, 21, 37, 56, 64, 75, 80, 88, 92], target: 21 });
		expect(e.practiceQuestions.length).toBeGreaterThan(0);
		for (const q of e.practiceQuestions) {
			expect(q.stepIndex).toBeLessThan(e.steps.length);
		}
	});
});
