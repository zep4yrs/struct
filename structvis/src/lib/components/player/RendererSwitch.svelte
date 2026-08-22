<script lang="ts">
	import type { AlgorithmEngine } from '$lib/engines/algorithm/types';
	import ArrayRenderer from '$lib/visualization/array/ArrayRenderer.svelte';
	import TreeRenderer from '$lib/visualization/tree/TreeRenderer.svelte';
	import LinkedRenderer from '$lib/visualization/linkedlist/LinkedRenderer.svelte';
	import SqlTableRenderer from '$lib/visualization/sqltable/SqlTableRenderer.svelte';
	import StackRenderer from '$lib/visualization/stack/StackRenderer.svelte';
	import ErRenderer from '$lib/visualization/er/ErRenderer.svelte';
	import BPlusTreeRenderer from '$lib/visualization/btree/BPlusTreeRenderer.svelte';
	import GraphRenderer from '$lib/visualization/graph/GraphRenderer.svelte';
	import KmpRenderer from '$lib/visualization/kmp/KmpRenderer.svelte';
	import HuffmanRenderer from '$lib/visualization/huffman/HuffmanRenderer.svelte';
	import HashtableRenderer from '$lib/visualization/hashtable/HashtableRenderer.svelte';
	import TrieRenderer from '$lib/visualization/trie/TrieRenderer.svelte';
	import DpTableRenderer from '$lib/visualization/dptable/DpTableRenderer.svelte';
	import UnionFindRenderer from '$lib/visualization/unionfind/UnionFindRenderer.svelte';
	import MonotonicStackRenderer from '$lib/visualization/monostack/MonotonicStackRenderer.svelte';
	import SkipListRenderer from '$lib/visualization/skiplist/SkipListRenderer.svelte';
	import SundayRenderer from '$lib/visualization/sunday/SundayRenderer.svelte';
	import QueensRenderer from '$lib/visualization/queens/QueensRenderer.svelte';

	interface Props {
		engine: AlgorithmEngine<unknown>;
		playbackPos: number;
		/** 手动模拟练习透传：点击柱子的回调 / 外部选中高亮 */
		onBarClick?: (index: number) => void;
		clickSelected?: number[];
	}

	let { engine, playbackPos, onBarClick, clickSelected = [] }: Props = $props();
</script>

{#if engine.renderType === 'array'}
	<ArrayRenderer steps={engine.steps} {playbackPos} {onBarClick} {clickSelected} />
{:else if engine.renderType === 'tree'}
	<TreeRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'linkedlist'}
	<LinkedRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'sql-table'}
	<SqlTableRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'stack' || engine.renderType === 'queue'}
	<StackRenderer steps={engine.steps} {playbackPos} mode={engine.renderType} />
{:else if engine.renderType === 'er'}
	<ErRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'btree'}
	<BPlusTreeRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'graph'}
	<GraphRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'kmp'}
	<KmpRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'huffman'}
	<HuffmanRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'hashtable'}
	<HashtableRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'trie'}
	<TrieRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'dp-table'}
	<DpTableRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'union-find'}
	<UnionFindRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'monostack'}
	<MonotonicStackRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'skiplist'}
	<SkipListRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'sunday'}
	<SundayRenderer steps={engine.steps} {playbackPos} />
{:else if engine.renderType === 'queens'}
	<QueensRenderer steps={engine.steps} {playbackPos} />
{/if}
