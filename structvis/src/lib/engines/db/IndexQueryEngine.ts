/**
 * M4.1 索引查询引擎 — 二级索引定位 → 主键回表 的完整链路关键帧。
 * 固定演示数据：用户表 4 行 + 姓名二级索引（叶内值为主键）。概念状态机演示（非 SQL 执行）。
 */

import type { AlgorithmStep, PracticeQuestion } from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';
import type { IndexQueryData } from '../algorithm/types';

const PSEUDOCODE = [
	'idx = 二级索引(姓名)',
	'pos = idx 定位(姓名 = 王朝)     -- 树查找',
	'(pk) = idx[pos]                -- 叶内存主键',
	'row = 聚簇表 按主键 pk 回表     -- 二次查找',
	'return row                     -- 返回整行'
];

const PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 3,
		prompt: '二级索引的叶子节点里存的是什么？',
		options: ['整行数据', '主键值', '下一个索引的地址', '列名'],
		correctAnswer: '主键值',
		hint: '如果存了整行，每个二级索引都要复制一份全表',
		explanation:
			'InnoDB 的二级索引叶子只存「索引列值 + 主键」。拿到主键后必须回到聚簇索引再查一次整行——这一步就是「回表」。'
	},
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: '什么情况下可以避免回表？',
		options: ['加更多二级索引', '查询的列都在索引里（覆盖索引）', '把表变小', '用 LEFT JOIN'],
		correctAnswer: '查询的列都在索引里（覆盖索引）',
		hint: '回表的原因是索引里缺列',
		explanation:
			'若 SELECT 的列全部包含在二级索引中，索引本身已给出答案，无需回表——EXPLAIN 显示为 Using index（覆盖索引）。'
	}
];

/** 树布局（逻辑坐标 720×300）：根 → 两片叶子 */
const NODES = [
	{ id: 'root', label: '(刘)', x: 300, y: 30, kind: 'root' as const },
	{ id: 'leaf-a', label: '刘洋→3 · 刘备→7', x: 90, y: 170, kind: 'leaf' as const },
	{ id: 'leaf-b', label: '王芳→5 · 王朝→9', x: 430, y: 170, kind: 'leaf' as const }
];
const EDGES = [
	{ from: 'root', to: 'leaf-a' },
	{ from: 'root', to: 'leaf-b' }
];
const ROWS = [
	{ id: 3, label: '3 · 刘洋 · 22岁' },
	{ id: 5, label: '5 · 王芳 · 25岁' },
	{ id: 7, label: '7 · 刘备 · 30岁' },
	{ id: 9, label: '9 · 王朝 · 28岁' }
];

export class IndexQueryEngine extends EngineBase<void> {
	readonly name = '索引查询与回表';
	readonly renderType = 'index-query' as const;
	readonly panelTitle = '查询链路';
	readonly pseudocode = PSEUDOCODE;
	readonly practiceQuestions = PRACTICE;

	init(): void {
		this._stepId = 0;
		const base = {
			nodes: NODES.map((n) => ({ ...n })),
			edges: EDGES.map((e) => ({ ...e })),
			rows: ROWS.map((r) => ({ ...r }))
		};
		const mk = (d: Partial<IndexQueryData>, type: AlgorithmStep['type']): AlgorithmStep => ({
			id: this._stepId++,
			type,
			description: '',
			data: [],
			highlights: [],
			pseudocodeLine: 0,
			indexQuery: { ...base, ...d, phase: (d.phase ?? 'idle') as IndexQueryData['phase'] }
		});

		this.steps = [
			{
				...mk({ phase: 'idle', note: 'SELECT * FROM 用户 WHERE 姓名 = 王朝' }, 'init'),
				description: '任务：按姓名查一行——二级索引(姓名→主键)已就绪',
				detail: '二级索引按姓名排序，叶内保存主键；整行数据在以主键排序的聚簇索引里。',
				pseudocodeLine: 0
			},
			{
				...mk({ phase: 'descend', activeNodes: ['root'], note: '从根节点出发' }, 'compare'),
				description: '根节点：「王」应在其右侧子树',
				detail: 'B+ 树每个节点是一段有序区间，比较一次即可排除一半子树。',
				pseudocodeLine: 1
			},
			{
				...mk(
					{
						phase: 'descend',
						activeNodes: ['leaf-b'],
						pathEdges: [{ from: 'root', to: 'leaf-b' }],
						note: '进入右叶'
					},
					'compare'
				),
				description: '沿树下降到右叶 [王芳→5 · 王朝→9]',
				detail: '树高决定磁盘访问次数——千万级表的三层 B+ 树通常 3 次 IO 内定位。',
				pseudocodeLine: 1
			},
			{
				...mk(
					{
						phase: 'leaf',
						activeNodes: ['leaf-b'],
						pathEdges: [{ from: 'root', to: 'leaf-b' }],
						note: '叶内命中：王朝 → 主键 9'
					},
					'pivot-select'
				),
				description: '叶内命中「王朝」，取出主键 9',
				detail: '二级索引叶内只存主键——拿主键去聚簇索引才能取到整行。',
				pseudocodeLine: 2
			},
			{
				...mk(
					{
						phase: 'back',
						activeNodes: ['leaf-b'],
						activeRow: 9,
						backFromNode: 'leaf-b',
						note: '回表：主键 9 → 聚簇定位整行'
					},
					'swap'
				),
				description: '回表：持主键 9 到聚簇索引取出整行',
				detail: '回表是一次额外的 B+ 树查找。列都在索引里时（覆盖索引）可跳过这一步。',
				pseudocodeLine: 3
			},
			{
				...mk(
					{
						phase: 'done',
						activeRow: 9,
						note: '返回 9 · 王朝 · 28岁'
					},
					'complete'
				),
				description: '返回整行：9 · 王朝 · 28岁（链路共 2 次树查找）',
				detail: '二级索引查找 + 回表 = 两次 B+ 树定位。理解这条链路，索引优化就有了地基。',
				pseudocodeLine: 4
			}
		];
		this.totalSteps = this.steps.length;
		this.playbackPos = 0;
	}
}
