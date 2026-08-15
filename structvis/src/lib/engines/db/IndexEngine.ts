/**
 * 索引原理引擎 — IndexEngine
 *
 * 用 B+ 树（阶 4，节点最多 3 个键）演示索引的工作过程：
 * 等值查找（根 → 比较下钻 → 叶内命中）、范围查找（定位下界 + 叶子链表顺序扫描）、
 * 插入（定位 → 叶满分裂 → 中间键提升到父节点）。
 * 每步 btree 快照为当前可见节点（增量揭示，支持 hide 表示分裂替换），高亮语义：
 * current=正在访问的节点、compare=比较下钻、pivot=需要分裂、sorted=完成/命中。
 */

import type {
	BPlusTreeData,
	BPlusNode,
	EnginePreset,
	Highlight,
	HighlightType,
	PracticeQuestion,
	StepType
} from '../algorithm/types';
import { EngineBase } from '../algorithm/EngineBase';

export interface IndexEngineInput {
	preset: string;
}

interface BPlusStepSpec {
	type: StepType;
	desc: string;
	reveal: string[];
	hide?: string[];
	hl: string[];
	hlType?: HighlightType;
	line: number;
}

interface BPlusPreset {
	name: string;
	description: string;
	nodes: BPlusNode[];
	edges: { from: string; to: string }[];
	steps: BPlusStepSpec[];
	pseudocode: string[];
}

/** 页面可用的预设列表（名称 + 简介） */
export function getIndexPresets(): { name: string; description: string }[] {
	return PRESETS.map((p) => ({ name: p.name, description: p.description }));
}

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: 'B+ 树中，所有数据记录存放在哪里？',
		options: ['根节点', '内部节点', '叶子节点', '每个节点都存'],
		correctAnswer: '叶子节点',
		hint: '内部节点只放分隔键，数据都在叶子',
		explanation:
			'B+ 树的所有数据（记录指针）都存放在叶子节点，内部节点只存放分隔键用于路由，这是 B+ 树与 B 树的本质区别。'
	},
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: 'B+ 树做一次等值查找要比较多少次？',
		options: [
			'与树高成正比，约 O(log_m n)',
			'与记录总数成正比，O(n)',
			'固定 1 次',
			'与阶数 m 无关，O(n²)'
		],
		correctAnswer: '与树高成正比，约 O(log_m n)',
		hint: '每层只访问一个节点',
		explanation:
			'查找路径从根到叶子每一层只访问一个节点，比较次数约等于树高 O(log_m n)，m 为阶数——比全表扫描 O(n) 快得多。'
	}
];

