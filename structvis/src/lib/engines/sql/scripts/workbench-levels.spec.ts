/**
 * SQL 工作台关卡判分单测 — 纯函数级（无需 sql.js）：
 * resultSetEquals 归一化/行序语义 + express-station 21 关 judge 的通过/拒绝路径。
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

	it('NULL 值等价比较', () => {
		expect(resultSetEquals({ columns: ['a'], rows: [[null]] }, [[null]])).toBe(true);
	});
});

describe('关卡 judge 路径（express-station 驿站库）', () => {
	it('第 1 关 待取件看板：正确结果集通过', () => {
		const v = LEVELS[0].judge({
			columns: ['tracking_no', 'recipient_name'],
			rows: [
				['ZT2026001', '李四'],
				['YT2026001', '王五'],
				['SF2026002', '周八'],
				['YT2026002', '郑十'],
				['SF2026003', '张三'],
				['JD2026002', '李四'],
				['YD2026002', '林十二'],
				['ZT2026004', '赵六'],
				['YT2026003', '张三']
			],
			eqp: '',
			queryTable: noQuery
		});
		expect(v.ok).toBe(true);
	});

	it('第 1 关：缺行拒绝且 reason 提示', () => {
		const v = LEVELS[0].judge({
			columns: ['tracking_no', 'recipient_name'],
			rows: [['ZT2026001', '李四']],
			eqp: '',
			queryTable: noQuery
		});
		expect(v.ok).toBe(false);
		expect(v.reason).toContain('9 行');
	});

	it('第 2 关 顺丰专场：整行匹配（含 NULL 取件时间）', () => {
		const v = LEVELS[1].judge({
			columns: [],
			rows: [
				[
					1,
					'SF2026001',
					'张三',
					'13800001111',
					1,
					'顺丰',
					'已取件',
					'2026-03-25 09:00:00',
					'2026-03-25 14:30:00',
					'582916'
				],
				[
					6,
					'SF2026002',
					'周八',
					'13800006666',
					3,
					'顺丰',
					'待取件',
					'2026-03-26 09:00:00',
					null,
					'715384'
				],
				[
					9,
					'SF2026003',
					'张三',
					'13800001111',
					5,
					'顺丰',
					'待取件',
					'2026-03-26 11:00:00',
					null,
					'502847'
				],
				[
					13,
					'SF2026004',
					'王五',
					'13800003333',
					6,
					'顺丰',
					'已取件',
					'2026-03-24 09:00:00',
					'2026-03-24 18:00:00',
					'816394'
				]
			],
			eqp: '',
			queryTable: noQuery
		});
		expect(v.ok).toBe(true);
	});

	it('第 8 关 索引：SEARCH 计划通过，SCAN 拒绝', () => {
		const okV = LEVELS[7].judge({
			columns: [],
			rows: [],
			eqp: 'SEARCH packages USING INDEX idx_pickup',
			queryTable: noQuery
		});
		expect(okV.ok).toBe(true);
		const badV = LEVELS[7].judge({
			columns: [],
			rows: [],
			eqp: 'SCAN packages',
			queryTable: noQuery
		});
		expect(badV.ok).toBe(false);
	});

	it('第 12 关 COALESCE：9 行兜底值通过，缺行拒绝', () => {
		const rows = [
			['ZT2026001', '尚未取件'],
			['YT2026001', '尚未取件'],
			['SF2026002', '尚未取件'],
			['YT2026002', '尚未取件'],
			['SF2026003', '尚未取件'],
			['JD2026002', '尚未取件'],
			['YD2026002', '尚未取件'],
			['ZT2026004', '尚未取件'],
			['YT2026003', '尚未取件']
		];
		expect(LEVELS[11].judge({ columns: [], rows, eqp: '', queryTable: noQuery }).ok).toBe(true);
		expect(
			LEVELS[11].judge({ columns: [], rows: rows.slice(0, 8), eqp: '', queryTable: noQuery }).ok
		).toBe(false);
	});

	it('第 17关 数据更新：queryTable 状态判分通过/拒绝', () => {
		const okV = LEVELS[16].judge({
			columns: [],
			rows: [],
			eqp: '',
			queryTable: (sql) => {
				if (sql.includes('pickup_code')) return { columns: ['status'], rows: [['已取件']] };
				return { columns: ['current_count'], rows: [[1]] };
			}
		});
		expect(okV.ok).toBe(true);
		const badV = LEVELS[16].judge({
			columns: [],
			rows: [],
			eqp: '',
			queryTable: (sql) => {
				if (sql.includes('pickup_code')) return { columns: ['status'], rows: [['待取件']] };
				return { columns: ['current_count'], rows: [[2]] };
			}
		});
		expect(badV.ok).toBe(false);
	});

	it('第 21 关 UNION：行序不敏感通过，漏单拒绝', () => {
		const rows = [
			['ZT2026001'],
			['YT2026001'],
			['SF2026002'],
			['YT2026002'],
			['SF2026003'],
			['JD2026002'],
			['YD2026002'],
			['ZT2026004'],
			['YT2026003'],
			['YD2026001'],
			['ZT2026003']
		];
		const v = LEVELS[20].judge({ columns: [], rows, eqp: '', queryTable: noQuery });
		expect(v.ok).toBe(true);
		const miss = LEVELS[20].judge({
			columns: [],
			rows: rows.slice(0, 10),
			eqp: '',
			queryTable: noQuery
		});
		expect(miss.ok).toBe(false);
	});

	it('关卡池：21 关且章节覆盖教参进度', () => {
		expect(LEVELS.length).toBe(21);
		const chapters = new Set(LEVELS.map((l) => l.chapter));
		expect(chapters.has('查询基础')).toBe(true);
		expect(chapters.has('索引优化')).toBe(true);
		expect(chapters.has('数据更新')).toBe(true);
		expect(chapters.has('集合与视图')).toBe(true);
	});
});
