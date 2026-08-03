/**
 * 栈与队列操作引擎 — StackQueueEngine
 *
 * 演示栈（后进先出）与队列（先进先出）的基本操作（教材第 3 章栈和队列）。
 * data 快照为元素值序列：栈为「栈底 → 栈顶」，队列为「队头 → 队尾」。
 * 引擎是纯逻辑的，不涉及任何渲染。
 */

import type {
	AlgorithmEngine,
	AlgorithmStep,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	RenderType,
	StepType
} from '../types';
import { parseNumberList } from '../parseInput';

export type StackQueueStructure = 'stack' | 'queue';
export type StackQueueOperation = 'push' | 'pop' | 'enqueue' | 'dequeue';

export interface StackQueueEngineInput {
	structure: StackQueueStructure;
	values: number[]; // 初始元素序列（栈底→栈顶 / 队头→队尾）
	operation: StackQueueOperation;
	target: number; // push/enqueue: 新元素值；pop/dequeue: 要取出的元素值（须与栈顶/队头一致）
}

const PUSH_PSEUDO: string[] = [
	'procedure push(S, x)',
	'  S.top = S.top + 1          // 栈顶指针上移',
	'  S[S.top] = x               // 新元素入栈',
	'end procedure'
];

const POP_PSEUDO: string[] = [
	'procedure pop(S)',
	'  if S.top == 0 then',
	'    return error             // 栈下溢',
	'  x = S[S.top]               // 取出栈顶元素',
	'  S.top = S.top - 1          // 栈顶指针下移',
	'  return x'
];

const ENQUEUE_PSEUDO: string[] = [
	'procedure enqueue(Q, x)',
	'  if rear == MAX then',
	'    return error             // 队满溢出',
	'  rear = rear + 1            // 队尾指针后移',
	'  Q[rear] = x                // 新元素入队',
	'end procedure'
];

const DEQUEUE_PSEUDO: string[] = [
	'procedure dequeue(Q)',
	'  if front == rear then',
	'    return error             // 队空',
	'  front = front + 1          // 队头指针后移',
	'  x = Q[front]               // 取出队头元素',
	'  return x'
];

const STACK_PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '栈的插入与删除操作都发生在哪一端？',
		options: ['栈底', '栈顶', '中间', '任意位置'],
		correctAnswer: '栈顶',
		hint: '栈是后进先出（LIFO）结构',
		explanation:
			'栈只在栈顶进行插入（压栈）和删除（出栈）操作，栈底是封闭的，因此元素后进先出。'
	}
];

const QUEUE_PRACTICE: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 2,
		prompt: '队列的入队操作发生在哪一端？',
		options: ['队头', '队尾', '中间', '任意位置'],
		correctAnswer: '队尾',
		hint: '队列是先进先出（FIFO）结构',
		explanation:
			'入队发生在队尾（rear 端），出队发生在队头（front 端），先入队的元素先出队。'
	}
];

export class StackQueueEngine implements AlgorithmEngine<StackQueueEngineInput> {
	readonly name = '栈和队列';
	renderType: RenderType = 'stack';

	pseudocode: string[] = [];
	practiceQuestions: PracticeQuestion[] = [];

	steps: AlgorithmStep[] = [];
	totalSteps = 0;
	playbackPos = 0;

	private _stepId = 0;

	presets: EnginePreset[] = [
		{ name: '压栈 66', description: '栈 [12, 99, 37, 8] 压入 66' },
		{ name: '出栈 8（栈顶）', description: '栈 [12, 99, 37, 8] 取出栈顶 8' },
		{ name: '出栈 66（错误示例）', description: '目标与栈顶不一致，操作失败' },
		{ name: '入队 66', description: '队列 [12, 99, 37, 8] 入队 66' },
		{ name: '出队 12（队头）', description: '队列 [12, 99, 37, 8] 取出队头 12' }
	];

	customConfig: EngineCustomConfig = {
		title: '自定义操作',
		fields: [
			{
				key: 'structure',
				label: '结构',
				type: 'select',
				options: [
					{ value: 'stack', label: '栈' },
					{ value: 'queue', label: '队列' }
				],
				default: 'stack'
			},
			{
				key: 'values',
				label: '初始元素',
				type: 'text',
				placeholder: '逗号分隔，如 12, 99, 37, 8',
				default: '12, 99, 37, 8'
			},
			{
				key: 'operation',
				label: '操作',
				type: 'select',
				options: [
					{ value: 'push', label: '压入' },
					{ value: 'pop', label: '取出' }
				],
				default: 'push'
			},
			{
				key: 'target',
				label: '目标值',
				type: 'text',
				placeholder: '压入或取出的值',
				default: '66'
			}
		]
	};

	applyPreset(name: string): void {
		if (name === '压栈 66') {
			this.init({ structure: 'stack', values: [12, 99, 37, 8], operation: 'push', target: 66 });
		} else if (name === '出栈 8（栈顶）') {
			this.init({ structure: 'stack', values: [12, 99, 37, 8], operation: 'pop', target: 8 });
		} else if (name === '出栈 66（错误示例）') {
			this.init({ structure: 'stack', values: [12, 99, 37, 8], operation: 'pop', target: 66 });
		} else if (name === '入队 66') {
			this.init({ structure: 'queue', values: [12, 99, 37, 8], operation: 'enqueue', target: 66 });
		} else if (name === '出队 12（队头）') {
			this.init({ structure: 'queue', values: [12, 99, 37, 8], operation: 'dequeue', target: 12 });
		}
	}

