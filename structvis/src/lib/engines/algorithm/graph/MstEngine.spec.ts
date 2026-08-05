import { describe, expect, it } from 'vitest';
import { MstEngine } from '../graph/MstEngine';

const PRESET_LABELS = ['0', '1', '2', '3', '4'];
const PRESET_EDGES: [number, number, number][] = [
	[0, 1, 2],
	[0, 3, 6],
	[1, 2, 3],
	[1, 3, 8],
	[1, 4, 5],
	[2, 4, 7],
	[3, 4, 9]
];

function selectedTotal(engine: MstEngine): number {
	const last = engine.steps[engine.steps.length - 1];
	const weightMap = engine.steps[0].graph?.edges ?? [];
	const sum = last.data.reduce((acc, ei) => acc + (weightMap[ei]?.weight ?? 0), 0);
	return sum;
}

describe('MstEngine', () => {
	it('Prim：默认图从 0 出发生成树，总权为 16', () => {
		const e = new MstEngine();
		e.applyPreset('普里姆 Prim');
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toHaveLength(4); // n-1 条边
		expect(selectedTotal(e)).toBe(16);
	});

	it('Prim：选边顺序为 0-1, 1-2, 1-4, 0-3', () => {
		const e = new MstEngine();
		e.applyPreset('普里姆 Prim');
		const edges = e.steps[0].graph?.edges ?? [];
		const selected = e.steps[e.steps.length - 1].data.map((ei) => {
			const ed = edges[ei];
			return [ed.from, ed.to];
		});
		expect(selected).toEqual([
			[0, 1],
			[1, 2],
			[1, 4],
			[0, 3]
		]);
	});

	it('Kruskal：同图生成树总权一致为 16，且跳过成环边', () => {
		const e = new MstEngine();
		e.applyPreset('克鲁斯卡尔 Kruskal');
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(selectedTotal(e)).toBe(16);
		const rejectSteps = e.steps.filter((s) => s.type === 'edge-reject');
		expect(rejectSteps.length).toBe(3); // 2-4, 1-3, 3-4
	});

	it('Kruskal：被跳过的边在快照中标为 tried', () => {
		const e = new MstEngine();
		e.applyPreset('克鲁斯卡尔 Kruskal');
		const reject = e.steps.find((s) => s.type === 'edge-reject')!;
		const triedKeys = Object.keys(reject.graph?.edgeState ?? {}).filter(
			(k) => reject.graph!.edgeState![Number(k)] === 'tried'
		);
		expect(triedKeys.length).toBeGreaterThanOrEqual(1);
	});

	it('Prim：选中的边在完成帧中全部标为 selected', () => {
		const e = new MstEngine();
		e.applyPreset('普里姆 Prim');
		const last = e.steps[e.steps.length - 1];
		const selected = last.data;
		for (const ei of selected) {
			expect(last.graph?.edgeState?.[ei]).toBe('selected');
		}
	});

	it('applyCustom：图不连通时报错', () => {
		const e = new MstEngine();
		expect(() =>
			e.applyCustom({
				mode: 'prim',
				labels: '0, 1, 2, 3',
				edges: '0-1:1, 1-2:1, 0-2:1',
				start: '0'
			})
		).toThrow(/不连通/);
	});

	it('applyCustom：带权边格式非法时报错', () => {
		const e = new MstEngine();
		expect(() =>
			e.applyCustom({
				mode: 'prim',
				labels: '0, 1, 2',
				edges: '0-1:1, 1-2',
				start: '0'
			})
		).toThrow(/不是有效的带权边/);
	});

	it('applyCustom：起点超出范围时报错', () => {
		const e = new MstEngine();
		expect(() =>
			e.applyCustom({
				mode: 'prim',
				labels: '0, 1, 2',
				edges: '0-1:1, 1-2:2',
				start: '5'
			})
		).toThrow(/超出范围/);
	});

	it('Prim：候选边帧展示候选集（frontier 端点）', () => {
		const e = new MstEngine();
		e.applyPreset('普里姆 Prim');
		const cand = e.steps.find((s) => s.type === 'edge-candidate')!;
		expect(Object.values(cand.graph?.nodeState ?? {}).length).toBeGreaterThan(0);
		expect(cand.graph?.nodeState?.[1]).toBe('frontier');
	});

	it('demoScript：五类步骤均有对应台词', () => {
		const e = new MstEngine();
		const types = new Set(e.demoScript.map((d) => d.type));
		for (const t of ['init', 'edge-candidate', 'edge-select', 'edge-reject', 'complete']) {
			expect(types.has(t as never)).toBe(true);
		}
		for (const d of e.demoScript) {
			expect(d.narration.length).toBeGreaterThan(10);
		}
	});

	it('applyCustom：自定义图可运行且结果合法', () => {
		const e = new MstEngine();
		e.applyCustom({
			mode: 'kruskal',
			labels: 'A, B, C, D',
			edges: '0-1:1, 1-2:2, 2-3:3, 0-3:5',
			start: '0'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toHaveLength(3);
	});

	it('applyPreset：Prim 伪代码行数与 Kruskal 不同', () => {
		const prim = new MstEngine();
		prim.applyPreset('普里姆 Prim');
		const krus = new MstEngine();
		krus.applyPreset('克鲁斯卡尔 Kruskal');
		expect(prim.pseudocode).not.toEqual(krus.pseudocode);
	});
});
