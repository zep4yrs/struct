/**
 * 旁白音频生成管线 — MiMo-V2.5-TTS（https://api.xiaomimimo.com/v1/chat/completions）
 *
 * 遍历全部引擎的 demoScript，为每条旁白调用 MiMo 合成 mp3，
 * 输出 static/audio/<topicId>/<type>.mp3 并生成 src/lib/narration/audio-manifest.ts。
 *
 * 用法：
 *   1. 在 structvis/.env 配置（.gitignore 已忽略）：
 *        MIMO_API_KEY=sk-...
 *        MIMO_VOICE=冰糖          （可选：冰糖/茉莉/苏打/白桦）
 *        MIMO_STYLE=教师讲解风格… （可选：自然语言风格指令）
 *   2. npx vitest run --config scripts/narration.vitest.config.ts
 *
 * 增量：manifest 记录文本 hash，文本未变且文件存在则跳过，可重复执行。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// === 引擎 → topicId 映射（与 routes 页面一一对应） ===
import { QuickSortEngine } from '../src/lib/engines/algorithm/quicksort/QuickSortEngine';
import { BubbleSortEngine } from '../src/lib/engines/algorithm/basicsort/BubbleSortEngine';
import { InsertionSortEngine } from '../src/lib/engines/algorithm/basicsort/InsertionSortEngine';
import { SelectionSortEngine } from '../src/lib/engines/algorithm/basicsort/SelectionSortEngine';
import { MergeSortEngine } from '../src/lib/engines/algorithm/basicsort/MergeSortEngine';
import { BinaryTreeEngine } from '../src/lib/engines/algorithm/binarytree/BinaryTreeEngine';
import { GraphTraversalEngine } from '../src/lib/engines/algorithm/graph/GraphTraversalEngine';
import { GraphStorageEngine } from '../src/lib/engines/algorithm/graph/GraphStorageEngine';
import { MstEngine } from '../src/lib/engines/algorithm/graph/MstEngine';
import { DijkstraEngine } from '../src/lib/engines/algorithm/graph/DijkstraEngine';
import { TopoSortEngine } from '../src/lib/engines/algorithm/graph/TopoSortEngine';
import { CriticalPathEngine } from '../src/lib/engines/algorithm/graph/CriticalPathEngine';
import { BinarySearchEngine } from '../src/lib/engines/algorithm/search/BinarySearchEngine';
import { KMPEngine } from '../src/lib/engines/algorithm/search/KMPEngine';
import { BstEngine } from '../src/lib/engines/algorithm/bst/BstEngine';
import { HuffmanEngine } from '../src/lib/engines/algorithm/huffman/HuffmanEngine';
import { HashTableEngine } from '../src/lib/engines/algorithm/hash/HashTableEngine';
import { SinglyLinkedListEngine } from '../src/lib/engines/algorithm/linkedlist/SinglyLinkedListEngine';
import { StackQueueEngine } from '../src/lib/engines/algorithm/stackqueue/StackQueueEngine';
import { SelectEngine } from '../src/lib/engines/sql/SelectEngine';
import { AdvancedQueryEngine } from '../src/lib/engines/sql/AdvancedQueryEngine';
import { DmlEngine } from '../src/lib/engines/sql/DmlEngine';
import { TransactionEngine } from '../src/lib/engines/db/TransactionEngine';
import { ProcedureEngine } from '../src/lib/engines/sql/ProcedureEngine';
import { TriggerEngine } from '../src/lib/engines/sql/TriggerEngine';
import { WindowFunctionEngine } from '../src/lib/engines/sql/WindowFunctionEngine';
import { ViewEngine } from '../src/lib/engines/sql/ViewEngine';
import { ExplainEngine } from '../src/lib/engines/sql/ExplainEngine';
import { ErEngine } from '../src/lib/engines/db/ErEngine';
import { IndexEngine } from '../src/lib/engines/db/IndexEngine';
import { NormalizeEngine } from '../src/lib/engines/db/NormalizeEngine';
import { HeapSortEngine } from '../src/lib/engines/algorithm/basicsort/HeapSortEngine';
import { ShellSortEngine } from '../src/lib/engines/algorithm/basicsort/ShellSortEngine';
import { RadixSortEngine } from '../src/lib/engines/algorithm/basicsort/RadixSortEngine';
import { AvlEngine } from '../src/lib/engines/algorithm/avl/AvlEngine';
import { JoinEngine } from '../src/lib/engines/sql/JoinEngine';
import { LeftJoinEngine } from '../src/lib/engines/sql/LeftJoinEngine';
import { GroupByEngine } from '../src/lib/engines/sql/GroupByEngine';
import { LinearProbeEngine } from '../src/lib/engines/algorithm/hash/LinearProbeEngine';
import { RedBlackTreeEngine } from '../src/lib/engines/algorithm/rbtree/RedBlackTreeEngine';
import { TrieEngine } from '../src/lib/engines/algorithm/trie/TrieEngine';
import { AStarEngine } from '../src/lib/engines/algorithm/graph/AStarEngine';
import { SubQueryEngine } from '../src/lib/engines/sql/SubQueryEngine';
import { IsolationEngine } from '../src/lib/engines/sql/IsolationEngine';

type EngineLike = { demoScript?: { type: string; narration: string }[] };

const ENGINE_MAP: { topicId: string; make: () => EngineLike }[] = [
	{ topicId: 'quick-sort', make: () => new QuickSortEngine() },
	{ topicId: 'bubble-sort', make: () => new BubbleSortEngine() },
	{ topicId: 'insertion-sort', make: () => new InsertionSortEngine() },
	{ topicId: 'selection-sort', make: () => new SelectionSortEngine() },
	{ topicId: 'merge-sort', make: () => new MergeSortEngine() },
	{ topicId: 'binary-tree', make: () => new BinaryTreeEngine() },
	{ topicId: 'graph-traversal', make: () => new GraphTraversalEngine() },
	{ topicId: 'graph-storage', make: () => new GraphStorageEngine() },
	{ topicId: 'mst', make: () => new MstEngine() },
	{ topicId: 'dijkstra', make: () => new DijkstraEngine() },
	{ topicId: 'topo-sort', make: () => new TopoSortEngine() },
	{ topicId: 'critical-path', make: () => new CriticalPathEngine() },
	{ topicId: 'binary-search', make: () => new BinarySearchEngine() },
	{ topicId: 'kmp', make: () => new KMPEngine() },
	{ topicId: 'bst', make: () => new BstEngine() },
	{ topicId: 'huffman', make: () => new HuffmanEngine() },
	{ topicId: 'hash-table', make: () => new HashTableEngine() },
	{ topicId: 'linear-list', make: () => new SinglyLinkedListEngine() },
	{ topicId: 'stack-queue', make: () => new StackQueueEngine() },
	{ topicId: 'sql', make: () => new SelectEngine() },
	{ topicId: 'advanced-query', make: () => new AdvancedQueryEngine() },
	{ topicId: 'update', make: () => new DmlEngine() },
	{ topicId: 'transaction', make: () => new TransactionEngine() },
	{ topicId: 'procedures', make: () => new ProcedureEngine() },
	{ topicId: 'triggers', make: () => new TriggerEngine() },
	{ topicId: 'window-function', make: () => new WindowFunctionEngine() },
	{ topicId: 'view', make: () => new ViewEngine() },
	{ topicId: 'explain-plan', make: () => new ExplainEngine() },
	{ topicId: 'er', make: () => new ErEngine() },
	{ topicId: 'index', make: () => new IndexEngine() },
	{ topicId: 'normalize', make: () => new NormalizeEngine() },
	{ topicId: 'heap-sort', make: () => new HeapSortEngine() },
	{ topicId: 'shell-sort', make: () => new ShellSortEngine() },
	{ topicId: 'radix-sort', make: () => new RadixSortEngine() },
	{ topicId: 'avl', make: () => new AvlEngine() },
	{ topicId: 'join', make: () => new JoinEngine() },
	{ topicId: 'left-join', make: () => new LeftJoinEngine() },
	{ topicId: 'group-by', make: () => new GroupByEngine() },
	{ topicId: 'hash-probing', make: () => new LinearProbeEngine() },
	{ topicId: 'rbtree', make: () => new RedBlackTreeEngine() },
	{ topicId: 'trie', make: () => new TrieEngine() },
	{ topicId: 'astar', make: () => new AStarEngine() },
	{ topicId: 'subquery', make: () => new SubQueryEngine() },
	{ topicId: 'isolation', make: () => new IsolationEngine() }
];

// === 工具 ===
const ROOT = path.resolve(import.meta.dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'static', 'audio');
const MANIFEST_FILE = path.join(ROOT, 'src', 'lib', 'narration', 'audio-manifest.ts');

function loadEnv(): { key: string; voice: string; style: string } {
	const envPath = path.join(ROOT, '.env');
	let key = '';
	let voice = '冰糖';
	let style = '教师讲解风格，语速适中，吐字清晰，温和耐心，适合课堂演示';
	if (existsSync(envPath)) {
		for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
			const m = line.match(/^([A-Z_]+)=(.*)$/);
			if (!m) continue;
			if (m[1] === 'MIMO_API_KEY') key = m[2].trim();
			if (m[1] === 'MIMO_VOICE') voice = m[2].trim() || voice;
			if (m[1] === 'MIMO_STYLE') style = m[2].trim() || style;
		}
	}
	if (!key) throw new Error('缺少 MIMO_API_KEY：请在 structvis/.env 配置');
	return { key, voice, style };
}

function hashText(text: string): string {
	return createHash('sha1').update(text, 'utf-8').digest('hex').slice(0, 12);
}

async function synthesize(
	text: string,
	voice: string,
	style: string,
	key: string
): Promise<Buffer> {
	const body = {
		model: 'mimo-v2.5-tts',
		messages: [
			{ role: 'user', content: style },
			{ role: 'assistant', content: text }
		],
		audio: { format: 'mp3', voice }
	};
	let lastErr: unknown;
	for (let attempt = 0; attempt < 3; attempt++) {
		if (attempt > 0) await new Promise((r) => setTimeout(r, 1500 * attempt));
		try {
			const res = await fetch('https://api.xiaomimimo.com/v1/chat/completions', {
				method: 'POST',
				headers: { 'api-key': key, 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const txt = await res.text();
			if (!res.ok) {
				lastErr = new Error('HTTP ' + res.status + ': ' + txt.slice(0, 200));
				if (res.status === 429 || res.status >= 500) continue;
				throw lastErr;
			}
			const data = JSON.parse(txt) as { choices?: { message?: { audio?: { data?: string } } }[] };
			const b64 = data.choices?.[0]?.message?.audio?.data;
			if (!b64) throw new Error('响应缺少 audio.data');
			return Buffer.from(b64, 'base64');
		} catch (err) {
			lastErr = err;
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function parseManifest(): Record<
	string,
	Record<string, { file?: string; text?: string; hash?: string }>
> | null {
	if (!existsSync(MANIFEST_FILE)) return null;
	const raw = readFileSync(MANIFEST_FILE, 'utf-8');
	// 只匹配 audioManifest: ... = { ... }; 的字面量（避开 interface 的花括号）
	const m = raw.match(/audioManifest[\s\S]*?=\s*(\{[\s\S]*\});/);
	if (!m) return null;
	try {
		return JSON.parse(m[1]);
	} catch {
		return null;
	}
}

describe('旁白音频生成（MiMo-V2.5-TTS）', () => {
	it('为所有引擎的 demoScript 生成 mp3 并写出 manifest', async () => {
		const { key, voice, style } = loadEnv();
		const oldManifest = parseManifest();

		// 收集全部任务
		const tasks: {
			topicId: string;
			type: string;
			narration: string;
			file: string;
			hash: string;
		}[] = [];
		for (const { topicId, make } of ENGINE_MAP) {
			const e = make();
			if (!e.demoScript || e.demoScript.length === 0) continue;
			for (const item of e.demoScript) {
				tasks.push({
					topicId,
					type: item.type,
					narration: item.narration,
					file: path.join(AUDIO_DIR, topicId, item.type + '.mp3'),
					hash: hashText(item.narration)
				});
			}
		}

		let generated = 0;
		let skipped = 0;
		const failed: string[] = [];

		const CONCURRENCY = 3;
		let cursor = 0;
		async function worker() {
			while (cursor < tasks.length) {
				const t = tasks[cursor++];
				// 增量：文件存在且 manifest hash 一致 → 跳过
				const old = oldManifest?.[t.topicId]?.[t.type];
				if (existsSync(t.file) && old && old.hash === t.hash) {
					skipped++;
					continue;
				}
				try {
					const buf = await synthesize(t.narration, voice, style, key);
					mkdirSync(path.dirname(t.file), { recursive: true });
					writeFileSync(t.file, buf);
					generated++;
					console.log(
						'  ✓ ' + t.topicId + '/' + t.type + ' ' + (buf.length / 1024).toFixed(0) + 'KB'
					);
				} catch (err) {
					failed.push(t.topicId + '/' + t.type + ': ' + (err as Error).message);
					console.error('  ✗ ' + t.topicId + '/' + t.type + ': ' + (err as Error).message);
				}
			}
		}
		await Promise.all(Array.from({ length: CONCURRENCY }, worker));

		// 写 manifest
		const manifest: Record<
			string,
			Record<string, { file: string; text: string; hash: string }>
		> = {};
		for (const t of tasks) {
			(manifest[t.topicId] ??= {})[t.type] = {
				file: t.type + '.mp3',
				text: t.narration,
				hash: t.hash
			};
		}
		mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
		const ts = [
			'/**',
			' * 旁白音频清单 — 由 scripts/generate-narration.spec.ts 生成，勿手改。',
			' * 换音色/改文案后重跑：npx vitest run --config scripts/narration.vitest.config.ts',
			' */',
			'export interface NarrationAudioEntry {',
			'	file: string;',
			'	text: string;',
			'	hash: string;',
			'}',
			'export const audioManifest: Record<string, Record<string, NarrationAudioEntry>> = ' +
				JSON.stringify(manifest, null, '\t') +
				';',
			''
		].join('\n');
		writeFileSync(MANIFEST_FILE, ts, 'utf-8');

		console.log(
			'\n完成：生成 ' + generated + ' 段，跳过 ' + skipped + ' 段，失败 ' + failed.length + ' 段'
		);
		if (failed.length > 0) console.log('失败明细：\n' + failed.join('\n'));

		expect(generated + skipped).toBe(tasks.length);
		expect(failed.length).toBe(0);
	});
});
