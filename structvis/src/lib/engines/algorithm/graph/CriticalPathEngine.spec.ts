import { describe, expect, it } from 'vitest';
import { CriticalPathEngine } from '../graph/CriticalPathEngine';

describe('CriticalPathEngine', () => {
	it('默认图关键活动为 0→1, 1→3, 3→5', () => {
		const e = new CriticalPathEngine();
		e.applyPreset('教材示例 AOE');
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([0, 2, 5]);
	});

	it('完成帧描述含总工期 9', () => {
		const e = new CriticalPathEngine();
		e.applyPreset('教材示例 AOE');
		const last = e.steps[e.steps.length - 1];
		expect(last.description).toMatch(/总工期 9/);
		expect(last.description).toMatch(/0 → 1 → 3 → 5/);
	});

	it('关键活动标 selected，非关键活动标 tried', () => {
		const e = new CriticalPathEngine();
		e.applyPreset('教材示例 AOE');
		const last = e.steps[e.steps.length - 1];
		expect(last.graph?.edgeState?.[0]).toBe('selected');
		expect(last.graph?.edgeState?.[5]).toBe('selected');
		expect(last.graph?.edgeState?.[1]).toBe('tried');
		expect(last.graph?.edgeState?.[6]).toBe('tried');
	});

	it('vl 阶段 nodeNote 为 ve/vl 格式', () => {
		const e = new CriticalPathEngine();
		e.applyPreset('教材示例 AOE');
		const vlStep = e.steps.find((s) => s.description.startsWith('最晚发生时间'))!;
		const note = vlStep.graph?.nodeNote ?? {};
		expect(Object.values(note).some((v) => v.includes('/'))).toBe(true);
	});

	it('汇点 vl = ve = 9', () => {
		const e = new CriticalPathEngine();
		e.applyPreset('教材示例 AOE');
		const vlStep = e.steps.find((s) => s.description.includes('汇点'))!;
		expect(vlStep.description).toMatch(/9/);
		expect(vlStep.graph?.nodeNote?.[5]).toBe('9/9');
	});

	it('判定帧：e ≠ l 的活动描述含可延误时长', () => {
		const e = new CriticalPathEngine();
		e.applyPreset('教材示例 AOE');
		const reject = e.steps.find((s) => s.type === 'edge-reject')!;
		expect(reject.description).toMatch(/可延误 3/); // 0→2 可延误 3
	});

	it('环图：失败帧说明存在环', () => {
		const e = new CriticalPathEngine();
		e.applyCustom({
			labels: '0, 1, 2',
			edges: '0-1:1, 1-2:1, 2-0:1'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.description).toMatch(/存在环/);
	});

	it('applyCustom：活动格式非法时报错', () => {
		const e = new CriticalPathEngine();
		expect(() =>
			e.applyCustom({
				labels: '0, 1, 2',
				edges: '0-1:1, 1-2'
			})
		).toThrow(/不是有效的带权边/);
	});

	it('applyCustom：活动编号超出范围时报错', () => {
		const e = new CriticalPathEngine();
		expect(() =>
			e.applyCustom({
				labels: '0, 1, 2',
				edges: '0-1:1, 1-2:2, 2-9:1'
			})
		).toThrow(/超出节点范围/);
	});

	it('applyCustom：合法 AOE 可运行，data 为关键活动索引', () => {
		const e = new CriticalPathEngine();
		e.applyCustom({
			labels: 'A, B, C, D',
			edges: '0-1:5, 1-2:3, 0-2:9'
		});
		const last = e.steps[e.steps.length - 1];
		expect(last.type).toBe('complete');
		expect(last.data).toEqual([2]); // 0→2 直达 9 长于 0→1→2 的 8
		expect(last.description).toMatch(/总工期 9/);
	});

	it('demoScript：产生的每类步骤均有旁白', () => {
		const e = new CriticalPathEngine();
		const types = new Set(e.demoScript.map((d) => d.type));
		for (const t of ['init', 'edge-candidate', 'edge-select', 'edge-reject', 'complete']) {
			expect(types.has(t as never)).toBe(true);
		}
		for (const d of e.demoScript) {
			expect(d.narration.length).toBeGreaterThan(10);
		}
	});
});