const PRESETS: BPlusPreset[] = [
	{
		name: '等值查找',
		description: '查找学号 20105（学号索引，阶 4）',
		nodes: [
			{ id: 'root', keys: [20103, 20105], x: 450, y: 90 },
			{ id: 'l1', keys: [20101, 20102], leaf: true, x: 175, y: 260 },
			{ id: 'l2', keys: [20103, 20104], leaf: true, x: 450, y: 260 },
			{ id: 'l3', keys: [20105, 20106], leaf: true, x: 725, y: 260 }
		],
		edges: [
			{ from: 'root', to: 'l1' },
			{ from: 'root', to: 'l2' },
			{ from: 'root', to: 'l3' }
		],
		steps: [
			{
				type: 'init',
				desc: 'B+ 树索引（阶 4，节点最多 3 个键）：学号列建立索引。内部节点存放分隔键，全部数据键在叶子，叶子间用指针连成链表。目标：查找学号 20105。',
				reveal: ['root', 'l1', 'l2', 'l3'],
				hl: ['root'],
				line: 0
			},
			{
				type: 'compare',
				desc: '从根节点开始比较：20105 > 20103，继续与第二个键比：20105 ≥ 20105 → 沿第三个指针下钻到叶子。',
				reveal: [],
				hl: ['root'],
				line: 1
			},
			{
				type: 'compare',
				desc: '到达叶子节点 [20105, 20106]：叶内查找，命中 20105。',
				reveal: [],
				hl: ['l3'],
				line: 2
			},
			{
				type: 'recurse-exit',
				desc: '叶子中存放指向记录的指针（行号），O(1) 取出记录。',
				reveal: [],
				hl: ['l3'],
				hlType: 'sorted',
				line: 3
			},
			{
				type: 'complete',
				desc: '查找完成：每层只访问 1 个节点，共 2 层 3 次比较。B+ 树查找复杂度 O(log_m n)，远快于全表扫描 O(n)。',
				reveal: [],
				hl: ['root', 'l3'],
				hlType: 'sorted',
				line: 3
			}
		],
		pseudocode: [
			'从根节点开始',
			'与节点键比较，决定下钻指针',
			'到达叶子节点',
			'叶内命中 → 取出记录'
		]
	},
	{
		name: '范围查找',
		description: '查找 学号 ∈ [20103, 20105]',
		nodes: [
			{ id: 'root', keys: [20103, 20105], x: 450, y: 90 },
			{ id: 'l1', keys: [20101, 20102], leaf: true, x: 175, y: 260 },
			{ id: 'l2', keys: [20103, 20104], leaf: true, x: 450, y: 260 },
			{ id: 'l3', keys: [20105, 20106], leaf: true, x: 725, y: 260 }
		],
		edges: [
			{ from: 'root', to: 'l1' },
			{ from: 'root', to: 'l2' },
			{ from: 'root', to: 'l3' }
		],
		steps: [
			{
				type: 'init',
				desc: '范围查询：查找 20103 ≤ 学号 ≤ 20105。B+ 树对范围查询特别高效：一次树查找定位下界，然后沿叶子链表顺序扫描。',
				reveal: ['root', 'l1', 'l2', 'l3'],
				hl: ['root'],
				line: 0
			},
			{
				type: 'compare',
				desc: '定位下界 20103：与根键比较，20103 ≥ 20103 → 沿第二个指针下钻到叶子 [20103, 20104]。',
				reveal: [],
				hl: ['l2'],
				line: 1
			},
			{
				type: 'compare',
				desc: '从叶子 [20103, 20104] 顺序扫描：20103、20104 均满足范围。',
				reveal: [],
				hl: ['l2'],
				hlType: 'sorted',
				line: 2
			},
			{
				type: 'compare',
				desc: '20104 已是本叶最后一个键：沿叶子链表指针（右箭头）进入下一叶子 [20105, 20106]。',
				reveal: [],
				hl: ['l3'],
				line: 2
			},
			{
				type: 'compare',
				desc: '20105 满足 ≤ 20105；扫描 20106：超过上界 20105，扫描停止。',
				reveal: [],
				hl: ['l3'],
				hlType: 'sorted',
				line: 2
			},
			{
				type: 'complete',
				desc: '范围查询完成：20103、20104、20105。代价 = 一次树查找 + 链表顺序扫描，与区间长度成正比。',
				reveal: [],
				hl: ['l2', 'l3'],
				hlType: 'sorted',
				line: 2
			}
		],
		pseudocode: [
			'定位下界（一次树查找）',
			'沿叶子链表顺序扫描',
			'收集满足范围的行',
			'超过上界 → 停止'
		]
	},
	{
		name: '插入（叶分裂）',
		description: '插入学号 20108，触发叶节点分裂',
		nodes: [
			{ id: 'root', keys: [20103, 20105], x: 450, y: 90 },
			{ id: 'l1', keys: [20101, 20102], leaf: true, x: 175, y: 260 },
			{ id: 'l2', keys: [20103, 20104], leaf: true, x: 450, y: 260 },
			{ id: 'l3', keys: [20105, 20106, 20107], leaf: true, x: 715, y: 260 },
			{ id: 'l3a', keys: [20105, 20106], leaf: true, x: 600, y: 260 },
			{ id: 'l3b', keys: [20107, 20108], leaf: true, x: 790, y: 260 },
			{ id: 'root2', keys: [20103, 20105, 20107], x: 450, y: 90 }
		],
		edges: [
			{ from: 'root', to: 'l1' },
			{ from: 'root', to: 'l2' },
			{ from: 'root', to: 'l3' },
			{ from: 'root2', to: 'l1' },
			{ from: 'root2', to: 'l2' },
			{ from: 'root2', to: 'l3a' },
			{ from: 'root2', to: 'l3b' }
		],
		steps: [
			{
				type: 'init',
				desc: '插入学号 20108。当前 B+ 树阶 4（节点最多 3 个键），叶子 [20105, 20106, 20107] 已满。',
				reveal: ['root', 'l1', 'l2', 'l3'],
				hl: ['root'],
				line: 0
			},
			{
				type: 'compare',
				desc: '先定位插入位置：从根比较，20108 > 20105 → 沿第三个指针下钻到叶子 [20105, 20106, 20107]。',
				reveal: [],
				hl: ['l3'],
				line: 1
			},
			{
				type: 'compare',
				desc: '插入 20108 → 叶子键数变为 4，超过阶上限 3，需要分裂。',
				reveal: [],
				hl: ['l3'],
				hlType: 'pivot',
				line: 2
			},
			{
				type: 'recurse-enter',
				desc: '叶分裂：前 2 键留在原叶 [20105, 20106]，后 2 键移入新叶 [20107, 20108]，新叶通过链表指针连接。',
				reveal: ['l3a', 'l3b'],
				hide: ['l3'],
				hl: ['l3a', 'l3b'],
				line: 3
			},
			{
				type: 'recurse-enter',
				desc: '把中间键 20107 提升到父节点：根变为 [20103, 20105, 20107]，获得第 4 个孩子指针。',
				reveal: ['root2'],
				hide: ['root'],
				hl: ['root2'],
				line: 3
			},
			{
				type: 'complete',
				desc: '插入完成：树仍保持平衡（所有叶子同层）。B+ 树插入 = 定位 + 分裂，分裂必要时向上传播直到根。',
				reveal: [],
				hl: ['root2', 'l3a', 'l3b'],
				hlType: 'sorted',
				line: 3
			}
		],
		pseudocode: ['定位插入的叶子', '插入键值', '叶满 → 分裂', '中间键提升至父节点']
	}
];

