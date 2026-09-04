import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/BCoC9h1q.js";import{n as i,t as a}from"../chunks/CCXrgTeX.js";var o=`-- M2.10 EXPLAIN 详解 seed：客户 / 订单（SQLite 方言）
CREATE TABLE "客户"
(
    "客户号" INTEGER PRIMARY KEY,
    "姓名"   TEXT
);
INSERT INTO "客户" VALUES
  (1, '张三'), (2, '李四'), (3, '王五');

CREATE TABLE "订单"
(
    "订单号" INTEGER,
    "客户号" INTEGER,
    "金额"   INTEGER
);
INSERT INTO "订单" VALUES
  (9001, 1, 300), (9002, 2, 450), (9003, 1, 260), (9004, 3, 520);
`,s=[`id`,`parent`,`notused`,`detail`],c={name:`EXPLAIN 详解`,seedSql:o,stages:[`单表：SCAN 与 SEARCH`,`两表连接：嵌套循环的内外层`,`子查询：SCALAR SUBQUERY 与 parent 指针`,`读计划三步法`],frames:[{sql:`EXPLAIN QUERY PLAN SELECT * FROM "订单" WHERE 金额 > 300;`,description:`单表无索引：SCAN 订单——逐行全表扫描`,detail:`EQP 每行是一个「计划节点」。单表查询只有一个节点：SCAN（扫描）或 SEARCH（按索引定位）。`,stage:0,type:`init`,expected:{columns:s,rows:[[3,0,0,`SCAN 订单`]]}},{sql:`EXPLAIN QUERY PLAN SELECT * FROM "客户" WHERE 客户号 = 2;`,description:`主键查找：SEARCH 客户 USING INTEGER PRIMARY KEY (rowid=?)`,detail:`INTEGER PRIMARY KEY 即 rowid，查找直接走 B 树定位——这是 SQLite 里最快的访问路径。MySQL InnoDB 的主键即聚簇索引，异曲同工。`,stage:0,expected:{columns:s,rows:[[4,0,0,`SEARCH 客户 USING INTEGER PRIMARY KEY (rowid=?)`]]},rowTags:{0:`最快路径`}},{sql:`SELECT c.姓名, o.金额 FROM "客户" c
JOIN "订单" o ON c.客户号 = o.客户号
WHERE o.金额 > 300;`,description:`连接查询先看真实结果：过滤出金额 > 300 的订单与客户`,detail:`先记住语义：客户 1 有两单（300、260），只有 300 入选；客户 2 的 450、客户 3 的 520 入选。`,stage:1,expected:{columns:[`姓名`,`金额`],rows:[[`张三`,300],[`李四`,450],[`王五`,520]]}},{sql:`EXPLAIN QUERY PLAN SELECT c.姓名, o.金额 FROM "客户" c
JOIN "订单" o ON c.客户号 = o.客户号
WHERE o.金额 > 300;`,description:`连接的计划：SCAN 订单（外层）+ SEARCH 客户按主键（内层）`,detail:`两个节点同属一个查询块——嵌套循环：外层逐行扫订单，内层用主键直接定位客户。优化器选了行数少的做内层 SEARCH，这正是「小表驱动大表」的体现。`,stage:1,type:`edge-select`,expected:{columns:s,rows:[[3,0,0,`SCAN 订单`],[3,0,0,`SEARCH 客户 USING INTEGER PRIMARY KEY (rowid=?)`]]}},{sql:`EXPLAIN QUERY PLAN
SELECT 姓名,
  (SELECT COUNT(*) FROM "订单" o WHERE o.客户号 = c.客户号) AS 单数
FROM "客户" c;`,description:`相关子查询：外层 SCAN + SCALAR SUBQUERY 节点（子节点靠 parent 关联）`,detail:`相关子查询对客户表的每一行执行一次。计划里 SCALAR SUBQUERY 1 是一个子块，其内部的 SCAN 订单 通过 id/parent 挂在子块下——层级树就是读复杂计划的地图。`,stage:2,type:`edge-select`,expected:{columns:s,rows:[[4,0,0,`SCAN 客户`],[2,0,0,`SCALAR SUBQUERY 1`],[1,0,0,`SCAN 订单`]]}},{sql:`SELECT '1' AS 步骤, '从里到外找最深的 SCAN，确认行数最多的那个' AS 要点
UNION ALL
SELECT '2', '每个 SCAN 问一句：有没有索引可用'
UNION ALL
SELECT '3', '看连接内外层：小表驱动大表'
ORDER BY 步骤;`,description:`小结：读 EQP 三步法（最深 SCAN → 索引可用性 → 内外层顺序）`,detail:`计划不会撒谎：EXPLAIN QUERY PLAN（SQLite）/ EXPLAIN + EXPLAIN ANALYZE（MySQL）是调优的起点，而不是「感觉慢就加索引」。`,stage:3,type:`complete`,expected:{columns:[`步骤`,`要点`],rows:[[`1`,`从里到外找最深的 SCAN，确认行数最多的那个`],[`2`,`每个 SCAN 问一句：有没有索引可用`],[`3`,`看连接内外层：小表驱动大表`]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:3,prompt:`连接计划里 SEARCH 客户 USING PRIMARY KEY 出现在内层，说明什么？`,options:[`客户表是驱动表`,`外层每拿到一行订单，用主键一步定位客户`,`客户表没有索引`,`客户表被扫描了两次`],correctAnswer:`外层每拿到一行订单，用主键一步定位客户`,hint:`嵌套循环：外层转一圈，内层点一下`,explanation:`嵌套循环连接中 SEARCH 节点是内层——对每一行外层数据按主键直接取数，这正是「小表驱动大表 + 主键回查」的理想形态。`},{type:`choose-next`,stepIndex:4,prompt:`相关子查询的计划里出现 SCALAR SUBQUERY 1，它表示？`,options:[`一个独立的全表扫描`,`一个子查询块，内部节点挂在它下面`,`一个索引`,`一次排序`],correctAnswer:`一个子查询块，内部节点挂在它下面`,hint:`注意 parent 列的指向`,explanation:`SCALAR SUBQUERY 是子查询的计划块编号，它内部自己的 SCAN 通过 id/parent 归到该块下——层级树由此展开。`}]};function l(){return i(c)}var u=e(`逐帧读懂 <b>QUERY PLAN</b>：SCAN 与 SEARCH、连接的嵌套循环内外层、子查询的 id/parent
		层级树——最后总结出「读计划三步法」。 <span class="mono">SQLite 方言演示</span>。`,1);function d(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`EXPLAIN 详解`,desc:e=>{t();var r=u();t(4),n(e,r)},children:(e,t)=>{a(e,{get load(){return l},topicId:`explain-detail`,topicName:`EXPLAIN 详解`})},$$slots:{desc:!0,default:!0}})}export{d as component};