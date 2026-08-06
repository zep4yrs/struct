import { describe, it, expect } from 'vitest';
import { TransactionEngine, TX_PRESETS } from './TransactionEngine';
import type { SqlTable } from '../sql/SelectEngine';

const ACCOUNT_TABLE: SqlTable = {
	columns: ['账户', '余额'],
	rows: [
		['A', 1000],
		['B', 1000]
	]
};

const TABLES = { 账户: ACCOUNT_TABLE };

function run(mode: string) {
	const e = new TransactionEngine();
	e.init({ mode, tables: TABLES });
	return e;
}

describe('TransactionEngine', () => {
	it('契约：renderType / presets / practiceQuestions / customConfig', () => {
		const e = run('commit');
		expect(e.renderType).toBe('sql-table');
		expect(e.name).toBe('事务与并发控制');
		expect(e.presets.map((p) => p.name)).toEqual(TX_PRESETS.map((p) => p.name));
		expect(e.practiceQuestions.length).toBe(3);
		expect(e.customConfig.fields[0].key).toBe('mode');
	});

	it('未知模式报错', () => {
		expect(() => run('bogus')).toThrow('未知演示模式');
		expect(() => {
			const e = new TransactionEngine();
			e.applyCustom({ mode: '' });
		}).toThrow('演示模式不能为空');
	});

	it('commit：A 扣 100、B 加 100，终态 Σ 守恒', () => {
		const e = run('commit');
		const last = e.steps[e.steps.length - 1].table;
		const rowA = last?.rows.find((r) => r[0] === 'A');
		const rowB = last?.rows.find((r) => r[0] === 'B');
		expect(rowA?.[1]).toBe(900);
		expect(rowB?.[1]).toBe(1100);
		expect(e.steps[e.steps.length - 1].type).toBe('complete');
	});

	it('commit：步骤链含 BEGIN / 一致性检查 / COMMIT', () => {
		const e = run('commit');
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('BEGIN');
		expect(joined).toContain('一致性检查');
		expect(joined).toContain('COMMIT');
	});

	it('rollback：终态与初始一致，步骤含 undo 与 ROLLBACK', () => {
		const e = run('rollback');
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows[0][1]).toBe(1000);
		expect(last?.rows[1][1]).toBe(1000);
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('undo');
		expect(joined).toContain('ROLLBACK');
	});

	it('rollback：A 先被扣到 900（未提交），回滚后恢复', () => {
		const e = run('rollback');
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('900');
		expect(joined).toContain('撤销全部修改');
	});

	it('lost-update：A 终态 800（T2 覆盖 T1），步骤含丢失更新结论', () => {
		const e = run('lost-update');
		const last = e.steps[e.steps.length - 1].table;
		expect(last?.rows[0][1]).toBe(800);
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('覆盖');
		expect(joined).toContain('丢失');
	});

	it('lost-update：步骤链 T1 读 → T2 读 → T1 写 → T2 写 → 结论', () => {
		const e = run('lost-update');
		const joined = e.steps.map((s) => s.description).join('\n');
		expect(joined).toContain('T1 开始');
		expect(joined).toContain('T2 开始');
		expect(joined).toContain('T1 写');
		expect(joined).toContain('T2 写');
	});

	it('applyPreset 重建', () => {
		const e = new TransactionEngine();
		e.init({ mode: 'commit', tables: TABLES });
		e.applyPreset('转账失败回滚（原子性）');
		expect(e.steps.length).toBeGreaterThan(4);
	});
});