export class IndexEngine extends EngineBase<IndexEngineInput> {
	readonly name = '索引原理';
	readonly renderType = 'btree' as const;
	readonly panelTitle = '查找步骤';

	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	presets: EnginePreset[] = PRESETS.map((p) => ({ name: p.name, description: p.description }));

	applyPreset(name: string): void {
		this.init({ preset: name });
	}

	init(input: IndexEngineInput): void {
		const preset = PRESETS.find((p) => p.name === input.preset) ?? PRESETS[0];
		this.pseudocode = preset.pseudocode;

		this.steps = [];
		this._stepId = 0;

		const revealed = new Set<string>();
		const hidden = new Set<string>();

		for (const spec of preset.steps) {
			for (const id of spec.reveal) revealed.add(id);
			for (const id of spec.hide ?? []) hidden.add(id);

			const nodes = preset.nodes.filter((n) => revealed.has(n.id) && !hidden.has(n.id));
			const visible = new Set(nodes.map((n) => n.id));
			const edges = preset.edges.filter((e) => visible.has(e.from) && visible.has(e.to));
			const idxById = new Map(nodes.map((n, i) => [n.id, i]));
			const highlights: Highlight[] = [];
			if (spec.hl.length > 0) {
				highlights.push({
					type: spec.hlType ?? 'current',
					indices: spec.hl.map((id) => idxById.get(id)).filter((i): i is number => i !== undefined)
				});
			}

			this._emit(spec.type, spec.desc, { nodes, edges }, highlights, spec.line);
		}

		this.totalSteps = this.steps.length;
	}

	private _emit(
		type: StepType,
		description: string,
		tree: BPlusTreeData,
		highlights: Highlight[],
		pseudocodeLine: number
	): void {
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			btree: {
				nodes: tree.nodes.map((n) => ({ ...n, keys: [...n.keys] })),
				edges: tree.edges.map((e) => ({ ...e }))
			}
		});
	}
}
