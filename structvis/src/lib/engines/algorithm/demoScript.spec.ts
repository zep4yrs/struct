import { describe, it, expect } from 'vitest';
import type { AlgorithmEngine, AlgorithmStep } from './types';
import { QuickSortEngine } from './quicksort/QuickSortEngine';
import { BubbleSortEngine } from './basicsort/BubbleSortEngine';
import { InsertionSortEngine } from './basicsort/InsertionSortEngine';
import { SelectionSortEngine } from './basicsort/SelectionSortEngine';
import { MergeSortEngine } from './basicsort/MergeSortEngine';
import { BinaryTreeEngine } from './binarytree/BinaryTreeEngine';
import { GraphTraversalEngine } from './graph/GraphTraversalEngine';
import { MstEngine } from './graph/MstEngine';
import { DijkstraEngine } from './graph/DijkstraEngine';
import { TopoSortEngine } from './graph/TopoSortEngine';
import { CriticalPathEngine } from './graph/CriticalPathEngine';
import { BinarySearchEngine } from './search/BinarySearchEngine';
import { KMPEngine } from './search/KMPEngine';
import { BstEngine } from './bst/BstEngine';
import { HuffmanEngine } from './huffman/HuffmanEngine';
import { HashTableEngine } from './hash/HashTableEngine';
import { SelectEngine, type SqlTable } from '../sql/SelectEngine';

type EngineFactory = () => AlgorithmEngine<unknown>;

const STUDENT_TABLE: SqlTable = {
	columns: ['id', 'name', 'major', 'score'],
	rows: [
		[20101, 'zhang', 'cs', 88],
		[20102, 'li', 'se', 92],
		[20103, 'wang', 'cs', 76],
		[20104, 'zhao', 'math', 85],
		[20105, 'qian', 'se', 63]
	]
};

function collectEmittedTypes(steps: AlgorithmStep[]): Set<string> {
	return new Set(steps.map((s) => s.type));
}

describe('讲授剧本 demoScript', () => {
	const factories: [string, EngineFactory][] = [
		[
			'QuickSortEngine',
			() => {
				const e = new QuickSortEngine();
				e.init([5, 2, 8, 1, 9]);
				return e;
			}
		],
		[
			'BubbleSortEngine',
			() => {
				const e = new BubbleSortEngine();
				e.init([5, 2, 8, 1, 9]);
				return e;
			}
		],
		[
			'InsertionSortEngine',
			() => {
				const e = new InsertionSortEngine();
				e.init([5, 2, 8, 1, 9]);
				return e;
			}
		],
		[
			'SelectionSortEngine',
			() => {
				const e = new SelectionSortEngine();
				e.init([5, 2, 8, 1, 9]);
				return e;
			}
		],
		[
			'MergeSortEngine',
			() => {
				const e = new MergeSortEngine();
				e.init([5, 2, 8, 1, 9]);
				return e;
			}
		],
		[
			'BinaryTreeEngine',
			() => {
				const e = new BinaryTreeEngine();
				e.init({ tree: [1, 2, 3, 4, 5], mode: 'preorder' });
				return e;
			}
		],
		[
			'GraphTraversalEngine',
			() => {
				const e = new GraphTraversalEngine();
				e.init({
					labels: ['0', '1', '2', '3', '4', '5'],
					edges: [
						[0, 1],
						[0, 2],
						[1, 3]
					],
					mode: 'bfs',
					start: 0
				});
				return e;
			}
		],
		[
			'MstEngine',
			() => {
				const e = new MstEngine();
				e.init({
					labels: ['0', '1', '2', '3', '4'],
					edges: [
						[0, 1, 2],
						[1, 2, 3],
						[1, 4, 5]
					],
					mode: 'kruskal',
					start: 0
				});
				return e;
			}
		],
		[
			'DijkstraEngine',
			() => {
				const e = new DijkstraEngine();
				e.init({
					labels: ['0', '1', '2'],
					edges: [
						[0, 1, 2],
						[1, 2, 3]
					],
					directed: true,
					start: 0
				});
				return e;
			}
		],
		[
			'TopoSortEngine',
			() => {
				const e = new TopoSortEngine();
				e.init({
					labels: ['0', '1', '2', '3'],
					edges: [
						[0, 1],
						[0, 2],
						[1, 3]
					]
				});
				return e;
			}
		],
		[
			'CriticalPathEngine',
			() => {
				const e = new CriticalPathEngine();
				e.init({
					labels: ['0', '1', '2', '3'],
					edges: [
						[0, 1, 3],
						[1, 2, 4],
						[0, 2, 5]
					]
				});
				return e;
			}
		],
		[
			'BinarySearchEngine',
			() => {
				const e = new BinarySearchEngine();
				e.init({ data: [5, 13, 19, 21, 37, 56], target: 21 });
				return e;
			}
		],
		[
			'KMPEngine',
			() => {
				const e = new KMPEngine();
				e.init({ text: 'acabaabaabcacaabc', pattern: 'abaabcac' });
				return e;
			}
		],
		[
			'BstEngine',
			() => {
				const e = new BstEngine();
				e.init({ tree: [10, 5, 15, 3, 7, 12, 20], mode: 'delete', target: 15 });
				return e;
			}
		],
		[
			'HuffmanEngine',
			() => {
				const e = new HuffmanEngine();
				e.init({ weights: [4, 2, 7, 5, 9] });
				return e;
			}
		],
		[
			'HashTableEngine',
			() => {
				const e = new HashTableEngine();
				e.init({ keys: [22, 41, 53, 46, 30, 13, 1, 67], mode: 'construct', size: 11 });
				return e;
			}
		],
		[
			'SelectEngine',
			() => {
				const e = new SelectEngine();
				e.init({
					sql: 'SELECT name FROM student WHERE score > 80',
					tables: { student: STUDENT_TABLE }
				});
				return e;
			}
		]
	];

	it('提供 demoScript 的引擎：每个实际产生的步骤类型都有旁白覆盖', () => {
		for (const [name, make] of factories) {
			const e = make();
			expect(e.demoScript, `${name} 应提供 demoScript`).toBeDefined();
			const emitted = collectEmittedTypes(e.steps);
			const covered = new Set(e.demoScript!.map((m) => m.type));
			for (const t of emitted) {
				if (t === 'default') continue; // 兜底类型无需专属旁白（投影模式回落步骤描述）
				expect(covered, `${name} 缺步骤类型 ${t} 的旁白`).toContain(t);
			}
		}
	});

	it('步骤级 presenterNote 优先于类型级旁白：SelectEngine 关键步骤带专用旁白', () => {
		const e = new SelectEngine();
		e.init({
			sql: 'SELECT name FROM student WHERE score > 80',
			tables: { student: STUDENT_TABLE }
		});
		const withNote = e.steps.find((s) => s.presenterNote);
		expect(withNote).toBeDefined();
		// 注解内容应区别于类型级默认（compare 的通用旁白）
		const defaultNote = e.demoScript!.find((m) => m.type === withNote!.type);
		expect(withNote!.presenterNote).not.toBe(defaultNote?.narration);
	});
});
