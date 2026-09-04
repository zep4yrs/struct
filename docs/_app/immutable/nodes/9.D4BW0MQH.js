import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/DQUFm6-3.js";import{n as i,t as a}from"../chunks/oUOZkS9g.js";var o={name:`DISTINCT 与分页`,seedSql:`-- M2.7 DISTINCT 与分页 seed：选课记录（含重复课程，SQLite 方言）
CREATE TABLE "选课" ("学号" INTEGER, "课程" TEXT);
INSERT INTO "选课" VALUES
  (20101, 'C001'),
  (20101, 'C002'),
  (20102, 'C001'),
  (20102, 'C002'),
  (20103, 'C001'),
  (20103, 'C003');
`,stages:[`FROM / ORDER BY：排序基线`,`DISTINCT：行去重`,`LIMIT / OFFSET：分页窗口`],frames:[{sql:`SELECT * FROM "选课" ORDER BY 学号, 课程;`,description:`选课表原始数据：6 条选课记录、3 门课程`,detail:`去重与分页都建立在「确定的行序」上——先 ORDER BY，后面的帧才有稳定的窗口。`,stage:0,type:`init`,expected:{columns:[`学号`,`课程`],rows:[[20101,`C001`],[20101,`C002`],[20102,`C001`],[20102,`C002`],[20103,`C001`],[20103,`C003`]]}},{sql:`SELECT DISTINCT 课程 FROM "选课" ORDER BY 课程;`,description:`DISTINCT 课程：6 行去重为 3 门课`,detail:`DISTINCT 作用于 SELECT 的全部列组合——只有整行完全相同才会被合并。`,stage:1,type:`edge-select`,expected:{columns:[`课程`],rows:[[`C001`],[`C002`],[`C003`]]}},{sql:`SELECT COUNT(DISTINCT 课程) AS 课程数,
  COUNT(课程) AS 选课人次
FROM "选课";`,description:`COUNT(DISTINCT 课程)=3 对比 COUNT(课程)=6：去重计数 vs 计数`,detail:`聚合函数里嵌 DISTINCT 是「统计有多少不同值」的标准写法，报表里出镜率极高。`,stage:1,type:`edge-select`,expected:{columns:[`课程数`,`选课人次`],rows:[[3,6]]}},{sql:`SELECT 学号, 课程 FROM "选课"
ORDER BY 学号, 课程
LIMIT 3 OFFSET 2;`,description:`分页窗口：LIMIT 3 OFFSET 2 → 第 3~5 行（第 2 页 · 每页 3 条）`,detail:`OFFSET 是「跳过的行数」。稳定分页的前提是 ORDER BY 的键唯一或近唯一，否则页与页可能重复/漏行。`,stage:2,type:`edge-select`,expected:{columns:[`学号`,`课程`],rows:[[20101,`C002`],[20102,`C001`],[20102,`C002`]]}},{sql:`SELECT 学号, 课程 FROM "选课"
ORDER BY 学号, 课程
LIMIT 2 OFFSET 4;`,description:`深翻页：LIMIT 2 OFFSET 4 → 只剩 2 行（ OFFSET 越大越慢）`,detail:`OFFSET N 要先扫过并丢弃前 N 行——大偏移（如 OFFSET 100000）正是深分页慢查询的根源，改用「游标/键集分页」（WHERE 最后一行键 > 上页末行）可根治。`,stage:2,type:`complete`,expected:{columns:[`学号`,`课程`],rows:[[20103,`C001`],[20103,`C003`]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:1,prompt:`SELECT DISTINCT 学号, 课程 会比 DISTINCT 课程 多保留哪些行？`,options:[`不会多，结果一样`,`同学号不同课程的行`,`同课程不同学号的行`,`全部行`],correctAnswer:`不会多，结果一样`,hint:`本表的组合里有没有完全相同的两行？`,explanation:`本表每行 (学号,课程) 组合都不重复，所以按整行去重与按单列去重结果一致——DISTINCT 看的是「列组合」是否重复。`},{type:`choose-next`,stepIndex:3,prompt:`LIMIT 3 OFFSET 2 返回的是排序后的第几行？`,options:[`第 1~3 行`,`第 2~4 行`,`第 3~5 行`,`第 4~6 行`],correctAnswer:`第 3~5 行`,hint:`OFFSET 是「跳过几行」`,explanation:`先跳过 OFFSET 指定的 2 行，再取 LIMIT 指定的 3 行 → 第 3~5 行。`}]};function s(){return i(o)}var c=e(`<b>去重</b>与<b>分页</b>是一对报表基本功：DISTINCT 对整行组合去重、COUNT(DISTINCT …)
		去重计数、LIMIT/OFFSET 划分页窗口——以及大偏移深分页为什么慢。 每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function l(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`DISTINCT 与分页`,desc:e=>{var r=c();t(5),n(e,r)},children:(e,t)=>{a(e,{get load(){return s},topicId:`distinct-paging`,topicName:`DISTINCT 与分页`})},$$slots:{desc:!0,default:!0}})}export{l as component};