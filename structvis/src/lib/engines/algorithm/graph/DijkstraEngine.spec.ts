import { describe, expect, it } from 'vitest';
import { DijkstraEngine } from '../graph/DijkstraEngine';

describe('DijkstraEngine', () => {
	it('默认图从 0 出发，最终 dist = [0, 8, 9, 5, 7]', () => {
		const e = new DijkstraEngine();
		e.applyPreset('有向图示例');
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([0, 8, 9, 5, 7]);
	});

	it('确定顺序为 0, 3, 4, 1, 2', () => {
		const e = new DijkstraEngine();
		e.applyPreset('有向图示例');
		const settleSteps = e.steps.filter((s) => s.type === 'edge-select');
		const settled = settleSteps.map((s) => {
			const cur = Object.entries(s.graph?.nodeState ?? {}).filter(([, v]) => v === 'current')[0];
			return Number(cur[0]);
		});
		expect(settled).toEqual([0, 3, 4, 1, 2]);
	});

	it('松弛帧：更新 dist 时携带候选状态与 nodeNote', () => {
		const e = new DijkstraEngine();
		e.applyPreset('有向图示例');
		const relax = e.steps.find((s) => s.type === 'edge-candidate')!;
		expect(relax.graph?.edgeState).toBeTruthy();
		expect(relax.graph?.nodeNote?.[1]).toBe('10');
		expect(relax.data).toEqual([0, 10, -1, -1, -1]);
	});

	it('松弛无效帧标为 edge-reject', () => {
		const e = new DijkstraEngine();
		e.applyPreset('有向图示例');
		const reject = e.steps.find((s) => s.type === 'edge-reject');
		expect(reject).toBeTruthy();
	});

	it('完成帧：最短路径树边标为 selected', () => {
		const e = new DijkstraEngine();
		e.applyPreset('有向图示例');
		const last = e.steps[e.steps.length - 1];
		const selectedKeys = Object.keys(last.graph?.edgeState ?? {}).filter(
			(k) => last.graph!.edgeState![Number(k)] === 'selected'
		);
		expect(selectedKeys.length).toBeGreaterThanOrEqual(4); // 4 条最短路径树边
	});

	it('applyCustom：有向图自定义输入可运行', () => {
		const e = new DijkstraEngine();
		e.applyCustom({
			directed: 'true',
			labels: 'A, B, C',
			edges: '0-1:2, 1-2:3, 0-2:8',
			start: '0'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([0, 2, 5]);
	});

	it('applyCustom：无向图自定义输入可运行', () => {
		const e = new DijkstraEngine();
		e.applyCustom({
			directed: 'false',
			labels: 'A, B, C',
			edges: '0-1:2, 1-2:3',
			start: '2'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([5, 3, 0]);
	});

	it('applyCustom：边格式非法时报错', () => {
		const e = new DijkstraEngine();
		expect(() =>
			e.applyCustom({
				directed: 'true',
				labels: 'A, B, C',
				edges: '0-1:2, xyz',
				start: '0'
			})
		).toThrow(/不是有效的带权边/);
	});

	it('applyCustom：源点超出范围时报错', () => {
		const e = new DijkstraEngine();
		expect(() =>
			e.applyCustom({
				directed: 'true',
				labels: 'A, B, C',
				edges: '0-1:2, 1-2:3',
				start: '9'
			})
		).toThrow(/超出范围/);
	});

	it('applyCustom：不可达顶点 dist 保持 -1', () => {
		const e = new DijkstraEngine();
		e.applyCustom({
			directed: 'true',
			labels: 'A, B, C',
			edges: '0-1:2, 1-0:2',
			start: '0'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.data[2]).toBe(-1);
	});

	it('demoScript：四类步骤均有对应台词', () => {
		const e = new DijkstraEngine();
		const types = new Set(e.demoScript.map((d) => d.type));
		for (const t of ['init', 'edge-select', 'edge-candidate', 'edge-reject', 'complete']) {
			expect(types.has(t as never)).toBe(true);
		}
		for (const d of e.demoScript) {
			expect(d.narration.length).toBeGreaterThan(10);
		}
	});
});
