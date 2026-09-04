import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/BRm1gARQ.js";import{n as i,t as a}from"../chunks/BBGqNeZw.js";import{t as o}from"../chunks/Cql0M5xD.js";var s={name:`高级查询`,seedSql:o,stages:[`基础筛选：WHERE`,`外连接反查：LEFT JOIN + IS NULL`,`集合合并：UNION`,`相关子查询：EXISTS`],frames:[{sql:`SELECT 姓名, 专业, 成绩 FROM "学生"
WHERE 成绩 >= 85
ORDER BY 成绩 DESC;`,description:`WHERE 筛行：85 分以上 4 人（95/92/88/85）`,detail:`最基础的行级过滤——后面的子句都叠加在这种结果之上。`,stage:0,type:`init`,expected:{columns:[`姓名`,`专业`,`成绩`],rows:[[`周八`,`计算机`,95],[`李四`,`软件工程`,92],[`张三`,`计算机`,88],[`赵六`,`网络工程`,85]]}},{sql:`SELECT 学生.姓名 AS 姓名, 学生.专业 AS 专业
FROM "学生"
LEFT JOIN "选课" ON 学生.学号 = 选课.学号
WHERE 选课.课程号 IS NULL
ORDER BY 学生.学号;`,description:`LEFT JOIN + IS NULL：反查从未选课的学生 → 赵六、周八`,detail:`「没有选课记录」无法用 WHERE 成绩=NULL 表达——NULL 判等必须用 IS NULL，配合外连接的补 NULL 行为。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`专业`],rows:[[`赵六`,`网络工程`],[`周八`,`计算机`]]},rowTags:{0:`未选课`,1:`未选课`}},{sql:`SELECT 姓名 FROM "学生" WHERE 专业 = '计算机' AND 成绩 >= 90
UNION
SELECT 姓名 FROM "学生" WHERE 专业 = '软件工程' AND 成绩 >= 90
ORDER BY 姓名;`,description:`UNION 合并两查询：计算机 ≥90 与 软件工程 ≥90 → 周八、李四`,detail:`两个查询的列结构必须一致；UNION 自动去重（同名的行只留一条），要保留重复用 UNION ALL。`,stage:2,type:`edge-select`,expected:{columns:[`姓名`],rows:[[`周八`],[`李四`]]}},{sql:`SELECT 姓名 FROM "学生" s
WHERE EXISTS (SELECT 1 FROM "选课" c WHERE c.学号 = s.学号)
ORDER BY s.学号;`,description:`EXISTS 相关子查询：外层每行问一次「选过课吗」→ 4 人`,detail:`EXISTS 只判断子查询「有没有结果行」，返回 true/false——与 IN 的区别在于对 NULL 的处理和短路特性，相关子查询随外层行反复执行。`,stage:3,type:`edge-select`,expected:{columns:[`姓名`],rows:[[`张三`],[`李四`],[`王五`],[`孙七`]]}},{sql:`SELECT 专业, COUNT(*) AS 选课人数
FROM "学生"
WHERE 学号 IN (SELECT 学号 FROM "选课")
GROUP BY 专业
HAVING COUNT(*) >= 1
ORDER BY 选课人数 DESC, 专业;`,description:`综合：IN 子查询 + GROUP BY + HAVING → 计算机 2 人、软件工程 2 人`,detail:`子查询先圈定「选过课」的学号集合，外层再分组统计——多个子句各司其职的完整闭环。`,stage:3,type:`complete`,expected:{columns:[`专业`,`选课人数`],rows:[[`计算机`,2],[`软件工程`,2]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:1,prompt:`LEFT JOIN 后 WHERE 选课.课程号 IS NULL 找到的是？`,options:[`选课最多的学生`,`没有选课的学生`,`成绩为 NULL 的行`,`重复选课的行`],correctAnswer:`没有选课的学生`,hint:`LEFT JOIN 给无匹配的左表行补了什么？`,explanation:`外连接把「无匹配」表现为右列全 NULL，因此 IS NULL 过滤剩下的正是左表独有行——反查缺失关系的标准模式。`},{type:`choose-next`,stepIndex:3,prompt:`EXISTS 相关子查询与 IN 子查询的关键差异是？`,options:[`EXISTS 更慢`,`EXISTS 随外层每行判断「是否存在」，IN 先算出值集合再判断成员`,`EXISTS 不能用 WHERE`,`没有差异`],correctAnswer:`EXISTS 随外层每行判断「是否存在」，IN 先算出值集合再判断成员`,hint:`相关 = 引用了外层的列`,explanation:`EXISTS 子查询引用外层列（相关），逐行短路求值；IN 子查询通常一次算好集合。两者常可互换，优化器会改写。`}]};function c(){return i(s)}var l=e(`在基础 SELECT 之上的四类进阶：<span class="mono">LEFT JOIN + IS NULL</span> 反查缺失关系、 <span class="mono">UNION</span> 合并去重、<span class="mono">EXISTS</span> 相关子查询逐行判断，
		最后以一个 IN + GROUP BY + HAVING 的综合查询收束。 每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function u(e){r(e,{sectionNum:`§05`,sectionName:`高级查询`,title:`高级查询`,desc:e=>{t();var r=l();t(8),n(e,r)},children:(e,t)=>{a(e,{get load(){return c},topicId:`sql-advanced`,topicName:`高级查询`})},$$slots:{desc:!0,default:!0}})}export{u as component};