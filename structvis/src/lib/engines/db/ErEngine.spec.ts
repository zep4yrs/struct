import { describe, it, expect } from 'vitest';
import { ErEngine, getErPresets } from './ErEngine';

function run(preset: string) {
	const e = new ErEngine();
	e.init({ preset });
	return e;
}

describe('ErEngine', () => {
	it('预设列表包含 3 个模型', () => {
		expect(getErPresets().map((p) => p.name)).toEqual(['学生选课', '班级-学生', '系-系主任']);
	});

	it('增量揭示：第 0 步只有两个实体', () => {
		const e = run('学生选课');
		const s0 = e.steps[0];
		expect(s0.er?.nodes.map((n) => n.type)).toEqual(['entity', 'entity']);
		expect(s0.er?.edges).toHaveLength(0);
	});

	it('属性揭示：第 1 步加入学生属性并高亮', () => {
		const e = run('学生选课');
		const s1 = e.steps[1];
		expect(s1.er?.nodes).toHaveLength(5);
		expect(s1.highlights[0].type).toBe('current');
		expect(s1.highlights[0].indices).toHaveLength(3);
	});

	it('基数标注：第 4 步出现 m/n 标签', () => {
		const e = run('学生选课');
		const s4 = e.steps[4];
		const labels = s4.er?.edges.filter((x) => x.label).map((x) => x.label);
		expect(labels).toEqual(['m', 'n']);
	});

	it('转换：末步包含 3 个关系模式节点（m:n 联系独立建表）', () => {
		const e = run('学生选课');
		const last = e.steps[e.steps.length - 1];
		const rels = last.er?.nodes.filter((n) => n.type === 'relation');
		expect(rels).toHaveLength(3);
		expect(rels?.[2].fields).toEqual(['学号', '课程号', '成绩']);
	});

	it('1:n 预设：N 端并入 1 端主键作为外键', () => {
		const e = run('班级-学生');
		const last = e.steps[e.steps.length - 1];
		const rels = last.er?.nodes.filter((n) => n.type === 'relation');
		expect(rels?.[1].fields).toEqual(['学号', '姓名', '性别', '班级号']);
	});

	it('1:1 预设：联系两端基数均为 1', () => {
		const e = run('系-系主任');
		const s3 = e.steps[3];
		expect(s3.er?.edges.filter((x) => x.label).map((x) => x.label)).toEqual(['1', '1']);
	});

	it('面板标题与伪代码', () => {
		const e = run('学生选课');
		expect(e.panelTitle).toBe('设计步骤');
		expect(e.pseudocode).toHaveLength(6);
	});

	it('未知预设回退到第一个', () => {
		const e = run('不存在的模型');
		expect(e.steps.length).toBeGreaterThan(0);
	});
});
