/**
 * IsolationEngine 特征守卫（M3.6：保留者补 spec）。
 * 该引擎是保留清单中唯一无测试者——迁移期间作为「保留改造」的基线行为锚点。
 */

import { describe, it, expect } from 'vitest';
import { IsolationEngine } from './IsolationEngine';

describe('IsolationEngine（事务隔离级别）', () => {
	const e = new IsolationEngine();
	e.init();

	it('生成非空步序，全部为 sql-table 负载', () => {
		expect(e.totalSteps).toBeGreaterThan(0);
		expect(e.renderType).toBe('sql-table');
		for (const s of e.steps) {
			expect(s.table, `步骤 ${s.id} 缺表格快照`).toBeDefined();
			expect(s.table?.columns.length, `步骤 ${s.id} 表格无列`).toBeGreaterThan(0);
			expect(s.description.length).toBeGreaterThan(0);
		}
	});

	it('叙事覆盖脏读 → 回滚恢复 → 读已提交对照的关键转折', () => {
		const text = e.steps.map((s) => s.description).join(' ');
		expect(text).toContain('T1 UPDATE');
		expect(text).toContain('ROLLBACK');
		expect(text).toContain('COMMIT');
	});

	it('演示脚本七步：T1 改 → T2 脏读 → T1 回滚 → 重试 → T2 再读 → T1 提交 → 总结', () => {
		const labels = e.steps.map((s) => s.table?.columns.join(','));
		expect(new Set(labels).size).toBeGreaterThanOrEqual(1);
		expect(e.steps.length).toBeGreaterThanOrEqual(7);
	});

	it('preset 重复应用幂等（步数一致）', () => {
		const before = e.totalSteps;
		e.applyPreset('脏读演示');
		expect(e.totalSteps).toBe(before);
		e.applyCustom();
		expect(e.totalSteps).toBe(before);
	});

	it('进度夹取：越界不穿透', () => {
		e.setProgress(999);
		expect(e.getProgress()).toBeLessThan(e.totalSteps);
		const s = e.getCurrentStep();
		expect(s).toBeDefined();
		e.reset();
		expect(e.getProgress()).toBe(0);
	});
});
