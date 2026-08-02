import { describe, it, expect } from 'vitest';
import { NormalizeEngine, getNormalizePresets } from './NormalizeEngine';

function run(preset: string) {
	const e = new NormalizeEngine();
	e.init({ preset });
	return e;
}

describe('NormalizeEngine', () => {
	it('预设列表包含 3 个示例', () => {
		expect(getNormalizePresets().map((p) => p.name)).toEqual([
			'部分依赖 → 2NF',
			'传递依赖 → 3NF',
			'3NF 但非 BCNF'
		]);
	});

	it('部分依赖判定步描述命中 2NF 检查', () => {
		const e = run('部分依赖 → 2NF');
		const s2 = e.steps[2];
		expect(s2.description).toContain('部分依赖');
		expect(s2.highlights.some((h) => h.type === 'pivot')).toBe(false);
	});

	it('结论步把违规依赖标红（pivot）', () => {
		const e = run('部分依赖 → 2NF');
		const s5 = e.steps[5];
		expect(s5.highlights).toEqual([{ type: 'pivot', indices: [1, 2] }]);
	});

	it('分解结果包含两个新关系，违规依赖随后变绿', () => {
		const e = run('部分依赖 → 2NF');
		const s6 = e.steps[6];
		const rels = s6.er?.nodes.filter((n) => n.type === 'relation');
		expect(rels).toHaveLength(3);
		expect(rels?.[1].fields).toEqual(['学号', '姓名', '专业']);
		expect(rels?.[2].fields).toEqual(['学号', '课程号', '成绩']);
		const s7 = e.steps[7];
		expect(s7.highlights).toEqual([{ type: 'sorted', indices: [1, 2] }]);
	});

	it('传递依赖预设：结论步判定不满足 3NF', () => {
		const e = run('传递依赖 → 3NF');
		const s5 = e.steps[5];
		expect(s5.description).toContain('不满足 3NF');
		expect(s5.highlights).toEqual([{ type: 'pivot', indices: [2, 3] }]);
	});

	it('BCNF 预设：违规判定后分解到 BCNF', () => {
		const e = run('3NF 但非 BCNF');
		const s4 = e.steps[4];
		expect(s4.description).toContain('BCNF');
		expect(s4.description).toContain('超键');
		const last = e.steps[e.steps.length - 1];
		expect(last.description).toContain('BCNF');
	});

	it('面板标题与伪代码', () => {
		const e = run('3NF 但非 BCNF');
		expect(e.panelTitle).toBe('判定步骤');
		expect(e.pseudocode).toHaveLength(5);
	});
});
