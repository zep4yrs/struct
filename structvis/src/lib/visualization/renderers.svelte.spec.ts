import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import type { Component } from 'svelte';
import { resetCanvasMock, textsDrawn, canvasCalls } from '../../test/canvas-mock';
import type { AlgorithmStep, RenderType } from '$lib/engines/algorithm/types';
import StackRenderer from './stack/StackRenderer.svelte';
import TreeRenderer from './tree/TreeRenderer.svelte';
import LinkedRenderer from './linkedlist/LinkedRenderer.svelte';
import KmpRenderer from './kmp/KmpRenderer.svelte';
import HuffmanRenderer from './huffman/HuffmanRenderer.svelte';
import HashtableRenderer from './hashtable/HashtableRenderer.svelte';
import GraphRenderer from './graph/GraphRenderer.svelte';
import BPlusTreeRenderer from './btree/BPlusTreeRenderer.svelte';
import ErRenderer from './er/ErRenderer.svelte';
import SqlTableRenderer from './sqltable/SqlTableRenderer.svelte';

const base = {
	id: 0,
	type: 'compare' as const,
	description: '',
	highlights: [],
	pseudocodeLine: 0
};

function step(overrides: Partial<AlgorithmStep>): AlgorithmStep {
	return { ...base, data: [], ...overrides };
}

interface Case {
	name: string;
	renderType: RenderType;
	component: Component<any>;
	steps: AlgorithmStep[];
	/** 至少应出现在绘制文本中的字符串 */
	expectTexts: string[];
	/** StackRenderer 专属 mode 属性 */
	mode?: 'stack' | 'queue';
}

