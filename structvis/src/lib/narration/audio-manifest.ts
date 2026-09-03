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
	"hash-probing": {
		"init": {
			"file": "init.mp3",
			"text": "开放定址法解决哈希冲突：元素直接存在哈希表里，发生冲突时按线性探测规则（逐个向后）寻找下一个空槽放入。",
			"hash": "47440f7fb60b"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "用除留余数法计算散列位置：H(x) = x mod m。",
			"hash": "15b6b10653e8"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "目标槽被占用，发生冲突：开始线性探测，向后寻找空位。",
			"hash": "0ab4acac953e"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "找到空槽，元素放入。",
			"hash": "f2df7962c96e"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "构造完成。线性探测简单直观，但容易形成聚集：连续占用的槽越长，后续插入的探测次数越多。",
			"hash": "5066f89cb418"
		}
	},
	"rbtree": {
		"init": {
			"file": "init.mp3",
			"text": "红黑树：二叉搜索树加颜色约束——根和空叶是黑色、红节点的孩子必须是黑、任意路径的黑节点数相同。插入后最多旋转两次即可恢复平衡。",
			"hash": "c5d7641cabf7"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "按二叉搜索树规则找到插入位置，新节点初始为红色。",
			"hash": "7d974b34b5c3"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "插入后检查红黑性质：如果父节点是红色，需要修复。",
			"hash": "88be9e0e3aeb"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "叔叔节点也是红色：变色——父、叔变黑，祖父变红，红色继续上推。",
			"hash": "2108ba8b5f1d"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "叔叔是黑色（或无）：通过旋转 + 变色调整局部结构。",
			"hash": "fa7cae41f769"
		},
		"swap": {
			"file": "swap.mp3",
			"text": "旋转完成，红黑性质恢复。",
			"hash": "7c0ab789fe37"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "插入完成。红黑树高度不超过 2·log₂(n+1)，查找、插入、删除都是 O(log n)，是实际应用最广的平衡树（如 TreeMap、Linux 内核）。",
			"hash": "9a1445fb753b"
		}
	},
	"trie": {
		"init": {
			"file": "init.mp3",
			"text": "字典树 Trie：把一组字符串按公共前缀共享存储。根节点是空的，每个节点保存一个字符，从根到单词结束标记（双圈）的路径就是一个完整的单词。",
			"hash": "07be1fe6054d"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "取出单词的当前字符，从根开始沿路径查找：有这个孩子的节点就继续走，没有就创建。",
			"hash": "15bdc344d411"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "当前字符的节点已存在：直接复用，继续下一个字符。",
			"hash": "83ab05859c87"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "创建新节点，把当前字符挂到路径上。",
			"hash": "38a52572e488"
		},
		"pivot-select": {
			"file": "pivot-select.mp3",
			"text": "单词走完：给最后一个节点打上单词结束标记（双圈）。",
			"hash": "c34bec16efc0"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "全部插入完成。可以看到公共前缀被多个单词共享：例如 cat 和 car 共用 c-a。前缀查询（自动补全）只需沿路径走，复杂度 O(单词长度)。",
			"hash": "fc3f5770c642"
		}
	},
	"astar": {
		"init": {
			"file": "init.mp3",
			"text": "A* 寻路：在网格中找到起点到终点的最短路径。每个格子有代价 f = g + h：g 是起点到它的实际步数，h 是它到终点的估计步数（曼哈顿距离）。每次都扩展 f 最小的格子。",
			"hash": "0de130a52549"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "从 open 表中取出 f 值最小的格子进行扩展。",
			"hash": "bb7ee0d4058b"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "考察邻居格子：计算它的 g、h、f，加入 open 表。",
			"hash": "4966fb290f7c"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "当前格子已扩展完毕，移入 closed 表（不再考察）。",
			"hash": "ba1ec66ffc94"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "找到终点！沿着记录的父指针回溯即可得到最短路径。A* 在启发式可采纳时保证最优，且比 Dijkstra 更快（有方向性地搜索）。",
			"hash": "54e61a7cb1cb"
		}
	},
	"isolation": {
		"init": {
			"file": "init.mp3",
			"text": "并发事务演示：T1 修改账户余额，T2 同时读取。隔离级别决定了 T2 能看到什么，也决定了会发生哪种并发异常。",
			"hash": "3284e503e25e"
		},
		"compare": {
			"file": "compare.mp3",
			"text": "T1 修改数据但尚未提交——此时另一个事务能否看到这个未提交的值？",
			"hash": "cb1ac787bb7a"
		},
		"edge-candidate": {
			"file": "edge-candidate.mp3",
			"text": "T2 读取数据：不同隔离级别下看到的版本不同。",
			"hash": "8690f719ae6f"
		},
		"edge-select": {
			"file": "edge-select.mp3",
			"text": "T1 提交：修改生效，数据对所有事务可见。",
			"hash": "4dfe947e2360"
		},
		"edge-reject": {
			"file": "edge-reject.mp3",
			"text": "T1 回滚：修改撤销，之前读到该值的事务就遇到了脏读。",
			"hash": "f7e43ea7daaf"
		},
		"complete": {
			"file": "complete.mp3",
			"text": "演示结束。读未提交会产生脏读；读已提交每次读最新已提交值（不可重复读）；可重复读（MySQL 默认）事务内快照一致；串行化彻底隔离但并发度最低。",
			"hash": "f6ca0343ede9"
		}
	},
	"union-set": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "集合运算的操作对象是「行集合」——先备好两张结构相同（列数与类型一致）的表。",
			"hash": "7382b7dd3627"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "UNION = A ∪ B。李四、王五两班都报，只出现一次；要保留重复需用 UNION ALL。SQLite 对 UNION 隐式排序以保证去重，这里再显式 ORDER BY 稳定输出。",
			"hash": "e6764430273e"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "INTERSECT = A ∩ B，只保留同时出现在两个结果集中的行，同样自动去重。",
			"hash": "1221aacd974d"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "A EXCEPT B = A − B，方向很重要：交换两张表会得到完全不同的结果（C 班独报是孙七、周八）。",
			"hash": "decb60854a5a"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "4 + 4 − 2（重复）= 6，验证容斥思想；差集是单向的——「A 独有」与「B 独有」要分别计算。",
			"hash": "5d171ab3e904"
		}
	},
	"case-expr": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "CASE 是 SQL 里的「行内 if-else」，在 SELECT 阶段对每一行独立求值。",
			"hash": "38d44839a1d6"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "WHEN 自上而下短路求值：12000 命中第一条即停。ELSE 可省略，省略时未命中为 NULL。",
			"hash": "a82256295926"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "CASE 的输出可以当普通列用：先逐行归档，再按档位分组计数——「先分类、后聚合」是报表最常用套路。",
			"hash": "e8b08b9a6c55"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "简单 CASE 在 CASE 后写列名，WHEN 只给值（等值比较）；能写简单 CASE 就不要用搜索 CASE 拼等式——语义更清晰。",
			"hash": "0c5dfa1a9a19"
		}
	},
	"sql-functions": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "INSTR(邮箱,'@') 返回 @ 的位置（1-based），减 1 得账号长度——配合 SUBSTR 拆出登录名，是字符串函数的经典组合拳。",
			"hash": "f03b4f6faafb"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "ROUND(x, 1) 保留 1 位小数；ABS 把「差多少」变成非负数，适合做偏差展示。",
			"hash": "d500917f04ec"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "SQLite 把 ISO 日期存为 TEXT，strftime(「%Y」, 列) 提取年份；前 7 位用 SUBSTR 就是「年-月」。MySQL 对应 DATE_FORMAT，注意方言差异。",
			"hash": "53ee66dd125b"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "任何值与 NULL 运算结果都是 NULL（李四直接 工资+奖金 会得 NULL）；COALESCE 返回第一个非 NULL 参数，是 NULL 兜底的标准写法。",
			"hash": "e1e261a98c44"
		}
	},
	"having-deep": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "WHERE 作用于「原始行」，此时还没有分组，因此不能使用聚合函数（SUM/COUNT 等）——写了就报错。",
			"hash": "2c187efba341"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "没写 WHERE 时所有行都进分组。中文列的 ORDER BY 按字符编码排序（华东→华北→华南），与拼音无关。",
			"hash": "fd8a3f297447"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "HAVING 作用于「组」，聚合函数只能出现在这里（或 SELECT）。华南 800 被整组过滤掉，一行都不剩。",
			"hash": "e93c8393558f"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "执行顺序 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY。小单 150 先被 WHERE 丢掉，华北组因此只有 450，过不了 HAVING 的 800 门槛。",
			"hash": "294e4460f6e2"
		}
	},
	"distinct-paging": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "去重与分页都建立在「确定的行序」上——先 ORDER BY，后面的帧才有稳定的窗口。",
			"hash": "05a009a622b6"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "DISTINCT 作用于 SELECT 的全部列组合——只有整行完全相同才会被合并。",
			"hash": "6e44ab55e711"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "聚合函数里嵌 DISTINCT 是「统计有多少不同值」的标准写法，报表里出镜率极高。",
			"hash": "dfeb53809993"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "OFFSET 是「跳过的行数」。稳定分页的前提是 ORDER BY 的键唯一或近唯一，否则页与页可能重复/漏行。",
			"hash": "5511f811acd9"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "OFFSET N 要先扫过并丢弃前 N 行——大偏移（如 OFFSET 100000）正是深分页慢查询的根源，改用「游标/键集分页」（WHERE 最后一行键 > 上页末行）可根治。",
			"hash": "6a8edd3daa45"
		}
	},
	"join-variants": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "王五(30) 和 财务部(40) 在对方表中没有匹配，被 INNER JOIN 丢弃——这是后面 OUTER 连接的对照基线。",
			"hash": "3fa2c43a7ab2"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "LEFT JOIN = 匹配行 + 左表无匹配行（右侧补 NULL）。「找没有部门的员工」这类问题的标准工具。",
			"hash": "1329bf79ee88"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "RIGHT JOIN = LEFT JOIN 的镜像。MySQL 支持；SQLite 3.39 起才支持，老教程常说「SQLite 没有 RIGHT JOIN」已过时。",
			"hash": "3ddebe6ba846"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "FULL = LEFT ∪ RIGHT：匹配 2 行 + 仅员工 2 行 + 仅部门 1 行。注意 NULL 在 ORDER BY 升序时排最前（「—财务部」行在最上）。",
			"hash": "7488431c1929"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "INNER JOIN 本质是「CROSS JOIN + ON 过滤」。漏写 ON 条件的连接会退化成笛卡尔积，行数爆炸是经典事故现场。",
			"hash": "931227dfe12a"
		},
		"frame-5": {
			"file": "frame-5.mp3",
			"text": "自连接 = 同一张表 Join 自己。别名 e/m 是两个独立的行集合；「谁的上级是谁」这类层级关系全靠它。",
			"hash": "0aedcb2a3807"
		}
	},
	"view-update": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "视图是「存起来的 SELECT」：不占存储，每次查询实时计算。WHERE 课程=数学 AND 分数>=80 是它的过滤基因。",
			"hash": "d736e3922de8"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "查 sqlite_master 可见视图本质：一条 CREATE VIEW 语句 + 名字。MySQL 里对应 information_schema.views。",
			"hash": "93cb14b00ddb"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "SQLite 中视图默认只读——INSERT INTO 视图 会报「cannot modify 视图 because it is a view」。MySQL 的简单视图可直接更新，且用 WITH CHECK OPTION 保证写入行仍在视图可见范围内（SQLite 无此子句，属方言差异）。",
			"hash": "d0e1eeaf4dee"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "INSTEAD OF 的语义是「代替」：对视图的 INSERT 不再被拒绝，而是执行触发器体里的语句。怎么写、写到哪里，完全由触发器定义决定。",
			"hash": "d89f20532b98"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "95 >= 80 满足视图的 WHERE，所以插入后立刻可见；若经视图写入 60 分（MySQL WITH CHECK OPTION 会拒绝），SQLite 只要不写检查逻辑就会插进基础表却永远看不见——这正是「可更新视图」的核心考点。",
			"hash": "8501f29aa4db"
		},
		"frame-5": {
			"file": "frame-5.mp3",
			"text": "视图本身永远不存数据：经视图写入的行落在基础表里。这就是「视图是虚表」的完整闭环。",
			"hash": "c63e973cc898"
		}
	},
	"index-fail": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "EXPLAIN QUERY PLAN 是判别索引命中的唯一权威：看到 SEARCH = 按索引定位；看到 SCAN = 全表扫描。MySQL 的 EXPLAIN type 列（ref/range/ALL）是同一件事的另一种表述。",
			"hash": "a38cdf68b009"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "索引存的是「区域」原值，对列套函数后必须逐行计算再比较，索引无从下手。解法：改为对常量做函数（区域 = LOWER(‘华东’) 的反向思路）或建函数索引（MySQL 8 函数索引）。",
			"hash": "22fea16c08b5"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "B+ 树按前缀有序组织，「%开头」意味着任意前缀都可能命中，只能全表扫。改成前缀匹配「华%」即可重新命中索引。",
			"hash": "2e927f7e36c0"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "OR 要两侧都能走索引优化器才可能用 index merging；金额列没有索引，直接全表扫更划算。为 OR 两侧分别建索引（或改写为 UNION）才能救回。",
			"hash": "12611d555c66"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "联合索引 (区域, 金额) 按「区域→金额」排序，跳过区域直接查金额等于查一本没有目录的书的第二章——最左前缀法则。需要建 (金额) 单列索引。",
			"hash": "c1c3dde08024"
		},
		"frame-5": {
			"file": "frame-5.mp3",
			"text": "写完 SQL 别猜，跑一下 EXPLAIN QUERY PLAN（SQLite）/ EXPLAIN（MySQL）看计划。ORDER BY 场景让小结顺序稳定（按编码序）。",
			"hash": "cf9733feb28b"
		}
	},
	"explain-detail": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "EQP 每行是一个「计划节点」。单表查询只有一个节点：SCAN（扫描）或 SEARCH（按索引定位）。",
			"hash": "1dd24857f9cc"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "INTEGER PRIMARY KEY 即 rowid，查找直接走 B 树定位——这是 SQLite 里最快的访问路径。MySQL InnoDB 的主键即聚簇索引，异曲同工。",
			"hash": "baad50072a43"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "先记住语义：客户 1 有两单（300、260），只有 300 入选；客户 2 的 450、客户 3 的 520 入选。",
			"hash": "51f2ad22aa1f"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "两个节点同属一个查询块——嵌套循环：外层逐行扫订单，内层用主键直接定位客户。优化器选了行数少的做内层 SEARCH，这正是「小表驱动大表」的体现。",
			"hash": "92b0de212ca4"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "相关子查询对客户表的每一行执行一次。计划里 SCALAR SUBQUERY 1 是一个子块，其内部的 SCAN 订单 通过 id/parent 挂在子块下——层级树就是读复杂计划的地图。",
			"hash": "6475e295d15f"
		},
		"frame-5": {
			"file": "frame-5.mp3",
			"text": "计划不会撒谎：EXPLAIN QUERY PLAN（SQLite）/ EXPLAIN + EXPLAIN ANALYZE（MySQL）是调优的起点，而不是「感觉慢就加索引」。",
			"hash": "ddc265de0b19"
		}
	},
	"constraints": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "学号 pk=1（主键）、姓名 notnull=1（非空）、邮箱 UNIQUE、分数 CHECK——约束写在 DDL 里，之后所有写入自动被检查。",
			"hash": "f84a979cdf10"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "INSERT OR IGNORE 把「违反约束」从报错变成静默跳过，changes() 返回 0 即可观察约束是否生效。生产上应显式捕获冲突（如 ON CONFLICT 子句）。",
			"hash": "e765d231ff4b"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "UNIQUE 约束列里 NULL 之间互不冲突（SQL 标准「NULL ≠ NULL」）——上一帧张三的邮箱就是 NULL。这是面试高频细节。",
			"hash": "8c3eea9909aa"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "CHECK(分数 BETWEEN 0 AND 100) 让数据库成为「最后防线」——应用层漏判的脏数据在这里被拦下。MySQL 8.0.16 之前 CHECK 只解析不执行，注意版本。",
			"hash": "199136cc01e0"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "SQLite 默认关闭外键检查，必须每连接执行 PRAGMA foreign_keys=ON；MySQL InnoDB 默认开启。这是两大数据库最易踩的方言差异之一。",
			"hash": "511526c2921c"
		},
		"frame-5": {
			"file": "frame-5.mp3",
			"text": "外键 ON DELETE CASCADE 把「先删子表再删父表」的手工顺序交给数据库。换成 RESTRICT 则父表删除被直接拒绝——按业务语义选择级联策略。",
			"hash": "a66a96257eb0"
		}
	},
	"sql": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "逻辑执行顺序的第一步——FROM 先确定数据来自哪张表，此刻还没有任何筛选。",
			"hash": "bdcdd9a2c732"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "两表按 ON 条件逐对匹配：赵六、周八没有选课记录，因此不出现。",
			"hash": "dfe8471063a9"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "WHERE 逐行判定，王五(78)、孙七(60) 被过滤——只保留满足条件的行。",
			"hash": "0e12900df9a7"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "分组后 SELECT 只能出现「分组列 + 聚合函数」。ORDER BY 选课门数 DESC, 姓名 保证并列时顺序稳定。",
			"hash": "6fdf90163aed"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "投影后再排序：SELECT 决定「有哪些列」，ORDER BY 决定「什么顺序看」。",
			"hash": "ca96ff239d8e"
		},
		"frame-5": {
			"file": "frame-5.mp3",
			"text": "LIMIT 是最后一步截断。完整顺序：FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY → LIMIT。",
			"hash": "011307edbfb6"
		}
	},
	"join": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "连接是「两张表的行配对游戏」——先认识两位参与者。",
			"hash": "c5dfcb647d08"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "右表只含「发生过选课」的学生——20104、20106 不在其中。",
			"hash": "270a090e5684"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "嵌套循环：右表每一行去左表找 ON 条件成立的搭档，找到才合并输出。每个学号最多匹配一个学生，所以结果行数 = 选课行数。",
			"hash": "83c41b1f28c5"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "内连接只保留「两边都有」的行。想把无匹配的一侧也保留（补 NULL），需要外连接——见 LEFT JOIN 页。",
			"hash": "39f256592fef"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "连接产出中间结果后，WHERE/GROUP BY/ORDER BY 照常作用于这个结果集。",
			"hash": "63a8bebd4d88"
		}
	},
	"left-join": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "赵六、周八没有选课记录，在内连接中直接消失——这是对照的起点。",
			"hash": "e4ee9d596254"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "LEFT JOIN = 匹配成功的行 + 左表无匹配的行（右半部填 NULL）。「每个学生 + 其选课（可能没有）」这类问题必须用它。",
			"hash": "8cec9130e71f"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "补进来的 NULL 正是「无匹配」的标志。IS NULL 过滤后剩下的就是左表独有行——「找没下过单的用户」全是这个模式。",
			"hash": "41ca78832584"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "数行数要用 COUNT(选课.课程号) 而不是 COUNT(*)——NULL 不被计数，赵六/周八才能得到 0；COUNT(*) 会把他们数成 1。",
			"hash": "811d904a1f34"
		}
	},
	"group-by": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "分组聚合回答「每一类有多少/多大」的问题——先看清未分组的明细。",
			"hash": "7af2425670e4"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "分组把同值行收进一组，聚合函数把每组收敛成一行。GROUP BY 后 SELECT 只能出现分组列和聚合函数。",
			"hash": "b69415d7f570"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "AVG/MAX/MIN 在组内计算。网络工程只有赵六一人，三个值相同——单成员组是理解聚合的特例。",
			"hash": "c00ab1f0611f"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "对聚合结果筛选用 HAVING——它作用在「组」上，与作用在「行」上的 WHERE 分工明确。",
			"hash": "8129b48aee5c"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "聚合函数只有配着 GROUP BY（或整表一组）才有意义——这就是「分组聚合」这个名字的由来。",
			"hash": "23ac84531947"
		}
	},
	"subquery": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "非相关子查询的执行顺序是「先内后外」——外层的每一行都用子查询算好的值来比较。",
			"hash": "cab081dd6cd0"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "子查询单独就能执行——把它当「先跑出来的一张小结果表」理解最直观。",
			"hash": "28f3e1a2a9fb"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "外层每一行的成绩与子查询结果比较：88、92、85、95 过线；76、63 被过滤。标量子查询的结果必须恰好一行一列。",
			"hash": "5474187ca386"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "子查询返回多行时用 IN 判断成员关系。学号 20104（赵六）、20106（周八）不在选课集合中，被排除。",
			"hash": "848613e026f3"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "能写 JOIN 的场景优先 JOIN（优化器更友好）；子查询胜在语义直观，尤其是「先算再比」的思路。",
			"hash": "cb34ed8538b7"
		}
	},
	"advanced-query": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "最基础的行级过滤——后面的子句都叠加在这种结果之上。",
			"hash": "925c30fe1ecd"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "「没有选课记录」无法用 WHERE 成绩=NULL 表达——NULL 判等必须用 IS NULL，配合外连接的补 NULL 行为。",
			"hash": "3b80f9ddde69"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "两个查询的列结构必须一致；UNION 自动去重（同名的行只留一条），要保留重复用 UNION ALL。",
			"hash": "186cd9b3f80a"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "EXISTS 只判断子查询「有没有结果行」，返回 true/false——与 IN 的区别在于对 NULL 的处理和短路特性，相关子查询随外层行反复执行。",
			"hash": "6377489d5255"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "子查询先圈定「选过课」的学号集合，外层再分组统计——多个子句各司其职的完整闭环。",
			"hash": "f417b42cb28f"
		}
	},
	"window-function": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "与 GROUP BY「一组一行」不同，窗口函数保留每一行，在行旁边附加计算列。",
			"hash": "2227d5fb64ed"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "PARTITION BY 专业 把行分成三个窗口，各自独立排名——周八/张三/王五是计算机系的 1/2/3 名，与其他专业无关。",
			"hash": "5dcc61c717ba"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "RANK 在并列时给相同名次并跳过后续（1,1,3）；DENSE_RANK 不跳号（1,1,2）。本例数据无并列，正是对照两者语义的基线。",
			"hash": "ef2d206efd1b"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "窗口版的 SUM 不分组、只按学号顺序「滚动累加」——这就是移动平均、累计销售一类报表的实现原理。",
			"hash": "1899568f4d53"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "需要「每行都带排名/累计/移动值」时用窗口函数；需要「每类一个汇总值」时用 GROUP BY。",
			"hash": "57a2408e30a6"
		}
	},
	"update": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "DML 的每一步都会真实改变数据——先记住初始快照，逐帧对照演化。",
			"hash": "7facc1926698"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "UPDATE 逐行检查 WHERE：命中 2 行各加 5。漏写 WHERE 会更新全表——DML 三大事故之首。",
			"hash": "ff13deebc344"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "按列序提供全部值时可省略列名清单；生产上建议显式写列名，防止表结构变更后错位。",
			"hash": "d3cfc47c9ee7"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "DELETE 同样逐行判 WHERE。注意与 TRUNCATE/DROP 的层级差异：删行 / 清空表 / 连结构删。",
			"hash": "c278dca6a19e"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "所有 DML 都可以被事务包裹：BEGIN 后一切可 ROLLBACK，COMMIT 后才持久——见事务页。",
			"hash": "04395f08de90"
		}
	},
	"view": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "视图是「存起来的 SELECT」——不占数据存储，只存一条查询定义。",
			"hash": "3254e3c50fea"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "创建视图没有任何数据被复制——数据库只是记下了「好成绩 = 这条 SELECT」。MySQL 语法完全一致。",
			"hash": "a9d6383672ea"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "每次查询视图都现场执行保存的 SELECT——所以基表一变，视图结果立刻变化，这正是「虚表」的含义。",
			"hash": "9861ce0814e9"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "sqlite_master 是 SQLite 的数据字典；MySQL 对应 information_schema.views——视图的本质就是字典里的一行 SQL 文本。",
			"hash": "a4b8a79510b2"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "删视图不影响基表；删基表（DROP TABLE）则视图失效。视图的安全价值：给不同角色暴露不同列/行的「窗口」。",
			"hash": "872073dd9bb2"
		}
	},
	"triggers": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "触发器的价值就在「自动」：应用层不写一行代码，数据库在 DML 时刻自动执行挂载的逻辑。",
			"hash": "f68ac7dce5a5"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "NEW.列 引用「正在插入的新行」；AFTER 表示在插入成功之后执行（BEFORE 则在之前，可用于校验/改写）。FOR EACH ROW = 每受影响行触发一次。",
			"hash": "2b900fb149e2"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "这就是 AFTER INSERT 触发器在工作：对选课表的插入成功后，数据库自动执行了 BEGIN…END 里的日志写入。",
			"hash": "217041fb36ef"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "每条 INSERT 命中的每一行都触发一次——批量插入 100 行就会有 100 条日志，这就是「行级触发器」的粒度。",
			"hash": "18b6217f161c"
		},
		"frame-4": {
			"file": "frame-4.mp3",
			"text": "MySQL 对应 information_schema.triggers。触发器适合审计日志/级联维护这类「必须跟着数据走」的逻辑；复杂业务请放应用层。",
			"hash": "74842a8fdb43"
		}
	},
	"procedures": {
		"frame-0": {
			"file": "frame-0.mp3",
			"text": "存储过程 = 存在数据库里的预编译 SQL 程序。收益：调用方零 SQL 注入面、网络往返少、逻辑集中。SQLite 无此能力（语法演示帧）。",
			"hash": "6352d64572d1"
		},
		"frame-1": {
			"file": "frame-1.mp3",
			"text": "CALL 像函数调用。对比应用层拼 SQL：权限可精确到「只能 CALL 这个过程」，而不必放开 UPDATE 表权限。",
			"hash": "eecff3c1afe2"
		},
		"frame-2": {
			"file": "frame-2.mp3",
			"text": "IN 进、OUT 出、INOUT 双向。SELECT … INTO 变量 把查询结果写入 OUT 参数——过程最重要的「返回值」通道之一。",
			"hash": "8d6761a228f4"
		},
		"frame-3": {
			"file": "frame-3.mp3",
			"text": "能不用游标就不用——集合化 SQL（一条 UPDATE）几乎总比逐行游标快。游标是「必须逐行处理」时的兜底工具。",
			"hash": "4340ee946e58"
		}
	}
};
