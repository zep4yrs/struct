<script lang="ts">
	import AlgoPage from '$lib/components/layout/AlgoPage.svelte';
	import AlgoPlayer from '$lib/components/player/AlgoPlayer.svelte';
	import {
		SinglyLinkedListEngine,
		type ListEngineInput
	} from '$lib/engines/algorithm/linkedlist/SinglyLinkedListEngine';

	function createEngine(input: ListEngineInput): SinglyLinkedListEngine {
		const e = new SinglyLinkedListEngine();
		e.init(input);
		return e;
	}

	let engine = $state(
		createEngine({ values: [12, 99, 37, 8], operation: 'insert', target: 3, value: 66 })
	);
</script>

<AlgoPage sectionNum="§02" sectionName="线性结构" title="单链表">
	{#snippet desc()}
		链表用指针链接节点，插入与删除只需要修改前驱的 next 指针，无需移动其他元素。
		关键思想：插入先找前驱，删除先遍历定位。观察下方动画中 <span class="mono">p</span> 指针的移动规律。
	{/snippet}
	<AlgoPlayer {engine} topicId="linear-list" topicName="单链表基本操作" />
</AlgoPage>