const cases: Case[] = [
	{
		name: '层序树',
		renderType: 'tree',
		component: TreeRenderer,
		steps: [step({ data: [5, 3, 8, 1, 4], highlights: [{ type: 'current', indices: [2] }] })],
		expectTexts: ['5', '3', '8', '1', '4']
	},
	{
		name: '链表',
		renderType: 'linkedlist',
		component: LinkedRenderer,
		steps: [step({ data: [7, 2, 9], highlights: [{ type: 'current', indices: [1] }] })],
		expectTexts: ['7', '2', '9']
	},
	{
		name: '栈',
		renderType: 'stack',
		component: StackRenderer,
		mode: 'stack',
		steps: [step({ data: [1, 2, 3], highlights: [{ type: 'current', indices: [2] }] })],
		expectTexts: ['1', '2', '3']
	},
	{
		name: '队列',
		renderType: 'queue',
		component: StackRenderer,
		mode: 'queue',
		steps: [step({ data: [1, 2, 3], highlights: [{ type: 'current', indices: [0] }] })],
		expectTexts: ['1', '2', '3']
	},
	{
		name: 'KMP 匹配阶段',
		renderType: 'kmp',
		component: KmpRenderer,
		steps: [
			step({
				kmp: { text: 'ABABC', pattern: 'ABC', i: 1, j: 1, phase: 'compare', next: [0, 0, 1, 2] }
			})
		],
		expectTexts: ['A', 'B', 'C', 'next', '[1]', '↑ i', '↑ j']
	},
	{
		name: 'KMP buildNext 阶段',
		renderType: 'kmp',
		component: KmpRenderer,
		steps: [
			step({
				kmp: {
					text: 'ABABC',
					pattern: 'ABC',
					i: 1,
					j: 0,
					phase: 'compare',
					buildNext: true,
					next: [0, 0, 1, 2],
					nextIndex: 2
				}
			})
		],
		expectTexts: ['A', 'B', 'C', 'next', '↑ j', '↑ k']
	},
	{
		name: 'KMP found 终帧',
		renderType: 'kmp',
		component: KmpRenderer,
		steps: [
			step({
				kmp: { text: 'ABABC', pattern: 'ABC', i: 2, j: 2, phase: 'found', next: [0, 0, 1, 2] }
			})
		],
		expectTexts: ['匹配成功']
	},
	{
		name: '哈夫曼森林',
		renderType: 'huffman',
		component: HuffmanRenderer,
		steps: [
			step({
				huffman: {
					nodes: [
						{ id: 0, value: 7, left: -1, right: -1, parent: -1 },
						{ id: 1, value: 5, left: -1, right: -1, parent: -1 },
						{ id: 2, value: 12, left: 0, right: 1, parent: -1 }
					],
					roots: [2],
					wpl: 12
				}
			})
		],
		expectTexts: ['7', '5', '12']
	},
	{
		name: '哈希表线性探测',
		renderType: 'hashtable',
		component: HashtableRenderer,
		steps: [
			step({
				data: [22, 1, 0, 46],
				hash: {
					mode: 'linear',
					size: 4,
					slots: [22, 1, null, 46],
					key: 30,
					keyLabel: '30',
					hashValue: 2,
					probe: [0, 1, 2],
					current: 2
				}
			})
		],
		expectTexts: ['22', '1', '46', '空', '0', '1', '2', '3']
	},
	{
		name: '哈希表链地址法',
		renderType: 'hashtable',
		component: HashtableRenderer,
		steps: [
			step({
				data: [13, 27, 30, 0],
				hash: {
					mode: 'chain',
					size: 3,
					slots: [null, null, null],
					chains: { 0: [13, 27], 2: [30] },
					key: 27,
					keyLabel: '27',
					hashValue: 0,
					current: 0
				}
			})
		],
		expectTexts: ['13', '27', '30', '0', '2']
	},
	{
		name: '有向图',
		renderType: 'graph',
		component: GraphRenderer,
		steps: [
			step({
				graph: {
					nodes: [
						{ id: 0, label: 'A' },
						{ id: 1, label: 'B' },
						{ id: 2, label: 'C' }
					],
					edges: [
						{ from: 0, to: 1, weight: 4 },
						{ from: 1, to: 2 }
					],
					directed: true,
					nodeState: { 0: 'current', 1: 'visited' },
					nodeNote: { 1: 'dist=4' }
				}
			})
		],
		expectTexts: ['A', 'B', 'C', 'dist=4']
	},
	{
		name: 'B+ 树',
		renderType: 'btree',
		component: BPlusTreeRenderer,
		steps: [
			step({
				btree: {
					nodes: [
						{ id: 'r', keys: [7], x: 360, y: 60 },
						{ id: 'l', keys: [3, 5], leaf: true, x: 180, y: 220 },
						{ id: 'rl', keys: [9, 11], leaf: true, x: 540, y: 220 }
					],
					edges: [
						{ from: 'r', to: 'l' },
						{ from: 'r', to: 'rl' }
					]
				}
			})
		],
		expectTexts: ['7', '3', '5', '9', '11']
	},
	{
		name: 'E-R 图',
		renderType: 'er',
		component: ErRenderer,
		steps: [
			step({
				er: {
					nodes: [
						{ id: 'e1', type: 'entity', label: '学生', x: 100, y: 100 },
						{ id: 'e2', type: 'entity', label: '课程', x: 400, y: 100 },
						{ id: 'r1', type: 'relationship', label: '选修', x: 250, y: 220 }
					],
					edges: [
						{ from: 'e1', to: 'r1', label: 'm', labelEnd: 'to' },
						{ from: 'e2', to: 'r1', label: 'n', labelEnd: 'to' }
					]
				}
			})
		],
		expectTexts: ['学生', '课程', '选修', 'm', 'n']
	},
	{
		name: 'SQL 查询结果',
		renderType: 'sql-table',
		component: SqlTableRenderer,
		steps: [
			step({
				table: {
					columns: ['学号', '姓名'],
					rows: [
						['001', '张三'],
						['002', '李四']
					]
				}
			})
		],
		expectTexts: ['学号', '姓名', '张三', '李四']
	}
];

beforeEach(() => resetCanvasMock());

afterEach(() => cleanup());

describe.each(cases)('渲染器冒烟：$renderType（$name）', (testCase) => {
	it('挂载绘制不抛异常，且绘制了关键文本', async () => {
		const props: Record<string, unknown> = {
			steps: testCase.steps,
			playbackPos: testCase.steps.length - 1
		};
		if (testCase.mode !== undefined) props.mode = testCase.mode;
		render(testCase.component, { props });
		await tick();

		expect(canvasCalls().some((c) => c.method === 'clearRect')).toBe(true);
		const texts = textsDrawn();
		for (const t of testCase.expectTexts) {
			expect(texts).toContain(t);
		}
	});

	it('中间播放位置仍能绘制', async () => {
		const multiSteps = [
			...testCase.steps,
			{ ...testCase.steps[0], id: 1, description: 'advance', highlights: [] }
		];
		const props: Record<string, unknown> = { steps: multiSteps, playbackPos: 0.5 };
		if (testCase.mode !== undefined) props.mode = testCase.mode;
		render(testCase.component, { props });
		await tick();
		expect(textsDrawn().length).toBeGreaterThan(0);
	});
});
