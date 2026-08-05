import { describe, it, expect } from 'vitest';
import { KMPEngine } from './KMPEngine';

describe('KMPEngine', () => {
	it('renderType / 名称正确', () => {
		const e = new KMPEngine();
		expect(e.renderType).toBe('kmp');
		expect(e.name).toBe('串的模式匹配');
	});

	it('教材示例命中：next 数组 = 0,1,1,2,2,3,1,2，匹配位置 6（1-based）', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		expect(e.totalSteps).toBe(50);
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.kmp?.phase).toBe('found');
		expect(last.description).toContain('位置 6');
		// 完成帧：模式对齐起始 5（0-based），j = m - 1
		expect(last.kmp?.i).toBe(5);
		expect(last.kmp?.j).toBe(7);
		// next 数组（1-based 记法，下标 0 占位）
		expect(last.kmp?.next).toEqual([0, 0, 1, 1, 2, 2, 3, 1, 2]);
	});

	it('两阶段齐备：既有求 next（buildNext）帧，也有匹配帧', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		expect(e.steps.some((s) => s.kmp?.buildNext)).toBe(true);
		expect(e.steps.some((s) => !s.kmp?.buildNext)).toBe(true);
	});

	it('next[4] = 2 在求 next 阶段被写入并高亮', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		const frame = e.steps.find((s) => s.kmp?.nextIndex === 4);
		expect(frame).toBeDefined();
		expect(frame!.kmp?.next[4]).toBe(2);
		expect(frame!.kmp?.buildNext).toBe(true);
	});

	it('匹配阶段文本指针 i 单调不回退', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		let prev = -1;
		for (const s of e.steps) {
			const f = s.kmp;
			if (!f || f.buildNext || f.phase === 'found' || f.phase === 'failed') continue;
			expect(f.i).toBeGreaterThanOrEqual(prev);
			prev = f.i;
		}
	});

	it('模式不出现时报告失败', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abab' });
		expect(e.steps.at(-1)?.kmp?.phase).toBe('failed');
		expect(e.steps.at(-1)?.description).toContain('失败');
	});

	it('自定义输入校验：空串 / 模式长于文本 / 含空格均被拒绝', () => {
		const e = new KMPEngine();
		expect(() => e.applyCustom({ text: '', pattern: 'ab' })).toThrow(/文本/);
		expect(() => e.applyCustom({ text: 'ab', pattern: 'abc' })).toThrow(/模式/);
		expect(() => e.applyCustom({ text: 'a b', pattern: 'ab' })).toThrow(/空格/);
	});

	it('自定义输入执行成功并命中', () => {
		const e = new KMPEngine();
		e.applyCustom({ text: 'abababac', pattern: 'abab' });
		expect(e.steps.at(-1)?.kmp?.phase).toBe('found');
	});

	it('伪代码行号均在合法范围内', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		for (const s of e.steps) {
			expect(s.pseudocodeLine).toBeGreaterThanOrEqual(0);
			expect(s.pseudocodeLine).toBeLessThan(e.pseudocode.length);
		}
	});

	it('练习问题存在且 stepIndex 指向合理步', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		expect(e.practiceQuestions.length).toBeGreaterThan(0);
		for (const q of e.practiceQuestions) {
			expect(q.stepIndex).toBeGreaterThan(0);
			expect(q.stepIndex).toBeLessThan(e.steps.length);
		}
	});

	it('播放器状态接口正常', () => {
		const e = new KMPEngine();
		e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
		e.setProgress(10);
		expect(e.getProgress()).toBe(10);
		expect(e.getCurrentStep()).toBe(e.steps[10]);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});
});
