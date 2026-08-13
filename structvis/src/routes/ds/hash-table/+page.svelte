<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import { HashTableEngine } from '$lib/engines/algorithm/hash/HashTableEngine';

	const DEFAULT_KEYS = [22, 41, 53, 46, 30, 13, 1, 67];
	const DEFAULT_SIZE = 11;

	function createEngine(): HashTableEngine {
		const e = new HashTableEngine();
		e.init({ keys: DEFAULT_KEYS, mode: 'construct', size: DEFAULT_SIZE });
		return e;
	}

	let engine = $state(createEngine());
</script>

<AlgoPage sectionNum="§05" sectionName="查找" title="哈希表">
	{#snippet desc()}
		除留余数法 H(key) = key mod m 把关键字直接映射到槽位，期望一次存取。冲突不可避免：
			线性探测沿后继槽位找空位（开放定址），链地址法则把同义词挂成链表。装填因子 α = n/m
			决定冲突频率，也决定平均查找长度。
	{/snippet}
	<AlgoPlayer {engine} topicId="hash-table" topicName="哈希表" />
</AlgoPage>