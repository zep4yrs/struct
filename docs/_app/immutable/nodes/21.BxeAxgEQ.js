import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/CwJ3I8or.js";import{n as i,t as a}from"../chunks/D0wb7F7O.js";var o={name:`JOIN 家族`,seedSql:`-- M2.8 JOIN 家族 seed：员工 / 部门（含互不匹配行，SQLite 方言）
CREATE TABLE "员工"
(
    "工号"     INTEGER,
    "姓名"     TEXT,
    "部门号"   INTEGER,
    "上级工号" INTEGER
);
INSERT INTO "员工" VALUES
  (1, '张三', 10, NULL),
  (2, '李四', 20, 1),
  (3, '王五', 30, 1),
  (4, '赵六', NULL, 2);

CREATE TABLE "部门" ("部门号" INTEGER, "部门名" TEXT);
INSERT INTO "部门" VALUES
  (10, '技术部'),
  (20, '市场部'),
  (40, '财务部');
`,stages:[`ON：逐对匹配两表行`,`OUTER：保留无匹配的一侧（补 NULL）`,`CROSS：笛卡尔积`,`自连接：同一张表取两个别名`],frames:[{sql:`SELECT e.姓名 AS 姓名, d.部门名 AS 部门名
FROM "员工" e
JOIN "部门" d ON e.部门号 = d.部门号
ORDER BY e.工号;`,description:`INNER JOIN 基线：只保留匹配行 → 张三、李四（王五无部门、财务部无人）`,detail:`王五(30) 和 财务部(40) 在对方表中没有匹配，被 INNER JOIN 丢弃——这是后面 OUTER 连接的对照基线。`,stage:0,type:`init`,expected:{columns:[`姓名`,`部门名`],rows:[[`张三`,`技术部`],[`李四`,`市场部`]]}},{sql:`SELECT e.姓名 AS 姓名, d.部门名 AS 部门名
FROM "员工" e
LEFT JOIN "部门" d ON e.部门号 = d.部门号
ORDER BY e.工号;`,description:`LEFT JOIN：左表全保留 → 王五、赵六右侧补 NULL`,detail:`LEFT JOIN = 匹配行 + 左表无匹配行（右侧补 NULL）。「找没有部门的员工」这类问题的标准工具。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`部门名`],rows:[[`张三`,`技术部`],[`李四`,`市场部`],[`王五`,`NULL`],[`赵六`,`NULL`]]},rowTags:{2:`无部门`,3:`无部门`}},{sql:`SELECT d.部门名 AS 部门名, e.姓名 AS 姓名
FROM "员工" e
RIGHT JOIN "部门" d ON e.部门号 = d.部门号
ORDER BY d.部门号;`,description:`RIGHT JOIN：右表全保留 → 财务部左侧补 NULL（3.39+ 方言）`,detail:`RIGHT JOIN = LEFT JOIN 的镜像。MySQL 支持；SQLite 3.39 起才支持，老教程常说「SQLite 没有 RIGHT JOIN」已过时。`,stage:1,type:`edge-select`,expected:{columns:[`部门名`,`姓名`],rows:[[`技术部`,`张三`],[`市场部`,`李四`],[`财务部`,`NULL`]]},rowTags:{2:`无员工`}},{sql:`SELECT COALESCE(e.姓名, '—') AS 姓名,
  COALESCE(d.部门名, '—') AS 部门名
FROM "员工" e
FULL OUTER JOIN "部门" d ON e.部门号 = d.部门号
ORDER BY e.工号, d.部门号;`,description:`FULL OUTER JOIN：两侧都保留 → 5 行（交集 + 仅员工 + 仅部门）`,detail:`FULL = LEFT ∪ RIGHT：匹配 2 行 + 仅员工 2 行 + 仅部门 1 行。注意 NULL 在 ORDER BY 升序时排最前（「—财务部」行在最上）。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`部门名`],rows:[[`—`,`财务部`],[`张三`,`技术部`],[`李四`,`市场部`],[`王五`,`—`],[`赵六`,`—`]]},rowTags:{0:`仅部门`,3:`无部门`,4:`无部门`}},{sql:`SELECT e.姓名 AS 姓名, d.部门名 AS 部门名
FROM "员工" e
CROSS JOIN "部门" d
ORDER BY e.工号, d.部门号;`,description:`CROSS JOIN：笛卡尔积 4 × 3 = 12 行，一切连接的起点`,detail:`INNER JOIN 本质是「CROSS JOIN + ON 过滤」。漏写 ON 条件的连接会退化成笛卡尔积，行数爆炸是经典事故现场。`,stage:2,expected:{columns:[`姓名`,`部门名`],rows:[[`张三`,`技术部`],[`张三`,`市场部`],[`张三`,`财务部`],[`李四`,`技术部`],[`李四`,`市场部`],[`李四`,`财务部`],[`王五`,`技术部`],[`王五`,`市场部`],[`王五`,`财务部`],[`赵六`,`技术部`],[`赵六`,`市场部`],[`赵六`,`财务部`]]}},{sql:`SELECT e.姓名 AS 员工,
  COALESCE(m.姓名, '—') AS 上级
FROM "员工" e
LEFT JOIN "员工" m ON e.上级工号 = m.工号
ORDER BY e.工号;`,description:`自连接：员工表取两个别名（e 本人 / m 上级）拼出汇报关系`,detail:`自连接 = 同一张表 Join 自己。别名 e/m 是两个独立的行集合；「谁的上级是谁」这类层级关系全靠它。`,stage:3,type:`complete`,expected:{columns:[`员工`,`上级`],rows:[[`张三`,`—`],[`李四`,`张三`],[`王五`,`张三`],[`赵六`,`李四`]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:3,prompt:`INNER JOIN 与 FULL OUTER JOIN 的行数差（本例 2 行 vs 5 行）来自哪里？`,options:[`两侧各自的无匹配行被 INNER JOIN 丢弃`,`FULL 会把匹配行复制`,`INNER JOIN 有 WHERE 条件`,`FULL 会自动去重`],correctAnswer:`两侧各自的无匹配行被 INNER JOIN 丢弃`,hint:`数一数：仅员工 2 行 + 仅部门 1 行`,explanation:`FULL = 交集 + 左独有 + 右独有。INNER 只保留交集（2 行），独有行（2+1）正是两种连接的行数差。`},{type:`choose-next`,stepIndex:4,prompt:`两个 10 行的表 CROSS JOIN 得到多少行？`,options:[`10`,`20`,`100`,`0`],correctAnswer:`100`,hint:`笛卡尔积 = 行数相乘`,explanation:`CROSS JOIN 的行数 = 左行数 × 右行数 = 10 × 10 = 100。漏写 ON 时可能悄悄产生这种行数爆炸。`}]};function s(){return i(o)}var c=e(`INNER / LEFT 的进阶全家福：<b>RIGHT · FULL OUTER · CROSS · 自连接</b>。
		用一张互不匹配的员工-部门表，逐帧看清每种连接各自保留了谁、谁被补了 NULL。 每帧都是真实执行的
		SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function l(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`JOIN 家族`,desc:e=>{t();var r=c();t(4),n(e,r)},children:(e,t)=>{a(e,{get load(){return s},topicId:`join-variants`,topicName:`JOIN 家族`})},$$slots:{desc:!0,default:!0}})}export{l as component};