	applyCustom(values: Record<string, string>): void {
		const structure = (values.structure ?? 'stack') as StackQueueStructure;
		const seq = parseNumberList(values.values ?? '', { min: 1, max: 12, label: '元素' });
		const target = parseInt(values.target ?? '', 10);
		if (isNaN(target)) throw new Error('目标值必须是数字');

		const isInsert = values.operation !== 'pop';
		if (!isInsert) {
			const headIdx = structure === 'stack' ? seq.length - 1 : 0;
			const head = seq[headIdx];
			if (head !== target) {
				const headLabel = structure === 'stack' ? '栈顶' : '队头';
				throw new Error(`当前${headLabel}元素是 ${head}，与目标 ${target} 不一致`);
			}
		}

		const operation = isInsert
			? structure === 'stack'
				? 'push'
				: 'enqueue'
			: structure === 'stack'
				? 'pop'
				: 'dequeue';
		this.init({ structure, values: seq, operation, target });
	}

	init(input: StackQueueEngineInput): void {
		const { structure, values, operation, target } = input;
		this.renderType = structure === 'stack' ? 'stack' : 'queue';
		this.pseudocode =
			operation === 'push'
				? PUSH_PSEUDO
				: operation === 'pop'
					? POP_PSEUDO
					: operation === 'enqueue'
						? ENQUEUE_PSEUDO
						: DEQUEUE_PSEUDO;
		this.practiceQuestions = structure === 'stack' ? STACK_PRACTICE : QUEUE_PRACTICE;

		this.steps = [];
		this._stepId = 0;

		const seq = [...values];
		const label = structure === 'stack' ? '栈' : '队';
		const opName =
			operation === 'push'
				? '压栈'
				: operation === 'pop'
					? '出栈'
					: operation === 'enqueue'
						? '入队'
						: '出队';

		this._emit(
			'init',
			`初始${label}：${seq.length > 0 ? seq.join(' → ') : '(空)'}，执行${opName}操作。`,
			seq,
			0
		);

		const isInsert = operation === 'push' || operation === 'enqueue';
		if (isInsert) {
			this._genInsert(structure, seq, target);
		} else {
			this._genRemove(structure, seq, target);
		}

		this.totalSteps = this.steps.length;
	}

	/** push / enqueue：尾端插入 */
	private _genInsert(structure: StackQueueStructure, seq: number[], value: number): void {
		const tailLabel = structure === 'stack' ? '栈顶' : '队尾';
		if (structure === 'stack') {
			this._emit('compare', '栈顶指针 top 上移，为新元素腾出位置。', seq, 1);
		} else {
			this._emit('compare', '队尾指针 rear 后移，为新元素腾出位置。', seq, 3);
		}

		const after = [...seq, value];
		this._emit(
			'swap',
			`元素 ${value} 已放入${tailLabel}${structure === 'stack' ? '（后进先出）' : '（先进先出）'}。`,
			after,
			structure === 'stack' ? 2 : 4,
			[{ type: 'current', indices: [after.length - 1] }]
		);

		this._emit(
			'complete',
			`操作完成，${structure === 'stack' ? '栈' : '队'}变为：${after.join(' → ')}。`,
			after,
			3
		);
	}

	/** pop / dequeue：取出并移除 */
	private _genRemove(structure: StackQueueStructure, seq: number[], target: number): void {
		const headLabel = structure === 'stack' ? '栈顶' : '队头';
		const opName = structure === 'stack' ? '出栈' : '出队';
		if (seq.length === 0) {
			this._emit('recurse-exit', `${structure === 'stack' ? '栈' : '队'}为空，${opName}失败（下溢）。`, seq, 1);
			return;
		}

		const headIdx = structure === 'stack' ? seq.length - 1 : 0;
		const headValue = seq[headIdx];

		this._emit(
			'compare',
			`检查${structure === 'stack' ? '栈' : '队'}是否为空（当前长度 ${seq.length}）。`,
			seq,
			structure === 'stack' ? 1 : 1
		);

		if (headValue !== target) {
			this._emit(
				'recurse-exit',
				`当前${headLabel}元素是 ${headValue}，与目标 ${target} 不一致，操作失败。`,
				seq,
				structure === 'stack' ? 2 : 2
			);
			return;
		}

		this._emit(
			'pivot-select',
			`取出${headLabel}元素 ${headValue}。`,
			seq,
			structure === 'stack' ? 3 : 3,
			[{ type: 'pivot', indices: [headIdx] }]
		);

		const after = [...seq];
		after.splice(headIdx, 1);
		this._emit(
			'swap',
			`${headLabel}指针${structure === 'stack' ? '下移' : '后移'}，元素 ${headValue} 已${opName}。`,
			after,
			structure === 'stack' ? 4 : 4,
			after.length > 0 ? [{ type: 'current', indices: [structure === 'stack' ? after.length - 1 : 0] }] : []
		);

		this._emit(
			'complete',
			`操作完成，${structure === 'stack' ? '栈' : '队'}变为：${after.length > 0 ? after.join(' → ') : '(空)'}。`,
			after,
			structure === 'stack' ? 5 : 5
		);
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
