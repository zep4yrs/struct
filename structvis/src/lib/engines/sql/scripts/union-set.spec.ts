/**
 * 集合运算剧本引擎单测 — 校验帧结构与静态帧数据（sql.js 未安装时页面展示的兜底结果）。
 * expected 与 seeds/union-set.sql 的手验数据一致；sql.js 可用时真实执行结果应与之相同。
 */

import { describe, it, expect } from 'vitest';
import { UNION_SET_SPEC } from './union-set';
import { ScriptedResultEngine } from '../ScriptEngine';

/** 复现工厂静态回落路径（node 测试环境无 sql.js） */
function staticEngine(): ScriptedResultEngine {
	const tables = UNION_SET_SPEC.frames.map(
		(f) => ({ columns: f.expected?.columns ?? [], rows: f.expected?.rows ?? [] }) as never
	);
	return new ScriptedResultEngine(UNION_SET_SPEC, tables, false);
}

describe('union-set 剧本', () => {
	const engine = staticEngine();

	it('帧数与阶段引用合法', () => {
		expect(UNION_SET_SPEC.frames.length).toBe(5);
		for (const f of UNION_SET_SPEC.frames) {
			expect(f.stage, `帧「${f.description}」stage 越界`).toBeLessThan(
				UNION_SET_SPEC.stages.length
			);
			expect(f.expected?.rows.length, `帧「${f.description}」expected 无数据`).toBeGreaterThan(0);
		}
	});

	it('终帧小结 = 6 / 2 / 2（容斥：4+4−2 重复）', () => {
		engine.setProgress(engine.totalSteps - 1);
		const t = engine.getCurrentStep().table;
		expect(t?.rows).toEqual([
			['UNION 并集', 6],
			['INTERSECT 交集', 2],
			['EXCEPT 差集', 2]
		]);
	});

	it('UNION 帧行数 = 6 且去重（李四/王五只出现一次）', () => {
		engine.setProgress(1);
		const rows = engine.getCurrentStep().table?.rows ?? [];
		expect(rows).toHaveLength(6);
		const ids = rows.map((r) => r[1]);
		expect(new Set(ids).size).toBe(6);
	});

	it('EXCEPT 方向性：A−B 不含共有学员', () => {
		engine.setProgress(3);
		const rows = engine.getCurrentStep().table?.rows ?? [];
		expect(rows).toEqual([
			['张三', 20101],
			['赵六', 20104]
		]);
	});

	it('集合帧的 expected 列名一致（同构集合才可运算；小结帧除外）', () => {
		const setFrames = UNION_SET_SPEC.frames.filter((f) => f.type !== 'complete');
		const cols = new Set(setFrames.map((f) => (f.expected?.columns ?? []).join(',')));
		expect(cols.size).toBe(1);
	});
});
