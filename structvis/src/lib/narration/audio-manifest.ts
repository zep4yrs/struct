/**
 * 旁白音频清单 — 由 scripts/generate-narration.spec.ts 生成，勿手改。
 * 换音色/改文案后重跑：npx vitest run --config scripts/narration.vitest.config.ts
 */
export interface NarrationAudioEntry {
	file: string;
	text: string;
	hash: string;
}
export const audioManifest: Record<string, Record<string, NarrationAudioEntry>> = {
	"quick-sort": {
		"init": {
			"file": "init.mp3",
			"text": "这是快速排序的输入数组。整体思路只有三步：选基准、分区、递归。每一轮分区都会把基准元素放到它最终的位置上，所有元素归位后数组自然有序。",
			"hash": "103bf8bbbba6"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "选定基准（pivot）：这里取当前区间的最后一个元素。基准的最终位置将在这一轮分区后确定。",
			"hash": "aec55755c408"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "开始分区：i 指向\"小于区\"的右边界，j 从头扫描，把小元素通过交换丢到左边。",
			"hash": "951eff8f8ee2"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "j 指针向右扫描：把当前元素和基准比较，小于等于基准的元素会进入左侧的\"小于区\"。",
			"hash": "f7213690303a"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "交换：把小于基准的元素换到左边的\"小于区\"，大于基准的留在右边，让分区逐步推进。",
			"hash": "f43e8bc61661"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "分区完成：基准被放到它最终的位置，左边全小于它、右边全大于它。基准已经\"归位\"，不会再移动。",
			"hash": "6fd171cb64f8"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "递归：基准左右两侧互不影响，分别对左、右子区间重复\"选基准 + 分区\"的过程。",
			"hash": "eaf8a58545b5"
		},
		"recurse-exit": {
			"file": "recurse-exit.mp3",
			"text": "该区间的递归完成返回。小区间只有一个或零个元素时自然有序，直接返回。",
			"hash": "087b338c575a"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成！快速排序平均时间复杂度 O(n log n)，空间复杂度 O(log n)（递归栈）。注意：最坏情况（如已有序数组）会退化到 O(n²)。",
			"hash": "6d901ec95eff"
		}
	},
	"bubble-sort": {
		"init": {
			"file": "init.mp3",
			"text": "冒泡排序的思路：每一轮从头到尾比较相邻元素，把最大的数\"冒泡\"到末尾。共需要 n-1 轮，每轮少比较一个元素。",
			"hash": "9659b82c99d0"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "新一轮开始。左侧是待排序区间，右侧灰色部分已经是排好序的，不再参与比较。",
			"hash": "e4909c1a0b95"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "比较相邻两个元素：如果左边的更大，就交换它们，让较大的数向后\"上浮\"。",
			"hash": "9389d2cee4bf"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "交换完成，大数向后移动一位。继续向后比较。",
			"hash": "9522e1b131ec"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "本轮结束，最大数已就位到区间末尾。下一轮待排序区间缩短一个元素。",
			"hash": "bc95357d4ec5"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。冒泡排序时间复杂度 O(n²)，每轮结束后最大元素都会\"沉底\"——这就是名字的由来。",
			"hash": "e3fbfa0fc1be"
		}
	},
	"insertion-sort": {
		"init": {
			"file": "init.mp3",
			"text": "插入排序的思路：像整理扑克牌一样，把待排序的元素逐个插入到左边已有序的序列中。第 1 个元素天然有序，从第 2 个元素开始往前插。",
			"hash": "a28f24313b88"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "左侧灰色区域已经有序。现在拿出下一个元素，与前面的元素从右往左比较，找它该插入的位置。",
			"hash": "c67cf7657c70"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "把当前元素与前面的元素比较：如果前面的更大，就把它向后挪一位，给待插入元素腾出位置。",
			"hash": "40cff6569366"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "前一个元素向后挪动，比较窗口继续左移。",
			"hash": "1e818047d5a2"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。插入排序时间复杂度 O(n²)，但对近乎有序的数据效率很高，适合小规模数据。",
			"hash": "fc55071f59b8"
		}
	},
	"selection-sort": {
		"init": {
			"file": "init.mp3",
			"text": "选择排序的思路：每一轮在未排序区间里找到最小的元素，把它放到区间的最前面。共 n-1 轮，每轮确定一个元素的最终位置。",
			"hash": "730172ef6e75"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "左侧灰色区域已就位，右侧是待排序区间。现在在待排序区间中扫描，找到最小值。",
			"hash": "84ad34f154a5"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "当前假定的最小元素（基准）已选定：把它与后续元素逐个比较，找出真正的最小值。",
			"hash": "76af99e147f8"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "依次比较，记录当前找到的最小值的位置，与后续元素逐个比较。",
			"hash": "8a5349d1eef4"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "扫描结束：把最小值与区间首元素交换，最小值就位。",
			"hash": "a5590d7141c6"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "本轮最小元素已固定，待排序区间从下一位重新开始。",
			"hash": "4a7b67b12757"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。选择排序始终执行 O(n²) 次比较，但交换次数最少（至多 n-1 次），适合交换代价高的场景。",
			"hash": "28afc0cb6743"
		}
	},
	"merge-sort": {
		"init": {
			"file": "init.mp3",
			"text": "归并排序的思路：分治。先把数组对半拆成越来越小的子数组，再两两合并成有序数组。合并时保证有序，最终整个数组有序。",
			"hash": "b882c2cb8432"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "新一轮归并开始：相邻的已有序子序列按相同长度两两合并，子序列长度逐轮翻倍。",
			"hash": "503db4a85404"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "合并两个有序子区间：i、j 两个指针分别指向两个区间的头部，比较后把较小者写入辅助数组。",
			"hash": "f04766b1ed7e"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "合并结果写回原数组，这个区间现在有序。",
			"hash": "164636e4c5bb"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "本轮所有子序列合并完毕，数组整体有序程度提高，进入下一轮（区间长度翻倍）。",
			"hash": "5bd7af695764"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。归并排序稳定，时间复杂度恒为 O(n log n)，但需要 O(n) 的额外空间。",
			"hash": "6c77d36c636b"
		}
	},
	"binary-tree": {
		"init": {
			"file": "init.mp3",
			"text": "这是用层序编码表示的一棵二叉树。遍历就是按照某种顺序\"访问\"每个节点一次。这里演示先序 / 中序 / 后序 / 层序四种遍历。",
			"hash": "6395406ee67d"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "递归进入子树。先序：根→左→右；中序：左→根→右；后序：左→右→根。区别只在\"访问根\"发生在什么时候。",
			"hash": "144a2b617990"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "访问当前节点，把它的值记入遍历序列。",
			"hash": "265ff43e9bde"
		},
		"recurse-exit": {
			"file": "recurse-exit.mp3",
			"text": "当前子树访问完毕，递归返回上一层。",
			"hash": "b38b3f0fc101"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "遍历完成。层序遍历按层从上到下、每层从左到右，其他三种则是深度优先，靠递归栈实现。",
			"hash": "c082921e6c03"
		}
	},
	"graph-traversal": {
		"init": {
			"file": "init.mp3",
			"text": "这是一个无向图：圆圈是顶点，连线是边。遍历就是按某种规则不重复地访问每个顶点一次。图可以用邻接矩阵或邻接表存储，遍历算法只关心\"每个顶点的邻居是谁\"。",
			"hash": "b854520f7408"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "发现未访问的邻居，把它加入待访问集合：广度优先用队列（先来先访问），深度优先递归深入。",
			"hash": "c47ac8b6c803"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "从待访问集合取出当前顶点并访问，把它记入访问序列。",
			"hash": "3429f0328e05"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "遍历完成。BFS 像水波逐层扩散，适合求最短路径；DFS 像钻头一路向下，适合判断连通性与拓扑排序。",
			"hash": "d1d9c3f50f4f"
		}
	},
	"graph-storage": {
		"init": {
			"file": "init.mp3",
			"text": "图的存储是把顶点之间的关系\"翻译\"成计算机能高效读写的数据结构。最经典的两种：邻接矩阵（二维数组）和邻接表（数组+链表）。",
			"hash": "6613e9f9c1c0"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "邻接矩阵：天然支持 O(1) 查边，但空间 O(V²)；邻接表：空间 O(V+E)，省内存，但查边要遍历链表。",
			"hash": "2b3381436edd"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "稀疏图（边少）用邻接表更省空间；稠密图（边多）邻接矩阵反而更简单。选择合适的存储结构是图算法的第一步。",
			"hash": "635319378321"
		}
	},
	"mst": {
		"init": {
			"file": "init.mp3",
			"text": "带权无向图的最小生成树（MST）：用 n-1 条边连通全部 n 个顶点，且边权总和最小。两种经典算法——Prim 从一个顶点逐步\"长\"出一棵树，Kruskal 把边按权从小到大挑、只要不成环就收。",
			"hash": "302472743086"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "扫描当前候选边：Prim 收集树与树外顶点之间的全部边，Kruskal 按权从小到大取一条边。",
			"hash": "bb723c1d2fa6"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "选中权最小（且不构成回路）的边，把新顶点并入生成树。",
			"hash": "08c3893aa84b"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "这条边的两端已经连通，若加入会形成回路，丢弃它。",
			"hash": "5921c137c80a"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "生成树完成：恰好 n-1 条边连通全部顶点，且边权总和最小。两种算法殊途同归，都可用于网络布线、电力管网等场景。",
			"hash": "023ee846273e"
		}
	},
	"dijkstra": {
		"init": {
			"file": "init.mp3",
			"text": "单源最短路径：给定源点，求它到每个顶点的最短距离。Dijkstra 的思路是不断确定一个\"距离已最小\"的顶点，再用它去更新（松弛）其他顶点——贪心加松弛，关键前提是边权非负。",
			"hash": "6bc9d52fe087"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "在尚未确定的顶点里，选 dist 最小的一个确定下来——它的最短路径从此不再改变。",
			"hash": "ef07d45f79fd"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "松弛出边：如果绕道当前顶点能让邻居的 dist 更小，就更新它（红色数字随之变化）。",
			"hash": "97da46eadbd5"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "绕道并不会更短，这条出边保持原状。",
			"hash": "31514eba7036"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "全部顶点确定完毕，图中深色边构成最短路径树。dist 就是源点到各顶点的最短距离，最短路径可在路径树中回溯得到。",
			"hash": "90c485c852df"
		}
	},
	"topo-sort": {
		"init": {
			"file": "init.mp3",
			"text": "拓扑排序：把有向无环图（DAG）的所有顶点排成一个线性序列，使每条边都从前指向后——常用于选课顺序、工程工序。顶点下方的数字是当前入度（指向它的边数）。",
			"hash": "b77c5d1e1d71"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "入度为 0 的顶点没有前置依赖，可以排到当前位，把它们加入队列。",
			"hash": "5dcb8d30547b"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "输出队列头顶点并删除它的全部出边，受影响邻居的入度减 1。",
			"hash": "de20a778e75d"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "还有顶点剩余但入度都不为 0，说明图中存在环，无法完成拓扑排序。",
			"hash": "aa4f8c48f4e6"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "拓扑排序完成。有环的图无法拓扑排序；拓扑序列通常不唯一——本例中 1 和 2 的先后可互换，都是合法序列。",
			"hash": "ab068dd87c74"
		}
	},
	"critical-path": {
		"init": {
			"file": "init.mp3",
			"text": "AOE 网络：顶点表示事件，边表示活动，边上的数字是活动耗时。关键路径是图中最长路径——它决定整个工程的总工期，其上的活动（关键活动）延误一天，总工期就延误一天。",
			"hash": "ca42f452164a"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "先按拓扑序确定事件的先后，再用它计算最早/最晚发生时间。",
			"hash": "cd14d80a0a0e"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "扫描相关边：ve 取入边中的最大值，vl 取出边中的最小值。",
			"hash": "2144407722b9"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "该活动最早开始与最晚开始不同步，可以延误，不是关键活动。",
			"hash": "c5faa7bf9606"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "关键活动连成关键路径，总工期 = 汇点最早发生时间。想缩短工期，只能从关键活动下手；非关键活动适当延误不影响整体进度。",
			"hash": "75ff8847053c"
		}
	},
	"binary-search": {
		"init": {
			"file": "init.mp3",
			"text": "二分查找的前提是数据有序。每次取区间中点与目标比较：相等即命中；中点偏大就只查左半，中点偏小就只查右半，每轮区间减半。",
			"hash": "0697035f0dde"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "计算区间中点 mid，与目标 x 比较，据此收缩查找区间。",
			"hash": "d8af7d1c4879"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "中点恰好等于目标值，查找命中！",
			"hash": "bdd8b185f4be"
		},
		"recurse-exit": {
			"file": "recurse-exit.mp3",
			"text": "区间已为空（low > high），目标不存在于表中，查找失败。",
			"hash": "e676c645656c"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "查找结束。二分查找的时间复杂度 O(log₂n)：规模每翻一倍只多一次比较，对有序静态数据极其高效。",
			"hash": "a47e4fec6bc6"
		}
	},
	"kmp": {
		"init": {
			"file": "init.mp3",
			"text": "串匹配：在长文本中查找模式串。暴力匹配每次失配都要回退文本指针 i；KMP 预处理出 next 数组，失配时让模式右滑，i 从不回退。",
			"hash": "049d4dc56b1e"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "比较字符：先求出 next 数组，再进入匹配。",
			"hash": "4cc5909c270c"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "字符相等，双指针前进，匹配位置前移。",
			"hash": "18d938f5f500"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "字符失配：借助 next 数组右滑模式，保持文本指针不回退。",
			"hash": "e8458b1ee4b8"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "匹配完成。KMP 时间复杂度 O(n + m)：next 数组预处理 O(m)，匹配阶段 i 只增不减。next 数组是 KMP 的灵魂，记录了模式串自身的结构。",
			"hash": "a48ba667e18b"
		}
	},
	"bst": {
		"init": {
			"file": "init.mp3",
			"text": "二叉搜索树：每个结点都满足\"左子树所有值 < 根 < 右子树所有值\"。有了这条性质，查找、插入、删除都能沿路径下行，平均 O(log n)。",
			"hash": "eb40ab7cb911"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "沿 BST 性质下行：目标小走左子树，目标大走右子树。",
			"hash": "69ebd806a020"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "比较命中或位置确定：目标已找到 / 新结点已挂上。",
			"hash": "25ea403b591c"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "目标不存在或走错方向：按 BST 性质重定向。",
			"hash": "cb5424795aed"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "进入子树继续查找。",
			"hash": "84f757efd2c8"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "操作完成。BST 的性能取决于树形：平衡时 O(log n)，退化成链则退化为 O(n)。",
			"hash": "b2b74fd6db7e"
		}
	},
	"huffman": {
		"init": {
			"file": "init.mp3",
			"text": "哈夫曼树是最小带权路径长度的二叉树：给 n 个叶子各带权值，合并时总让权最小的两棵树优先结合，权大的结点自然离根更近。",
			"hash": "a67be046e30c"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "在森林中挑选权值最小的两棵树。",
			"hash": "62e964cd9476"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "两棵最小树合并成新树，根权等于两权之和。",
			"hash": "ff1067dd6bc5"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "该树权值不是最小，本轮不参与合并。",
			"hash": "7ace4494c160"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "合并完成，森林只剩一棵树。WPL = Σ(叶子权 × 路径长度)，哈夫曼树使 WPL 最小，是前缀编码的基础。",
			"hash": "2c175f7a8c0d"
		}
	},
	"hash-table": {
		"init": {
			"file": "init.mp3",
			"text": "哈希表用散列函数 H(key) 把关键字直接映射到槽位，理想情况下一次存取。但两个关键字映射到同一槽位就会冲突，必须解决：线性探测沿后继槽位找空位，链地址法把同义词挂成链表。",
			"hash": "a19c7876e07f"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "线性探测：从 H(key) 出发依次查看后继槽位，命中或遇空槽即停。",
			"hash": "0a9b4a042912"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "冲突：目标槽位已被占用，按探测函数继续找下一个可用位置。",
			"hash": "befaf0ca32cf"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "找到空槽放入关键字 / 探测命中目标。",
			"hash": "c2e31f8d5201"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "构造完成。装填因子 α = n/m 越大冲突越多：线性探测法应控制在 0.5~0.8，链地址法则允许 α 接近 1。",
			"hash": "b8270698b815"
		}
	},
	"sql": {
		"compare": {
			"file": "compare.mp3",
			"text": "扫描 / 条件判定：逐行处理，判断是否满足条件。匹配的行保留，不匹配的剔除。",
			"hash": "7ec7403114ee"
		},
		"recurse-exit": {
			"file": "recurse-exit.mp3",
			"text": "当前阶段完成，结果集合变小/变形，进入到下一个 SQL 执行阶段。",
			"hash": "dde8bacc805f"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "进入下一个执行阶段：分组、投影、去重、排序或截断，逐步逼近最终结果。",
			"hash": "beca6ee385c2"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "查询执行完毕。SELECT 按 FROM → WHERE → GROUP BY → SELECT 投影 → DISTINCT → ORDER BY → LIMIT 的顺序执行。",
			"hash": "9f70934e4c89"
		}
	},
	"advanced-query": {
		"compare": {
			"file": "compare.mp3",
			"text": "高级子句的执行时机与 WHERE 不同：HAVING 在分组后筛组、外连接保留主表全部行。",
			"hash": "a470a10f662e"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "逐个处理：或逐组判定 HAVING、或逐行找右表匹配、或逐行执行相关子查询。",
			"hash": "07c0845a24e9"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "查询执行完毕。记住：HAVING 筛组、LEFT JOIN 留左、UNION 并集去重、EXISTS 逐行判存在。",
			"hash": "9d597c18fdc9"
		}
	},
	"transaction": {
		"compare": {
			"file": "compare.mp3",
			"text": "事务把一组操作打包：要么全部生效（COMMIT），要么全部撤销（ROLLBACK）。",
			"hash": "33c92bfd7749"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "观察余额变化与状态列：未提交的修改仅对当前事务可见，提交后才对外生效。",
			"hash": "b72530a81684"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "ACID：原子性要么全做要么全不做、一致性守恒、隔离性互不干扰、持久性提交即永存。",
			"hash": "9d81cf6511ec"
		}
	},
	"procedures": {
		"init": {
			"file": "init.mp3",
			"text": "存储过程（Stored Procedure）是预编译的 SQL 语句集，带参数、变量、控制流，可重复调用。",
			"hash": "5fd52d590fee"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "调用存储过程时，数据库执行过程体：先声明变量，再逐语句执行，分支和循环改变执行顺序。",
			"hash": "a16f5587f63f"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "存储过程把业务逻辑封装在数据库层，减少网络往返，但调试比应用层代码复杂。",
			"hash": "68f2d4172c41"
		}
	},
	"triggers": {
		"init": {
			"file": "init.mp3",
			"text": "触发器（Trigger）是数据库自动执行的存储程序，当 DML 事件（INSERT/UPDATE/DELETE）发生时自动调用。",
			"hash": "6babd6a78ea9"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "触发器分 BEFORE 和 AFTER 两种：BEFORE 在 DML 执行前触发（可修改数据），AFTER 在 DML 执行后触发（常用于日志）。",
			"hash": "39f003a12614"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "触发器保证业务规则自动执行，但过度使用会增加维护复杂度，需权衡利弊。",
			"hash": "aebd8a8a88ab"
		}
	},
	"window-function": {
		"init": {
			"file": "init.mp3",
			"text": "窗口函数在\"分组 + 组内排序\"的基础上逐行计算，是 SQL 高级查询的核心工具。",
			"hash": "2978d3d32fd4"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "按 PARTITION BY 列把行分组：每个分组拥有独立的计算窗口。",
			"hash": "10948b40c77a"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "组内按 ORDER BY 排序，随后逐行计算窗口函数值。",
			"hash": "adb25be7d0c7"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "窗口函数计算完成：每行得到组内序号/排名/累计值，且不折叠行数（与 GROUP BY 不同）。",
			"hash": "9a24ba1a91ae"
		}
	},
	"view": {
		"compare": {
			"file": "compare.mp3",
			"text": "视图定义只保存查询语句，不保存数据。查询视图时，数据库实时执行这条 SELECT。",
			"hash": "70447249acb7"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "底层 SELECT 按 FROM → WHERE → SELECT 投影的顺序执行，逐步得到视图的结果集。",
			"hash": "c07f41ffdf00"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "视图完成：基表数据变化会自动反映到视图结果中。视图用于简化查询、隐藏敏感列、提供逻辑独立性。",
			"hash": "f74ff990963f"
		}
	},
	"explain-plan": {
		"init": {
			"file": "init.mp3",
			"text": "优化器根据统计信息为查询生成候选执行计划，并选择代价最小的一个。",
			"hash": "e1343a79c599"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "估算候选计划：读取的行数与代价。",
			"hash": "72a3cf28172f"
		},
		"recurse-enter": {
			"file": "recurse-enter.mp3",
			"text": "对比各计划代价，选择最优执行方案。",
			"hash": "40530b3f6283"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "执行选中的计划并返回结果。索引不是越多越好——写多读少的表要考虑维护成本。",
			"hash": "aa298008024a"
		}
	},
	"heap-sort": {
		"init": {
			"file": "init.mp3",
			"text": "堆排序的思路：先把数组调整成一个大根堆（父节点不小于孩子），然后反复把堆顶——也就是最大值——与堆末尾交换，每轮确定一个最大值就位。",
			"hash": "983f87243f65"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "开始建堆：从最后一个非叶节点开始，自底向上逐个下滤，让每个子树都满足大根堆性质。",
			"hash": "7f8bd272642b"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "比较当前节点与它的孩子：在大根堆中，父节点应该不小于两个孩子。",
			"hash": "db8ecfbfe79f"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "选定较大的孩子作为交换对象——只有与较大的孩子交换，才能维持大根堆性质。",
			"hash": "851dd460e274"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "交换并继续下滤：节点下沉到孩子的位置，重复比较，直到满足堆性质或到达叶子。",
			"hash": "62d7491e3ead"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "建堆完成：整个数组满足大根堆性质，堆顶就是最大值。",
			"hash": "ac71e322dc0a"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。堆排序时间复杂度稳定为 O(n log n)：建堆 O(n)，每轮下滤 O(log n) 共 n 轮；空间复杂度 O(1)（就地排序）。",
			"hash": "0ac50ae6afe1"
		}
	},
	"shell-sort": {
		"init": {
			"file": "init.mp3",
			"text": "希尔排序是插入排序的改进：先按大步长把数组分成几组分别排序，让元素快速接近最终位置，再逐步缩小步长，最后一轮步长为 1 时就是普通插入排序。",
			"hash": "c507febafcc2"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "开始新一轮：步长为 gap，数组被分成若干组，每组内做插入排序。",
			"hash": "952250f09228"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "在组内比较并后移：把当前元素与它前面相隔 gap 的元素比较，大的后移。",
			"hash": "693b4017d7a0"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "插入到正确位置：组内元素前移后，把当前元素放到空出来的位置。",
			"hash": "6021fa850ade"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "本轮完成：gap 减半，继续下一轮更精细的排序。",
			"hash": "59b7df395d39"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。希尔排序的时间复杂度取决于增量序列，平均约 O(n^1.3)；它是不稳定排序，但比简单插入排序快得多，且同样就地排序。",
			"hash": "416b8942d951"
		}
	},
	"radix-sort": {
		"init": {
			"file": "init.mp3",
			"text": "基数排序不做元素比较，而是按数字的每一位分桶：先按个位分 0-9 十个桶，按序收集；再按十位分桶收集，逐位处理，直到最高位。",
			"hash": "ffbe6cd603d4"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "开始处理某一位：把每个元素按该位数字放入对应的桶（0-9）。",
			"hash": "7b0720828d9a"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "取元素的当前位数字，决定它进入哪个桶。",
			"hash": "a8f3b123a964"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "元素已入桶：同一位数字的元素进入同一个桶，保持相对顺序。",
			"hash": "8d3da3cf5691"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "收集：按桶 0 到 9 的顺序把元素放回数组，这一位就排好了。",
			"hash": "17fe6c9593b2"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "这一位处理完成，进入下一位。",
			"hash": "0f06db6e8855"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "排序完成。基数排序时间复杂度 O(d·n)（d 为最大位数），稳定且适合整数/定长字符串排序。",
			"hash": "7c1928029f30"
		}
	},
	"avl": {
		"init": {
			"file": "init.mp3",
			"text": "AVL 树是一种自平衡的二叉搜索树：插入节点后，任何节点的左右子树高度差都不超过 1。一旦失衡，就通过旋转来恢复平衡。",
			"hash": "d6f673807d1a"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "按二叉搜索树的规则查找插入位置：比当前节点小走左边，大走右边。",
			"hash": "0cdbd070e8de"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "新节点插入为叶子。现在从它向上检查平衡因子，看是否有节点失衡。",
			"hash": "eff3a82f8892"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "发现失衡：某个节点的左右子树高度差超过 1，需要旋转来恢复平衡。",
			"hash": "0ca529670d08"
		},
		"partition-start": {
			"file": "partition-start.mp3",
			"text": "执行旋转：调整失衡节点与其子树的连接关系，使树恢复平衡。",
			"hash": "4a311f9dbc93"
		},
		"partition-end": {
			"file": "partition-end.mp3",
			"text": "旋转完成，这棵子树重新满足 AVL 性质，继续向上检查。",
			"hash": "aa4a59889b9f"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "插入完成，AVL 树始终平衡。查找、插入、删除的时间复杂度都是 O(log n)。",
			"hash": "1a1002f9167b"
		}
	},
	"join": {
		"init": {
			"file": "init.mp3",
			"text": "内连接（INNER JOIN）：拿左表 student 的每一行，去右表 sc 中找学号相同的行，匹配成功的行对合并为结果的一行。",
			"hash": "181686114048"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "取出左表的一行，准备与右表的每一行比较连接条件。",
			"hash": "45f9b5e31fa1"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "拿右表的一行做匹配：比较学号是否相等。",
			"hash": "2a80fd2ece36"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "匹配成功！左右两行合并，追加到结果表中。",
			"hash": "05b5c3bc9d37"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "不匹配，跳过这一行，继续比较右表的下一行。",
			"hash": "dec352d4123d"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "内连接完成：结果集包含所有匹配成功的行对。注意赵强的学号 20105 没有选课记录，而 sc 中的 20105 在 student 中不存在——两边不匹配的行都被丢弃。",
			"hash": "eba38ac75ecd"
		}
	}
};
