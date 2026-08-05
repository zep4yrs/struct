import { describe, it, expect } from 'vitest';
import { IndexEngine, getIndexPresets } from './IndexEngine';

function run(preset: string) {
	const e = new IndexEngine();
	e.init({ preset });
	return e;
}

describe('IndexEngine', () => {
	it('预设列表包含 3 个演示', () => {
		expect(getIndexPresets().map((p) => p.name)).toEqual([
			'等值查找',
			'范围查找',
			'插入（叶分裂）'
		]);
	});

	it('等值查找：初始步揭示整棵树', () => {
		const e = run('等值查找');
		const s0 = e.steps[0];
		expect(s0.btree?.nodes.map((n) => n.id)).toEqual(['root', 'l1', 'l2', 'l3']);
		expect(s0.btree?.edges).toHaveLength(3);
	});

	it('等值查找：根节点包含分隔键', () => {
		const e = run('等值查找');
		const root = e.steps[0].btree?.nodes[0];
		expect(root?.keys).toEqual([20103, 20105]);
		expect(root?.leaf).not.toBe(true);
	});

	it('等值查找：叶子带 leaf 标记用于链表渲染', () => {
		const e = run('等值查找');
		const leaves = e.steps[0].btree?.nodes.filter((n) => n.leaf);
		expect(leaves).toHaveLength(3);
	});

	it('等值查找：命中步高亮目标叶子为 sorted', () => {
		const e = run('等值查找');
		const hit = e.steps[3];
		expect(hit.type).toBe('recurse-exit');
		expect(hit.highlights[0].type).toBe('sorted');
		const l3 = hit.btree?.nodes.find((n) => n.id === 'l3');
		expect(hit.highlights[0].indices).toContain(hit.btree!.nodes.indexOf(l3!));
	});

	it('范围查找：末步描述收集到 20103/20104/20105', () => {
		const e = run('范围查找');
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.description).toContain('20103、20104、20105');
	});

	it('插入分裂：分裂步替换满叶为两个新叶', () => {
		const e = run('插入（叶分裂）');
		const split = e.steps[3];
		expect(split.btree?.nodes.map((n) => n.id).sort()).toEqual(['l1', 'l2', 'l3a', 'l3b', 'root']);
		expect(split.btree?.nodes.find((n) => n.id === 'l3a')?.keys).toEqual([20105, 20106]);
		expect(split.btree?.nodes.find((n) => n.id === 'l3b')?.keys).toEqual([20107, 20108]);
	});

	it('插入分裂：中间键 20107 提升到根', () => {
		const e = run('插入（叶分裂）');
		const s4 = e.steps[4];
		expect(s4.btree?.nodes.find((n) => n.id === 'root2')?.keys).toEqual([20103, 20105, 20107]);
	});

	it('插入分裂：分裂步节点被替换而不是叠加', () => {
		const e = run('插入（叶分裂）');
		const s4 = e.steps[4];
		const ids = s4.btree!.nodes.map((n) => n.id);
		expect(ids).not.toContain('l3');
		expect(ids).not.toContain('root');
		expect(ids).toContain('root2');
	});

	it('面板标题与练习题目', () => {
		const e = run('等值查找');
		expect(e.panelTitle).toBe('查找步骤');
		expect(e.pseudocode).toHaveLength(4);
		expect(e.practiceQuestions).toHaveLength(2);
	});

	it('未知预设回退到第一个', () => {
		const e = run('不存在的演示');
		expect(e.steps.length).toBeGreaterThan(0);
	});
});
