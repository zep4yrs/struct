import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/_vRyNqgk.js";import{n as i,t as a}from"../chunks/67h3GuWg.js";import{t as o}from"../chunks/Cql0M5xD.js";var s={name:`MySQL 数据查询`,seedSql:o,stages:[`FROM / JOIN：确定数据来源`,`WHERE：逐行筛选`,`GROUP BY：分组聚合`,`SELECT / ORDER BY / LIMIT：投影排序截断`],frames:[{sql:`SELECT * FROM "学生" ORDER BY 学号;`,description:`FROM 学生：6 名学生的原始行集`,detail:`逻辑执行顺序的第一步——FROM 先确定数据来自哪张表，此刻还没有任何筛选。`,stage:0,type:`init`,expected:{columns:[`学号`,`姓名`,`专业`,`成绩`],rows:[[20101,`张三`,`计算机`,88],[20102,`李四`,`软件工程`,92],[20103,`王五`,`计算机`,76],[20104,`赵六`,`网络工程`,85],[20105,`孙七`,`软件工程`,63],[20106,`周八`,`计算机`,95]]}},{sql:`SELECT 学生.姓名 AS 姓名, 选课.课程号 AS 课程号, 选课.成绩 AS 成绩
FROM "学生"
JOIN "选课" ON 学生.学号 = 选课.学号
ORDER BY 学生.学号, 选课.课程号;`,description:`JOIN 选课：按学号匹配合并 → 5 条选课记录`,detail:`两表按 ON 条件逐对匹配：赵六、周八没有选课记录，因此不出现。`,stage:0,expected:{columns:[`姓名`,`课程号`,`成绩`],rows:[[`张三`,`C001`,90],[`张三`,`C002`,85],[`李四`,`C001`,95],[`王五`,`C002`,78],[`孙七`,`C001`,60]]}},{sql:`SELECT 学生.姓名 AS 姓名, 选课.课程号 AS 课程号, 选课.成绩 AS 成绩
FROM "学生"
JOIN "选课" ON 学生.学号 = 选课.学号
WHERE 选课.成绩 >= 85
ORDER BY 学生.学号, 选课.课程号;`,description:`WHERE 成绩 >= 85：6 → 5 → 3 行`,detail:`WHERE 逐行判定，王五(78)、孙七(60) 被过滤——只保留满足条件的行。`,stage:1,expected:{columns:[`姓名`,`课程号`,`成绩`],rows:[[`张三`,`C001`,90],[`张三`,`C002`,85],[`李四`,`C001`,95]]}},{sql:`SELECT 学生.姓名 AS 姓名, COUNT(*) AS 选课门数
FROM "学生"
JOIN "选课" ON 学生.学号 = 选课.学号
GROUP BY 学生.姓名
ORDER BY 选课门数 DESC, 姓名;`,description:`GROUP BY 姓名：每人选课门数（张三 2 门，其余各 1 门）`,detail:`分组后 SELECT 只能出现「分组列 + 聚合函数」。ORDER BY 选课门数 DESC, 姓名 保证并列时顺序稳定。`,stage:2,expected:{columns:[`姓名`,`选课门数`],rows:[[`张三`,2],[`孙七`,1],[`李四`,1],[`王五`,1]]}},{sql:`SELECT 学生.姓名 AS 姓名, 选课.成绩 AS 成绩
FROM "学生"
JOIN "选课" ON 学生.学号 = 选课.学号
WHERE 选课.成绩 >= 85
ORDER BY 选课.成绩 DESC;`,description:`ORDER BY 成绩 DESC：95 → 90 → 85`,detail:`投影后再排序：SELECT 决定「有哪些列」，ORDER BY 决定「什么顺序看」。`,stage:3,expected:{columns:[`姓名`,`成绩`],rows:[[`李四`,95],[`张三`,90],[`张三`,85]]}},{sql:`SELECT 学生.姓名 AS 姓名, 选课.成绩 AS 成绩
FROM "学生"
JOIN "选课" ON 学生.学号 = 选课.学号
WHERE 选课.成绩 >= 85
ORDER BY 选课.成绩 DESC
LIMIT 2;`,description:`LIMIT 2：只取前两名 → 李四 95、张三 90`,detail:`LIMIT 是最后一步截断。完整顺序：FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY → LIMIT。`,stage:3,type:`complete`,expected:{columns:[`姓名`,`成绩`],rows:[[`李四`,95],[`张三`,90]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:2,prompt:`WHERE 选课.成绩 >= 85 之后，王五的选课记录为何消失了？`,options:[`他没选课`,`78 分不满足条件被过滤`,`他被 GROUP BY 合并`,`JOIN 失败`],correctAnswer:`78 分不满足条件被过滤`,hint:`WHERE 逐行判断条件`,explanation:`王五选课成绩 78 < 85，WHERE 阶段该行被丢弃——过滤发生在分组之前。`},{type:`choose-next`,stepIndex:3,prompt:`GROUP BY 姓名 后，SELECT 能出现 选课.成绩 吗？`,options:[`能，原样显示`,`不能，只能出现分组列或聚合函数`,`能，但只显示第一行`,`看运气`],correctAnswer:`不能，只能出现分组列或聚合函数`,hint:`一组多行，一个「原始值」代表不了整组`,explanation:`分组后每组是多行，原始成绩有多个值，必须用聚合函数（COUNT/AVG/MAX…）收拢成一个。`}],customConfig:{title:`自定义 SQL（真实执行）`,fields:[{key:`sql`,label:`SQL`,type:`textarea`,placeholder:`SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 90`,default:`SELECT 姓名, 成绩 FROM 学生 WHERE 成绩 >= 90`}]}};function c(){return i(s)}var l=e(`SELECT 按<b>逻辑执行顺序</b>处理：<span class="mono">FROM → JOIN → WHERE → GROUP BY → SELECT → ORDER BY → LIMIT</span>。逐帧观察每个子句对结果集的影响；打开「自定义」输入你的 SQL 实时执行（需 sql.js）。 <span class="mono">SQLite 方言演示</span>。`,1);function u(e){r(e,{sectionNum:`§04`,sectionName:`数据查询`,title:`MySQL 数据查询`,desc:e=>{t();var r=l();t(6),n(e,r)},children:(e,t)=>{a(e,{get load(){return c},topicId:`sql`,topicName:`MySQL 数据查询`})},$$slots:{desc:!0,default:!0}})}export{u as component};