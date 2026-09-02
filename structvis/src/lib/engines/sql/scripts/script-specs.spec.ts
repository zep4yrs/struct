/**
 * M2 剧本主题通用守卫 — 所有 ScriptSpec 的结构/教学完整性检查（数据驱动，
 * 新主题在 SPECS 登记一行即自动纳入）+ 各主题关键预期值抽查。
 * expected 表为 sql.js 未安装时页面展示的静态帧，必须与真实执行结果一致。
 */

import { describe, it, expect } from 'vitest';
import { UNION_SET_SPEC } from './union-set';
import { CASE_EXPR_SPEC } from './case-expr';
import { SQL_FUNCTIONS_SPEC } from './sql-functions';
import { HAVING_DEEP_SPEC } from './having-deep';
import { DISTINCT_PAGING_SPEC } from './distinct-paging';
import { JOIN_VARIANTS_SPEC } from './join-variants';
import { VIEW_UPDATE_SPEC } from './view-update';
import { INDEX_FAIL_SPEC } from './index-fail';
import { EXPLAIN_DETAIL_SPEC } from './explain-detail';
import { CONSTRAINTS_SPEC } from './constraints';
import { SELECT_FLOW_SPEC } from './sql';
import { JOIN_FLOW_SPEC } from './join';
import { LEFT_JOIN_FLOW_SPEC } from './left-join';
import { GROUP_BY_FLOW_SPEC } from './group-by';
import { SUBQUERY_FLOW_SPEC } from './subquery';
import { ScriptedResultEngine, type ScriptSpec } from '../ScriptEngine';

const SPECS: ScriptSpec[] = [
	UNION_SET_SPEC,
	CASE_EXPR_SPEC,
	SQL_FUNCTIONS_SPEC,
	HAVING_DEEP_SPEC,
	DISTINCT_PAGING_SPEC,
	JOIN_VARIANTS_SPEC,
	VIEW_UPDATE_SPEC,
	INDEX_FAIL_SPEC,
	EXPLAIN_DETAIL_SPEC,
	CONSTRAINTS_SPEC,
	SELECT_FLOW_SPEC,
	JOIN_FLOW_SPEC,
	LEFT_JOIN_FLOW_SPEC,
	GROUP_BY_FLOW_SPEC,
	SUBQUERY_FLOW_SPEC
];

function staticEngine(spec: ScriptSpec): ScriptedResultEngine {
	const tables = spec.frames.map(
		(f) => ({ columns: f.expected?.columns ?? [], rows: f.expected?.rows ?? [] }) as never
	);
	return new ScriptedResultEngine(spec, tables, false);
}

describe('M2 剧本守卫（全主题）', () => {
	for (const spec of SPECS) {
		it(`「${spec.name}」帧结构与教学完整性`, () => {
			expect(spec.seedSql.toUpperCase()).toContain('CREATE TABLE');
			expect(spec.stages.length).toBeGreaterThan(0);
			expect(spec.frames.length).toBeGreaterThanOrEqual(3);
			for (const f of spec.frames) {
				expect(f.sql.trim().length, `帧「${f.description}」缺 SQL`).toBeGreaterThan(0);
				expect(f.description.length, '帧缺文案').toBeGreaterThan(0);
				expect(f.stage, `帧「${f.description}」stage 越界`).toBeLessThan(spec.stages.length);
				expect(f.expected?.rows.length, `帧「${f.description}」expected 无数据`).toBeGreaterThan(0);
				expect(f.expected?.columns.length).toBeGreaterThan(0);
			}
			// 收尾帧用 complete 步型（播放节奏收束）
			expect(spec.frames[spec.frames.length - 1].type).toBe('complete');
			for (const q of spec.practiceQuestions ?? []) {
				expect(q.stepIndex, `题「${q.prompt}」stepIndex 越界`).toBeLessThan(spec.frames.length);
				if (q.options) {
					expect(q.options, `题「${q.prompt}」正确答案不在选项中`).toContain(
						q.correctAnswer as string
					);
				}
			}
		});

		it(`「${spec.name}」静态引擎帧数一致`, () => {
			const engine = staticEngine(spec);
			expect(engine.totalSteps).toBe(spec.frames.length);
			expect(engine.practiceQuestions).toEqual(spec.practiceQuestions ?? []);
		});
	}
});

describe('M2 各主题关键预期值抽查', () => {
	it('case-expr：档位统计 3 / 2 / 1', () => {
		const engine = staticEngine(CASE_EXPR_SPEC);
		engine.setProgress(2);
		expect(engine.getCurrentStep().table?.rows).toEqual([
			['中等', 3],
			['高薪', 2],
			['待涨', 1]
		]);
	});

	it('sql-functions：INSTR/SUBSTR 拆出账号名；NULL 奖金兜底为 0', () => {
		const engine = staticEngine(SQL_FUNCTIONS_SPEC);
		engine.setProgress(0);
		expect(engine.getCurrentStep().table?.rows[1]).toEqual([
			'李四',
			'lisi@corp.com',
			'LISI@CORP.COM',
			'lisi',
			13
		]);
		engine.setProgress(3);
		expect(engine.getCurrentStep().table?.rows[1]).toEqual(['李四', 'NULL', 0, 9000]);
	});

	it('having-deep：华东组 3 单 1100；组合帧先筛行后筛组', () => {
		const engine = staticEngine(HAVING_DEEP_SPEC);
		engine.setProgress(1);
		expect(engine.getCurrentStep().table?.rows[0]).toEqual(['华东', 3, 1100]);
		engine.setProgress(3);
		expect(engine.getCurrentStep().table?.rows).toEqual([
			['华东', 850],
			['华南', 850]
		]);
	});

	it('join-variants：FULL 5 行（交集2 + 仅员工2 + 仅部门1）；自连接拼出汇报链', () => {
		const engine = staticEngine(JOIN_VARIANTS_SPEC);
		engine.setProgress(3);
		expect(engine.getCurrentStep().table?.rows).toHaveLength(5);
		engine.setProgress(5);
		expect(engine.getCurrentStep().table?.rows).toEqual([
			['张三', '—'],
			['李四', '张三'],
			['王五', '张三'],
			['赵六', '李四']
		]);
	});

	it('view-update：经视图写入落到基础表（5 行）', () => {
		const engine = staticEngine(VIEW_UPDATE_SPEC);
		engine.setProgress(5);
		expect(engine.getCurrentStep().table?.rows).toEqual([
			[1, '数学', 90],
			[1, '英语', 85],
			[2, '数学', 75],
			[2, '英语', 60],
			[3, '数学', 95]
		]);
	});

	it('index-fail：基线 SEARCH 命中索引，四个失效场景全为 SCAN', () => {
		const engine = staticEngine(INDEX_FAIL_SPEC);
		engine.setProgress(0);
		expect(engine.getCurrentStep().table?.rows[0][3]).toContain('SEARCH');
		for (let i = 1; i <= 4; i++) {
			engine.setProgress(i);
			expect(engine.getCurrentStep().table?.rows[0][3]).toContain('SCAN');
		}
	});

	it('constraints：PK/UNIQUE/CHECK 违规均 0 行写入；外键插入生效；CASCADE 后清零', () => {
		const engine = staticEngine(CONSTRAINTS_SPEC);
		const wants: [number, unknown[]][] = [
			[1, [0]],
			[2, [0]],
			[3, [0]],
			[4, [1]],
			[5, [0]]
		];
		for (const [idx, want] of wants) {
			engine.setProgress(idx);
			expect(engine.getCurrentStep().table?.rows, `约束帧 ${idx} 结果不符`).toEqual([want]);
		}
	});
});
