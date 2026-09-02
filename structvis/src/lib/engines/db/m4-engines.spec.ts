/**
 * M4 三项过程型主题引擎单测 — IndexQuery / LockGantt / Schedule。
 * 关键帧结构、链路顺序与教学结论的守卫。
 */

import { describe, it, expect } from 'vitest';
import { IndexQueryEngine } from './IndexQueryEngine';
import { LockGanttEngine } from './LockGanttEngine';
import { ScheduleEngine } from './ScheduleEngine';

describe('IndexQueryEngine（索引查询与回表）', () => {
	const e = new IndexQueryEngine();
	e.init();

	it('六个关键帧：init → descend×2 → leaf → back → done', () => {
		expect(e.totalSteps).toBe(6);
		const phases = e.steps.map((s) => s.indexQuery?.phase);
		expect(phases).toEqual(['idle', 'descend', 'descend', 'leaf', 'back', 'done']);
	});

	it('回表帧定位主键 9（王朝），与聚簇行一致', () => {
		e.setProgress(4);
		const d = e.getCurrentStep().indexQuery;
		expect(d?.activeRow).toBe(9);
		expect(d?.backFromNode).toBe('leaf-b');
	});

	it('树结构：根 1 + 叶 2，叶内含王姓条目', () => {
		expect(e.steps[0].indexQuery?.nodes).toHaveLength(3);
		expect(e.steps[0].indexQuery?.edges).toHaveLength(2);
		expect(e.steps[0].indexQuery?.nodes.find((n) => n.id === 'leaf-b')?.label).toContain('王朝');
	});
});

describe('LockGanttEngine（锁等待与死锁）', () => {
	const e = new LockGanttEngine();
	e.init();

	it('六步时间线，第 4 步死锁、第 5 步回滚 T2', () => {
		expect(e.totalSteps).toBe(6);
		e.setProgress(3);
		expect(e.getCurrentStep().gantt?.deadlock).toBe(true);
		e.setProgress(4);
		const spans = e.getCurrentStep().gantt?.lanes[1].spans;
		expect(spans?.at(-1)?.kind).toBe('rollback');
	});

	it('终帧 T1 同时持有 A 与 B', () => {
		e.setProgress(5);
		const holders = e.getCurrentStep().gantt?.resources.map((r) => r.holder);
		expect(holders).toEqual(['T1', 'T1']);
	});
});

describe('ScheduleEngine（可串行化调度）', () => {
	const e = new ScheduleEngine();
	e.init();

	it('操作数与执行帧数一致；冲突对恰 3 组', () => {
		expect(e.totalSteps).toBe(12); // idle + 6 ops + 3 conflicts + serial + done
		const first = e.steps[0].schedule;
		expect(first?.ops).toHaveLength(6);
		expect(first?.conflicts).toEqual([
			[0, 3],
			[1, 2],
			[2, 3]
		]);
	});

	it('完成帧给出等价串行 T1→T2', () => {
		e.setProgress(e.totalSteps - 1);
		const d = e.getCurrentStep().schedule;
		expect(d?.phase).toBe('serial');
		expect(d?.serialOrder).toEqual([0, 2, 4, 5, 1, 3]);
	});

	it('所有冲突对满足「不同事务 + 同资源 + 至少一写」', () => {
		const ops = e.steps[0].schedule?.ops ?? [];
		const res = (id: number) => ops.find((o) => o.id === id)?.label.match(/\((\w)\)/)?.[1];
		const tx = (id: number) => ops.find((o) => o.id === id)?.tx;
		const isWrite = (id: number) => ops.find((o) => o.id === id)?.label.startsWith('W');
		for (const [x, y] of (e.steps[0].schedule?.conflicts ?? []) as [number, number][]) {
			expect(tx(x), `冲突对 ${x}-${y} 同事务`).not.toBe(tx(y));
			expect(res(x), `冲突对 ${x}-${y} 资源不同`).toBe(res(y));
			expect(isWrite(x) || isWrite(y), `冲突对 ${x}-${y} 全读`).toBe(true);
		}
	});
});
