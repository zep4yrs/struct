import { describe, expect, it } from 'vitest';
import { TopoSortEngine } from '../graph/TopoSortEngine';

describe('TopoSortEngine', () => {
	it('默认图拓扑序列为 0, 1, 2, 3, 4, 5', () => {
		const e = new TopoSortEngine();
		e.applyPreset('教材示例 DAG');
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([0, 1, 2, 3, 4, 5]);
	});

	it('init 帧携带入度标注（nodeNote）', () => {
		const e = new TopoSortEngine();
		e.applyPreset('教材示例 DAG');
		const init = e.steps[0];
		expect(init.type).toBe('init');
		expect(init.graph?.nodeNote?.[4]).toBe('in=2');
		expect(init.graph?.nodeNote?.[0]).toBe('in=0');
	});

	it('输出顶点帧标 current，已输出顶点标 done', () => {
		const e = new TopoSortEngine();
		e.applyPreset('教材示例 DAG');
		const select = e.steps.find((s) => s.type === 'edge-select')!;
		expect(select.graph?.nodeState?.[0]).toBe('current');
		const done = e.steps[e.steps.length - 1];
		expect(done.graph?.nodeState?.[0]).toBe('done');
		expect(done.graph?.nodeState?.[5]).toBe('done');
	});

	it('入度为 0 的顶点在候选帧标 frontier', () => {
		const e = new TopoSortEngine();
		e.applyPreset('教材示例 DAG');
		const cand = e.steps.find((s) => s.type === 'edge-candidate')!;
		const frontierKeys = Object.keys(cand.graph?.nodeState ?? {}).filter(
			(k) => cand.graph!.nodeState![Number(k)] === 'frontier'
		);
		expect(frontierKeys.map(Number).sort((a, b) => a - b)).toEqual([0]);
	});

	it('序列逐步增长且不重复', () => {
		const e = new TopoSortEngine();
		e.applyPreset('教材示例 DAG');
		const seqs = e.steps.filter((s) => s.type === 'edge-select').map((s) => s.data);
		for (let i = 0; i < seqs.length - 1; i++) {
			expect(seqs[i].length).toBe(i + 1);
		}
		const final = seqs[seqs.length - 1];
		expect(new Set(final).size).toBe(final.length);
	});

	it('环检测：环图报错并产生 edge-reject 帧', () => {
		const e = new TopoSortEngine();
		e.applyCustom({
			labels: '0, 1, 2, 3',
			edges: '0-1, 1-2, 2-1, 0-3'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.description).toMatch(/存在环/);
		expect(e.steps.some((s) => s.type === 'edge-reject')).toBe(true);
	});

	it('applyCustom：边编号超出范围时报错', () => {
		const e = new TopoSortEngine();
		expect(() =>
			e.applyCustom({
				labels: '0, 1, 2',
				edges: '0-1, 1-5'
			})
		).toThrow(/超出节点范围/);
	});

	it('applyCustom：自环报错', () => {
		const e = new TopoSortEngine();
		expect(() =>
			e.applyCustom({
				labels: '0, 1, 2',
				edges: '0-0, 0-1'
			})
		).toThrow(/同一个顶点/);
	});

	it('applyCustom：合法无环图可运行且序列包含全部顶点', () => {
		const e = new TopoSortEngine();
		e.applyCustom({
			labels: 'A, B, C, D',
			edges: '0-2, 2-3, 1-3'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toHaveLength(4);
	});

	it('demoScript：产生的每类步骤均有旁白', () => {
		const e = new TopoSortEngine();
		const types = new Set(e.demoScript.map((d) => d.type));
		for (const t of ['init', 'edge-candidate', 'edge-select', 'complete']) {
			expect(types.has(t as never)).toBe(true);
		}
		for (const d of e.demoScript) {
			expect(d.narration.length).toBeGreaterThan(10);
		}
	});

	it('伪代码与练习不为空', () => {
		const e = new TopoSortEngine();
		e.applyPreset('教材示例 DAG');
		expect(e.pseudocode.length).toBeGreaterThan(5);
		expect(e.practiceQuestions.length).toBeGreaterThan(0);
	});
});
