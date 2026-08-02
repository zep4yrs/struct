/**
 * 单链表操作引擎 — SinglyLinkedListEngine
 *
 * 演示单链表的插入与删除基本操作（教材第 2 章线性表）。
 * data 快照为链表的值序列（不带头节点），渲染器据此画出节点与箭头。
 * 引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	Highlight,
	PracticeQuestion,
	StepType
} from '../types';

export type ListOperation = 'insert' | 'delete';

export interface ListEngineInput {
	values: number[]; // 初始链表值序列
	operation: ListOperation;
	target: number; // insert: 插入位置（1-based）；delete: 要删除的值
	value?: number; // insert: 新节点值
}

const INSERT_PSEUDO: string[] = [
	'procedure insert(head, i, x)',
	'  p = head                      // 从头开始',
	'  for j = 1 to i - 1 do',
	'    p = p.next                  // 移动到第 i-1 个节点',
	'  end for',
	'  s = new node(x)               // 创建新节点',
	'  s.next = p.next               // 新节点指向后继',
	'  p.next = s                    // 前驱指向新节点',
	'end procedure'
];

const DELETE_PSEUDO: string[] = [
	'procedure delete(head, x)',
	'  pre = head',
	'  p = head.next                 // 从头开始查找',
	'  while p != null and p.data != x do',
	'    pre = p                     // 前驱前进',
	'    p = p.next                  // 指针前进',
	'  end while',
	'  if p != null then',
	'    pre.next = p.next           // 跳过目标节点',
	'  end if',
	'end procedure'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 1,
		prompt: '在位置 3 插入新节点时，需要先找到哪个节点？',
		options: ['第 1 个节点', '第 2 个节点', '第 3 个节点', '第 4 个节点'],
		correctAnswer: '第 2 个节点',
		hint: '插入到位置 i，需要找到第 i-1 个节点作为前驱',
		explanation:
			'在单链表的第 i 个位置插入，需要先找到第 i-1 个节点（前驱），让前驱的 next 指向新节点。'
	}
];

export class SinglyLinkedListEngine implements AlgorithmEngine<ListEngineInput> {
	readonly name = '单链表操作';
	readonly renderType = 'linkedlist' as const;

	pseudocode: string[] = [];
	practiceQuestions: PracticeQuestion[] = [];

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;

	init(input: ListEngineInput): void {
		const { values, operation, target, value } = input;
		this.pseudocode = operation === 'insert' ? INSERT_PSEUDO : DELETE_PSEUDO;
		this.practiceQuestions = PRACTICE_QUESTIONS;

		this.steps = [];
		this._stepId = 0;

		const list = [...values];

		this._emit(
			'init',
			`初始链表：${list.join(' → ')}${operation === 'insert' ? `，在位置 ${target} 插入 ${value}` : `，删除值为 ${target} 的节点`}。`,
			list,
			0
		);

		if (operation === 'insert') {
			this._genInsert(list, target, value ?? 0);
		} else {
			this._genDelete(list, target);
		}

		this.totalSteps = this.steps.length;
	}

	private _genInsert(list: number[], pos: number, value: number): void {
		// 1. 创建新节点
		this._emit('compare', `创建新节点 s = ${value}。`, list, 5, [
			{ type: 'current', indices: [-1] }
		]);

		// 2. 遍历定位前驱（第 pos-1 个节点）
		for (let i = 0; i < pos - 1; i++) {
			this._emit(
				'compare',
				`p 移动到第 ${i + 1} 个节点 ${list[i]}（当前是第 ${i + 1} 个，还需前进）。`,
				list,
				3,
				[{ type: 'compare', indices: [i] }]
			);
		}

		// 3. 新节点指向后继 + 前驱指向新节点
		const after = [...list];
		after.splice(pos - 1, 0, value);
		this._emit(
			'swap',
			`s.next 指向原来第 ${pos} 个节点，p.next 指向 s，节点 ${value} 已插入到位置 ${pos}。`,
			after,
			7,
			[{ type: 'current', indices: [pos - 1] }]
		);

		this._emit('complete', `插入完成，链表变为：${after.join(' → ')}。`, after, 8);
	}

	private _genDelete(list: number[], target: number): void {
		for (let i = 0; i < list.length; i++) {
			const idx = i + 1;
			const found = idx < list.length && list[idx] === target;
			const isLast = idx >= list.length;
			if (found) {
				this._emit('compare', `p 指向节点 ${list[idx]}，等于 ${target}，查找成功。`, list, 5, [
					{ type: 'compare', indices: [idx - 1] },
					{ type: 'pivot', indices: [idx] }
				]);
				const after = [...list];
				after.splice(idx, 1);
				this._emit('swap', `pre.next = p.next，跳过节点 ${target}，节点已被删除。`, after, 8, [
					{ type: 'current', indices: [Math.max(0, idx - 1)] }
				]);
				this._emit('complete', `删除完成，链表变为：${after.join(' → ')}。`, after, 8);
				return;
			}
			if (isLast) {
				this._emit('recurse-exit', `遍历结束，链表中不存在值为 ${target} 的节点。`, list, 6);
				return;
			}
			this._emit(
				'compare',
				`p 指向节点 ${list[idx]}（${list[idx]} ≠ ${target}），pre 前移到 p，p 继续前进。`,
				list,
				4,
				[
					{ type: 'compare', indices: [idx - 1] },
					{ type: 'compare', indices: [idx] }
				]
			);
		}
	}

	private _emit(
		type: StepType,
		description: string,
		data: number[],
		pseudocodeLine: number,
		extraHighlights?: Highlight[]
	): void {
		const highlights: Highlight[] = [];
		if (extraHighlights) highlights.push(...extraHighlights);

		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [...data],
			highlights,
			pseudocodeLine
		});
	}

	getCurrentStep(): AlgorithmStep {
		return this.steps[Math.min(Math.floor(this.playbackPos), this.steps.length - 1)];
	}

	getProgress(): number {
		return this.playbackPos;
	}

	setProgress(pos: number): void {
		this.playbackPos = pos;
	}

	reset(): void {
		this.playbackPos = 0;
	}
}
