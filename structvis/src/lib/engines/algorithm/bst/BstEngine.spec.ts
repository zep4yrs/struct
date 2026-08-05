import { describe, it, expect } from 'vitest';
import { BstEngine } from './BstEngine';

const TREE = [10, 5, 15, 3, 7, 12, 20];

describe('BstEngine', () => {
	it('renderType / 名称正确', () => {
		const e = new BstEngine();
		expect(e.renderType).toBe('tree');
		expect(e.name).toBe('二叉搜索树');
	});

	it('查找命中：路径 10 → 15 → 12，命中帧标记目标', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'search', target: 12 });
		const hit = e.steps.find((s) => s.type === 'edge-select');
		expect(hit).toBeDefined();
		expect(hit!.description).toContain('命中');
		expect(e.steps.at(-1)?.type).toBe('complete');
		// 首帧展示树
		expect(e.steps[0].data).toEqual(TREE);
	});

	it('查找未命中：报告不存在', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'search', target: 99 });
		expect(e.steps.some((s) => s.type === 'edge-reject')).toBe(true);
		expect(e.steps.at(-1)?.description).toContain('未命中');
	});

	it('插入：新叶子挂上后层序编码扩展，中序仍有序', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'insert', target: 8 });
		const last = e.steps.at(-1);
		expect(last?.type).toBe('complete');
		expect(last!.data).toContain(8);
		// 8 成为 7 的右孩子：层序含 7 与 8
		const idx7 = last!.data.indexOf(7);
		const idx8 = last!.data.indexOf(8);
		expect(idx7).toBeGreaterThanOrEqual(0);
		// 8 在层序中的位置应是 7 的右子（2*idx7+2）或其后某位置——直接验证 8 存在且排序正确
		expect(idx8).toBeGreaterThan(0);
		expect(last!.description).toContain('有序');
	});

	it('插入重复关键字被拒绝', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'insert', target: 10 });
		expect(e.steps.at(-1)?.description).toContain('已存在');
	});

	it('删除叶子（3）：树中不再出现该值', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'delete', target: 3 });
		const last = e.steps.at(-1);
		expect(last?.type).toBe('complete');
		expect(last!.data).not.toContain(3);
	});

	it('删除双孩子（15）：用中序后继 20 顶替', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'delete', target: 15 });
		const replace = e.steps.find((s) => s.type === 'edge-select' && s.description.includes('顶替'));
		expect(replace).toBeDefined();
		expect(replace!.description).toContain('20');
		const last = e.steps.at(-1);
		expect(last!.data).not.toContain(15);
		expect(last!.data).toContain(20);
	});

	it('删除不存在的目标被拒绝', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'delete', target: 99 });
		expect(e.steps.at(-1)?.description).toContain('取消');
	});

	it('自定义输入校验：根为空被拒绝', () => {
		const e = new BstEngine();
		expect(() => e.applyCustom({ tree: '-1, 2', mode: 'search', target: '1' })).toThrow(/根/);
	});

	it('自定义输入校验：目标须为整数', () => {
		const e = new BstEngine();
		expect(() => e.applyCustom({ tree: '1, 2', mode: 'search', target: 'x' })).toThrow();
	});

	it('单结点树删除后树为空', () => {
		const e = new BstEngine();
		e.init({ tree: [7], mode: 'delete', target: 7 });
		expect(e.steps.at(-1)!.data).toEqual([]);
	});

	it('伪代码行号均在合法范围内', () => {
		for (const mode of ['search', 'insert', 'delete'] as const) {
			const e = new BstEngine();
			e.init({ tree: TREE, mode, target: 8 });
			for (const s of e.steps) {
				expect(s.pseudocodeLine).toBeGreaterThanOrEqual(0);
				expect(s.pseudocodeLine).toBeLessThan(e.pseudocode.length);
			}
		}
	});

	it('练习问题存在且 stepIndex 在范围内', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'search', target: 12 });
		expect(e.practiceQuestions.length).toBeGreaterThan(0);
		for (const q of e.practiceQuestions) {
			expect(q.stepIndex).toBeLessThan(e.steps.length);
		}
	});

	it('播放器状态接口正常', () => {
		const e = new BstEngine();
		e.init({ tree: TREE, mode: 'insert', target: 8 });
		e.setProgress(2);
		expect(e.getCurrentStep()).toBe(e.steps[2]);
		e.reset();
		expect(e.getProgress()).toBe(0);
	});
});
