/**
 * SQL 工作台关卡判分单测 — 纯函数级（无需 sql.js）：
 * resultSetEquals 归一化/行序语义 + 各关 judge 的通过/拒绝路径。
 */

import { describe, it, expect } from 'vitest';
import { LEVELS, resultSetEquals } from './workbench-levels';

const noQuery = () => ({ columns: [], rows: [] });

describe('resultSetEquals', () => {
	it('值归一化：数字字符串与 number 等价', () => {
		expect(resultSetEquals({ columns: ['a'], rows: [['95'], ['88']] }, [[95], [88]])).toBe(true);
	});

	it('行序敏感（默认）：乱序拒绝', () => {
		expect(resultSetEquals({ columns: ['a'], rows: [[2], [1]] }, [[1], [2]])).toBe(false);
	});

	it('行序不敏感：乱序通过', () => {
		expect(
			resultSetEquals({ columns: ['a'], rows: [[2], [1]] }, [[1], [2]], { ordered: false })
		).toBe(true);
	});

	it('NULL 串不被数字化', () => {
		expect(resultSetEquals({ columns: ['a'], rows: [['NULL']] }, [['NULL']])).toBe(true);
	});
});

describe('关卡 judge 路径', () => {
	it('第 1 关：正确结果集通过', () => {
		const v = LEVELS[0].judge({
			columns: ['姓名', '成绩'],
			rows: [
				['周八', 95],
				['李四', 92],
				['张三', 88],
				['赵六', 85]
			],
			eqp: '',
			queryTable: noQuery
		});
		expect(v.ok).toBe(true);
	});

	it('第 1 关：缺行拒绝且 reason 提示', () => {
		const v = LEVELS[0].judge({
			columns: ['姓名', '成绩'],
			rows: [['周八', 95]],
			eqp: '',
			queryTable: noQuery
		});
		expect(v.ok).toBe(false);
		expect(v.reason).toContain('ORDER BY');
	});

	it('第 4 关：SEARCH 计划通过，SCAN 拒绝', () => {
		const okV = LEVELS[3].judge({
			columns: [],
			rows: [],
			eqp: 'SEARCH 学生 USING INDEX idx',
			queryTable: noQuery
		});
		expect(okV.ok).toBe(true);
		const badV = LEVELS[3].judge({ columns: [], rows: [], eqp: 'SCAN 学生', queryTable: noQuery });
		expect(badV.ok).toBe(false);
	});

	it('第 5 关：库状态判分（queryTable 钩子）', () => {
		const v = LEVELS[4].judge({
			columns: [],
			rows: [],
			eqp: '',
			queryTable: () => ({
				columns: ['姓名', '成绩'],
				rows: [
					['李四', 97],
					['孙七', 68]
				]
			})
		});
		expect(v.ok).toBe(true);
	});

	it('第 8 关：平均分取整或一位小数均可', () => {
		const mk = (val: number) => ({
			columns: ['专业', '平均分'],
			rows: [
				['计算机', val],
				['网络工程', 85]
			],
			eqp: '',
			queryTable: noQuery
		});
		expect(LEVELS[7].judge(mk(86)).ok).toBe(true);
		expect(LEVELS[7].judge(mk(86.3)).ok).toBe(true);
		expect(LEVELS[7].judge(mk(90)).ok).toBe(false);
	});

	it('第 9 关：子查询乱序通过，缺人拒绝', () => {
		const rows = [
			['周八', 95],
			['张三', 88],
			['李四', 92],
			['赵六', 85]
		];
		expect(LEVELS[8].judge({ columns: [], rows, eqp: '', queryTable: noQuery }).ok).toBe(true);
		expect(LEVELS[8].judge({ columns: [], rows: [rows[0]], eqp: '', queryTable: noQuery }).ok).toBe(
			false
		);
	});

	it('第 11 关：CASE 分档三行全对通过，漏档拒绝', () => {
		const rows = [
			['优秀', 2],
			['良好', 2],
			['待提高', 2]
		];
		expect(LEVELS[10].judge({ columns: [], rows, eqp: '', queryTable: noQuery }).ok).toBe(true);
		expect(
			LEVELS[10].judge({ columns: [], rows: rows.slice(0, 2), eqp: '', queryTable: noQuery }).ok
		).toBe(false);
	});

	it('第 13 关：COUNT=4 通过，其他拒绝', () => {
		const mk = (n: number) => ({
			columns: [],
			rows: [],
			eqp: '',
			queryTable: () => ({ columns: ['COUNT(*)'], rows: [[n]] })
		});
		expect(LEVELS[12].judge(mk(4)).ok).toBe(true);
		expect(LEVELS[12].judge(mk(5)).ok).toBe(false);
	});

	it('第 16 关：5 行 + SEARCH 通过，无索引拒绝', () => {
		const okV = LEVELS[15].judge({
			columns: ['姓名', '成绩'],
			rows: [
				['张三', 90],
				['张三', 85],
				['李四', 95],
				['王五', 78],
				['孙七', 60]
			],
			eqp: 'SEARCH 选课 USING INDEX idx',
			queryTable: noQuery
		});
		const badV = LEVELS[15].judge({
			columns: ['姓名', '成绩'],
			rows: [
				['张三', 90],
				['张三', 85],
				['李四', 95],
				['王五', 78],
				['孙七', 60]
			],
			eqp: 'SCAN 选课',
			queryTable: noQuery
		});
		expect(okV.ok).toBe(true);
		expect(badV.ok).toBe(false);
	});

	it('全部关卡编号连续、字段完整且带章节', () => {
		expect(LEVELS.length).toBe(20);
		LEVELS.forEach((l, i) => {
			expect(l.id).toBe(i + 1);
			expect(l.title.length).toBeGreaterThan(0);
			expect(l.task.length).toBeGreaterThan(0);
			expect(l.hint.length).toBeGreaterThan(0);
			expect(l.topicId.length).toBeGreaterThan(0);
			expect(l.chapter.length).toBeGreaterThan(0);
		});
	});
});
