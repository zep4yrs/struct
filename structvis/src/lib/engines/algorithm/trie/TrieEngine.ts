/**
 * Trie 字典树引擎 — TrieEngine
 *
 * 教材第 4 章（串）：字典树把一组字符串按公共前缀共享存储——根为空，
 * 每个节点一个字符，从根到 isWord 节点的路径就是一个单词。
 * 演示逐个插入单词：沿路径创建/复用节点，最后标记单词结束。
 * data 快照为层序数组；trie 快照供 TrieRenderer 使用。
 */

import type {
	DemoScriptItem,
	EngineCustomConfig,
	EnginePreset,
	Highlight,
	PracticeQuestion,
	StepType,
	TrieData
} from '../types';
import { EngineBase } from '../EngineBase';

const PSEUDO: string[] = [
	'// Trie 插入',
	'procedure trieInsert(root, word)',
	'  p = root',
	'  for each char c in word do',
	'    if p 没有 c 的孩子 then 创建节点',
	'    p = p.c 的孩子',
	'  end for',
	'  p.isWord = true',
	'end procedure',
	'',
	'// 共享前缀：abc 和 abd 共用 ab 路径',
	'// 查找：沿字符路径走，isWord 标记单词结束'
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
	{
		type: 'choose-next',
		stepIndex: 4,
		prompt: 'Trie 中两个单词共享的部分叫什么？',
		options: ['哈希值', '公共前缀', '后缀', '哨兵'],
		correctAnswer: '公共前缀',
		hint: '相同开头的单词共用同一段路径',
		explanation:
			'Trie 的核心是公共前缀共享：如 cat 和 car 共用 c-a 路径，只差最后一个字符分支。这使前缀查询（自动补全）非常高效，复杂度只与单词长度有关。'
	}
];

export class TrieEngine extends EngineBase<string[]> {
	readonly name = 'Trie 字典树';
	readonly renderType = 'trie' as const;

	pseudocode: string[] = PSEUDO;
	practiceQuestions: PracticeQuestion[] = PRACTICE_QUESTIONS;

	readonly demoScript: DemoScriptItem[] = [
		{
			type: 'init',
			narration:
				'字典树 Trie：把一组字符串按公共前缀共享存储。根节点是空的，每个节点保存一个字符，从根到单词结束标记（双圈）的路径就是一个完整的单词。'
		},
		{
			type: 'compare',
			narration: '取出单词的当前字符，从根开始沿路径查找：有这个孩子的节点就继续走，没有就创建。'
		},
		{
			type: 'edge-candidate',
			narration: '当前字符的节点已存在：直接复用，继续下一个字符。'
		},
		{
			type: 'edge-select',
			narration: '创建新节点，把当前字符挂到路径上。'
		},
		{
			type: 'pivot-select',
			narration: '单词走完：给最后一个节点打上单词结束标记（双圈）。'
		},
		{
			type: 'complete',
			narration:
				'全部插入完成。可以看到公共前缀被多个单词共享：例如 cat 和 car 共用 c-a。前缀查询（自动补全）只需沿路径走，复杂度 O(单词长度)。'
		}
	];

	presets: EnginePreset[] = [
		{ name: '英文单词', description: 'cat, car, dog, do, dot' },
		{ name: '前缀共享', description: 'apple, apply, app, ape' }
	];

	customConfig: EngineCustomConfig = {
		title: '单词列表',
		fields: [
			{
				key: 'data',
				label: '单词（逗号分隔）',
				type: 'text',
				placeholder: '如 cat, car, dog',
				default: 'cat, car, dog, do, dot'
			}
		]
	};

	applyPreset(name: string): void {
		const data: string[] | undefined = {
			英文单词: ['cat', 'car', 'dog', 'do', 'dot'],
			前缀共享: ['apple', 'apply', 'app', 'ape']
		}[name];
		if (data) this.init(data);
	}

	applyCustom(values: Record<string, string>): void {
		const words = (values.data ?? '')
			.split(/[,，\s]+/)
			.map((w) => w.trim())
			.filter((w) => /^[a-zA-Z]+$/.test(w));
		if (words.length < 2) throw new Error('至少需要 2 个英文单词');
		this.init(words);
	}

	init(input: string[]): void {
		this.steps = [];
		this._stepId = 0;
		this._nodes = [{ char: '', isWord: false, children: [] }];
		this._root = 0;

		this._emit('init', 'Trie 字典树：插入 ' + input.join(', ') + '。公共前缀共享路径。', 0, []);

		for (const word of input) {
			this._insert(word);
		}

		this._emit('complete', '全部插入完成。公共前缀共享，前缀查询 O(单词长度)。', 6, []);
		this.totalSteps = this.steps.length;
	}

	// ---------- 内部 ----------
	private _nodes: { char: string; isWord: boolean; children: number[] }[] = [];
	private _root = 0;

	private _insert(word: string): void {
		let p = this._root;
		const path: number[] = [p];
		for (const ch of word) {
			const node = this._nodes[p];
			let next = -1;
			for (const c of node.children) {
				if (this._nodes[c].char === ch) {
					next = c;
					break;
				}
			}
			this._emit(
				'compare',
				'字符 ' + ch + '：' + (next !== -1 ? '节点已存在，复用。' : '节点不存在，需要创建。'),
				2,
				[p]
			);
			if (next === -1) {
				next = this._nodes.length;
				this._nodes.push({ char: ch, isWord: false, children: [] });
				this._nodes[p].children.push(next);
				this._emit(
					'edge-select',
					'创建节点「' + ch + '」挂在 ' + (p === this._root ? '根' : this._nodes[p].char) + ' 下。',
					3,
					[next]
				);
			} else {
				this._emit('edge-candidate', '「' + ch + '」已存在，沿路径继续。', 3, [next]);
			}
			p = next;
			path.push(p);
		}
		this._nodes[p].isWord = true;
		this._emit(
			'pivot-select',
			'单词 ' + word + ' 完成：节点「' + this._nodes[p].char + '」标记为单词结束。',
			4,
			[p]
		);
	}

	private _emit(
		type: StepType,
		description: string,
		pseudocodeLine: number,
		highlightIds: number[]
	): void {
		const highlights: Highlight[] = [];
		if (highlightIds.length) highlights.push({ type: 'current', indices: highlightIds });
		const trie: TrieData = {
			nodes: this._nodes.map((n, i) => ({
				id: i,
				char: n.char,
				isWord: n.isWord,
				children: [...n.children]
			})),
			root: this._root,
			active: highlightIds
		};
		this.steps.push({
			id: this._stepId++,
			type,
			description,
			data: [],
			highlights,
			pseudocodeLine,
			trie
		});
	}
}
