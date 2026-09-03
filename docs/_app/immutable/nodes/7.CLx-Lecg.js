import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/B32bqIzu.js";import{n as i,t as a}from"../chunks/BFu992uV.js";var o=`-- M2.4 CASE 表达式 seed：员工表（SQLite 方言）
CREATE TABLE "员工" ("工号" INTEGER, "姓名" TEXT, "部门" TEXT, "工资" INTEGER);
INSERT INTO "员工" VALUES
  (1, '张三', '技术部', 12000),
  (2, '李四', '技术部', 9000),
  (3, '王五', '市场部', 8500),
  (4, '赵六', '市场部', 9500),
  (5, '孙七', '人事部', 7000),
  (6, '周八', '技术部', 15000);
`,s=`CASE
  WHEN 工资 >= 12000 THEN '高薪'
  WHEN 工资 >= 8500 THEN '中等'
  ELSE '待涨' END`,c={name:`CASE 表达式`,seedSql:o,stages:[`FROM：取原始行`,`CASE：逐行求值归类`,`GROUP BY / 聚合：按类别统计`],frames:[{sql:`SELECT * FROM "员工" ORDER BY 工号;`,description:`员工表原始数据：6 人、3 个部门`,detail:`CASE 是 SQL 里的「行内 if-else」，在 SELECT 阶段对每一行独立求值。`,stage:0,type:`init`,expected:{columns:[`工号`,`姓名`,`部门`,`工资`],rows:[[1,`张三`,`技术部`,12e3],[2,`李四`,`技术部`,9e3],[3,`王五`,`市场部`,8500],[4,`赵六`,`市场部`,9500],[5,`孙七`,`人事部`,7e3],[6,`周八`,`技术部`,15e3]]}},{sql:`SELECT 姓名, 工资,\n  ${s}\n  AS 档位\nFROM "员工" ORDER BY 工号;`,description:`搜索 CASE：按工资区间归为 高薪 / 中等 / 待涨`,detail:`WHEN 自上而下短路求值：12000 命中第一条即停。ELSE 可省略，省略时未命中为 NULL。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`工资`,`档位`],rows:[[`张三`,12e3,`高薪`],[`李四`,9e3,`中等`],[`王五`,8500,`中等`],[`赵六`,9500,`中等`],[`孙七`,7e3,`待涨`],[`周八`,15e3,`高薪`]]},rowTags:{0:`高薪`,3:`中等`,4:`待涨`}},{sql:`SELECT ${s} AS 档位,\n  COUNT(*) AS 人数\nFROM "员工"\nGROUP BY 档位\nORDER BY 人数 DESC;`,description:`CASE + GROUP BY：各档位人数统计（3 / 2 / 1）`,detail:`CASE 的输出可以当普通列用：先逐行归档，再按档位分组计数——「先分类、后聚合」是报表最常用套路。`,stage:2,type:`edge-select`,expected:{columns:[`档位`,`人数`],rows:[[`中等`,3],[`高薪`,2],[`待涨`,1]]}},{sql:`SELECT 姓名,
  CASE 部门
    WHEN '技术部' THEN '研发线'
    WHEN '市场部' THEN '市场线'
    ELSE '职能线' END
  AS 业务线
FROM "员工" ORDER BY 工号;`,description:`简单 CASE：按部门等值映射到业务线（对照搜索 CASE）`,detail:`简单 CASE 在 CASE 后写列名，WHEN 只给值（等值比较）；能写简单 CASE 就不要用搜索 CASE 拼等式——语义更清晰。`,stage:1,type:`complete`,expected:{columns:[`姓名`,`业务线`],rows:[[`张三`,`研发线`],[`李四`,`研发线`],[`王五`,`市场线`],[`赵六`,`市场线`],[`孙七`,`职能线`],[`周八`,`研发线`]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:1,prompt:`工资 = 12000 时，搜索 CASE 返回什么？（第一条 WHEN 是 工资>=12000）`,options:[`高薪`,`中等`,`待涨`,`NULL`],correctAnswer:`高薪`,hint:`WHEN 是自上而下短路求值的`,explanation:`12000 满足第一条 WHEN 工资>=12000，立即返回「高薪」，不会再判断后面的分支。`},{type:`choose-next`,stepIndex:2,prompt:`GROUP BY 档位 后 COUNT(*) 统计的是？`,options:[`每行的 CASE 求值次数`,`每个档位分组内的行数`,`全表总行数`,`档位的不同取值个数`],correctAnswer:`每个档位分组内的行数`,hint:`GROUP BY 先把行分成组，聚合函数再逐组计算`,explanation:`CASE 先把每行归入一个档位，GROUP BY 按档位分组，COUNT(*) 数的是组内行数——即该档位的人数。`}]};function l(){return i(c)}var u=e(`行内 <b>if-else</b>：搜索 CASE 按区间归类、简单 CASE 按值映射，配合 GROUP BY
		一步完成分类统计。每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function d(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`CASE 表达式`,desc:e=>{t();var r=u();t(4),n(e,r)},children:(e,t)=>{a(e,{get load(){return l},topicId:`case-expr`,topicName:`CASE 表达式`})},$$slots:{desc:!0,default:!0}})}export{d as component};