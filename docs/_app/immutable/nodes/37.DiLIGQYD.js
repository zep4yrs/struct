import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/BCoC9h1q.js";import{n as i,t as a}from"../chunks/CCXrgTeX.js";var o={name:`SQL 集合运算`,seedSql:`-- M2 · 集合运算 seed：两门选修课报名表（SQLite 方言）
CREATE TABLE "python班" ("姓名" TEXT, "学号" INTEGER);
INSERT INTO "python班" VALUES
  ('张三', 20101),
  ('李四', 20102),
  ('王五', 20103),
  ('赵六', 20104);

CREATE TABLE "c班" ("姓名" TEXT, "学号" INTEGER);
INSERT INTO "c班" VALUES
  ('李四', 20102),
  ('王五', 20103),
  ('孙七', 20105),
  ('周八', 20106);
`,stages:[`FROM / SELECT：取各班报名名单`,`集合运算：UNION 并 · INTERSECT 交 · EXCEPT 差`,`聚合小结：对运算结果 COUNT`],frames:[{sql:`SELECT * FROM "python班" ORDER BY 学号;`,description:`先看 Python 班 4 名学员`,detail:`集合运算的操作对象是「行集合」——先备好两张结构相同（列数与类型一致）的表。`,stage:0,type:`init`,expected:{columns:[`姓名`,`学号`],rows:[[`张三`,20101],[`李四`,20102],[`王五`,20103],[`赵六`,20104]]}},{sql:`SELECT 姓名, 学号 FROM "python班"
UNION
SELECT 姓名, 学号 FROM "c班"
ORDER BY 学号;`,description:`UNION 并集：两班合并，重复报名自动去重 → 6 人`,detail:`UNION = A ∪ B。李四、王五两班都报，只出现一次；要保留重复需用 UNION ALL。SQLite 对 UNION 隐式排序以保证去重，这里再显式 ORDER BY 稳定输出。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`学号`],rows:[[`张三`,20101],[`李四`,20102],[`王五`,20103],[`赵六`,20104],[`孙七`,20105],[`周八`,20106]]},rowTags:{0:`仅Python`,1:`共有`,2:`共有`,3:`仅Python`,4:`仅C班`,5:`仅C班`}},{sql:`SELECT 姓名, 学号 FROM "python班"
INTERSECT
SELECT 姓名, 学号 FROM "c班"
ORDER BY 学号;`,description:`INTERSECT 交集：两班都报的人 → 李四、王五`,detail:`INTERSECT = A ∩ B，只保留同时出现在两个结果集中的行，同样自动去重。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`学号`],rows:[[`李四`,20102],[`王五`,20103]]},rowTags:{0:`共有`,1:`共有`}},{sql:`SELECT 姓名, 学号 FROM "python班"
EXCEPT
SELECT 姓名, 学号 FROM "c班"
ORDER BY 学号;`,description:`EXCEPT 差集：报了 Python 班且没报 C 班 → 张三、赵六`,detail:`A EXCEPT B = A − B，方向很重要：交换两张表会得到完全不同的结果（C 班独报是孙七、周八）。`,stage:1,type:`edge-select`,expected:{columns:[`姓名`,`学号`],rows:[[`张三`,20101],[`赵六`,20104]]},rowTags:{0:`仅Python`,1:`仅Python`}},{sql:`SELECT 'UNION 并集' AS 运算, COUNT(*) AS 行数 FROM (SELECT 学号 FROM "python班" UNION SELECT 学号 FROM "c班")
UNION ALL
SELECT 'INTERSECT 交集', COUNT(*) FROM (SELECT 学号 FROM "python班" INTERSECT SELECT 学号 FROM "c班")
UNION ALL
SELECT 'EXCEPT 差集', COUNT(*) FROM (SELECT 学号 FROM "python班" EXCEPT SELECT 学号 FROM "c班");`,description:`小结：三种运算的行数对照（6 / 2 / 2）`,detail:`4 + 4 − 2（重复）= 6，验证容斥思想；差集是单向的——「A 独有」与「B 独有」要分别计算。`,stage:2,type:`complete`,expected:{columns:[`运算`,`行数`],rows:[[`UNION 并集`,6],[`INTERSECT 交集`,2],[`EXCEPT 差集`,2]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:1,prompt:`若想把两班名单原样合并、保留重复报名的行，应该用？`,options:[`UNION`,`UNION ALL`,`INTERSECT`,`EXCEPT`],correctAnswer:`UNION ALL`,hint:`UNION 会做什么处理？`,explanation:`UNION 默认去重（本例 4+4 变 6 行）；UNION ALL 不去重，直接 8 行返回。需要保留重复记录时用 UNION ALL。`},{type:`choose-next`,stepIndex:3,prompt:`"c班" EXCEPT "python班" 的结果是？`,options:[`张三、赵六`,`李四、王五`,`孙七、周八`,`空集`],correctAnswer:`孙七、周八`,hint:`EXCEPT 保留「在左表、不在右表」的行，注意方向`,explanation:`A EXCEPT B 是「只在 A 中出现」的行。c 班 4 人去掉共有的李四、王五，剩下孙七、周八——与 python EXCEPT c 方向相反。`}]};function s(){return i(o)}var c=e(`UNION 并 · INTERSECT 交 · EXCEPT 差——三个对<b>行集合</b>的直接运算。每帧都是一条真实执行的 SQL（<span class="mono">SQLite 方言演示</span>），观察两张报名表如何合并、求交、做差。`,1);function l(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`SQL 集合运算`,desc:e=>{t();var r=c();t(4),n(e,r)},children:(e,t)=>{a(e,{get load(){return s},topicId:`union-set`,topicName:`SQL 集合运算`})},$$slots:{desc:!0,default:!0}})}export{l as component};