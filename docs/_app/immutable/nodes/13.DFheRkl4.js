import{E as e,ot as t,w as n}from"../chunks/DLvny-g4.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/Dian-3jp.js";import{n as i,t as a}from"../chunks/TV1Ru-Hn.js";import{t as o}from"../chunks/Cql0M5xD.js";var s={name:`SQL 分组聚合 GROUP BY`,seedSql:o,stages:[`明细行：原始数据`,`GROUP BY：按专业分组`,`聚合函数：组内收拢`,`HAVING：筛组`],frames:[{sql:`SELECT * FROM "学生" ORDER BY 学号;`,description:`明细行：6 名学生的原始数据`,detail:`分组聚合回答「每一类有多少/多大」的问题——先看清未分组的明细。`,stage:0,type:`init`,expected:{columns:[`学号`,`姓名`,`专业`,`成绩`],rows:[[20101,`张三`,`计算机`,88],[20102,`李四`,`软件工程`,92],[20103,`王五`,`计算机`,76],[20104,`赵六`,`网络工程`,85],[20105,`孙七`,`软件工程`,63],[20106,`周八`,`计算机`,95]]}},{sql:`SELECT 专业, COUNT(*) AS 人数
FROM "学生"
GROUP BY 专业
ORDER BY 人数 DESC, 专业;`,description:`GROUP BY 专业：3 个组 → 计算机 3 人、软件工程 2 人、网络工程 1 人`,detail:`分组把同值行收进一组，聚合函数把每组收敛成一行。GROUP BY 后 SELECT 只能出现分组列和聚合函数。`,stage:1,type:`edge-select`,expected:{columns:[`专业`,`人数`],rows:[[`计算机`,3],[`软件工程`,2],[`网络工程`,1]]}},{sql:`SELECT 专业,
  ROUND(AVG(成绩), 1) AS 平均分,
  MAX(成绩) AS 最高分,
  MIN(成绩) AS 最低分
FROM "学生"
GROUP BY 专业
ORDER BY 平均分 DESC;`,description:`多聚合：平均 / 最高 / 最低 一次统计（86.3 / 85 / 77.5）`,detail:`AVG/MAX/MIN 在组内计算。网络工程只有赵六一人，三个值相同——单成员组是理解聚合的特例。`,stage:2,expected:{columns:[`专业`,`平均分`,`最高分`,`最低分`],rows:[[`计算机`,86.3,95,76],[`网络工程`,85,85,85],[`软件工程`,77.5,92,63]]}},{sql:`SELECT 专业, COUNT(*) AS 人数
FROM "学生"
GROUP BY 专业
HAVING COUNT(*) >= 2
ORDER BY 人数 DESC;`,description:`HAVING 人数 >= 2：过滤掉只有 1 人的网络工程组`,detail:`对聚合结果筛选用 HAVING——它作用在「组」上，与作用在「行」上的 WHERE 分工明确。`,stage:3,expected:{columns:[`专业`,`人数`],rows:[[`计算机`,3],[`软件工程`,2]]}},{sql:`SELECT 'COUNT(*)' AS 聚合, '组内行数' AS 含义
UNION ALL
SELECT 'SUM(列)', '组内求和'
UNION ALL
SELECT 'AVG(列)', '组内平均'
UNION ALL
SELECT 'MAX/MIN(列)', '组内极值'
ORDER BY 聚合;`,description:`小结：常用聚合函数速查`,detail:`聚合函数只有配着 GROUP BY（或整表一组）才有意义——这就是「分组聚合」这个名字的由来。`,stage:3,type:`complete`,expected:{columns:[`聚合`,`含义`],rows:[[`AVG(列)`,`组内平均`],[`COUNT(*)`,`组内行数`],[`MAX/MIN(列)`,`组内极值`],[`SUM(列)`,`组内求和`]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:1,prompt:`GROUP BY 专业 之后，SELECT 列表中能出现哪些列？`,options:[`任意列`,`只能出现分组列（专业）和聚合函数`,`只能出现数值列`,`只能出现第一行的值`],correctAnswer:`只能出现分组列（专业）和聚合函数`,hint:`一组多行，原始值代表不了整组`,explanation:`分组后每组是多行，非分组列（如姓名）在组内有多个值无法输出；必须经聚合函数收拢。`},{type:`choose-next`,stepIndex:3,prompt:`想只保留人数 ≥ 2 的专业，条件应写在哪里？`,options:[`WHERE COUNT(*) >= 2`,`HAVING COUNT(*) >= 2`,`ORDER BY`,`LIMIT 2`],correctAnswer:`HAVING COUNT(*) >= 2`,hint:`聚合结果的过滤发生在分组之后`,explanation:`WHERE 在分组前逐行过滤，聚合函数还没计算；对组的结果筛选必须用 HAVING。`}]};function c(){return i(s)}var l=e(`按列分组、组内聚合，结果表逐组生长；HAVING 再对「组」筛选。 每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function u(e){r(e,{sectionNum:`§04`,sectionName:`数据库查询`,title:`SQL 分组聚合 GROUP BY`,desc:e=>{t();var r=l();t(2),n(e,r)},children:(e,t)=>{a(e,{get load(){return c},topicId:`group-by`,topicName:`SQL 分组聚合 GROUP BY`})},$$slots:{desc:!0,default:!0}})}export{u as component};