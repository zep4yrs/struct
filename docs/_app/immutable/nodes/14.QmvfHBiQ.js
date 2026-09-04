import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/tBCxl3B_.js";import{n as i,t as a}from"../chunks/D08-KPvW.js";var o={name:`WHERE 与 HAVING`,seedSql:`-- M2.6 WHERE vs HAVING seed：订单表（SQLite 方言）
CREATE TABLE "订单" ("订单号" INTEGER, "区域" TEXT, "金额" INTEGER);
INSERT INTO "订单" VALUES
  (101, '华东', 500),
  (102, '华南', 200),
  (103, '华东', 350),
  (104, '华北', 150),
  (105, '华南', 600),
  (106, '华东', 250),
  (107, '华北', 450);
`,stages:[`WHERE：分组前逐行过滤`,`GROUP BY：按区域分组聚合`,`HAVING：分组后筛选组`,`组合：WHERE + GROUP BY + HAVING`],frames:[{sql:`SELECT 订单号, 区域, 金额 FROM "订单"
WHERE 金额 >= 400
ORDER BY 订单号;`,description:`WHERE 金额 >= 400：分组之前逐行过滤（7 行 → 3 行）`,detail:`WHERE 作用于「原始行」，此时还没有分组，因此不能使用聚合函数（SUM/COUNT 等）——写了就报错。`,stage:0,type:`init`,expected:{columns:[`订单号`,`区域`,`金额`],rows:[[101,`华东`,500],[105,`华南`,600],[107,`华北`,450]]}},{sql:`SELECT 区域, COUNT(*) AS 单数, SUM(金额) AS 总额
FROM "订单"
GROUP BY 区域
ORDER BY 区域;`,description:`GROUP BY 区域：全部 7 行参与分组（华东 3 单 1100 · 华北 2 单 600 · 华南 2 单 800）`,detail:`没写 WHERE 时所有行都进分组。中文列的 ORDER BY 按字符编码排序（华东→华北→华南），与拼音无关。`,stage:1,type:`default`,expected:{columns:[`区域`,`单数`,`总额`],rows:[[`华东`,3,1100],[`华北`,2,600],[`华南`,2,800]]}},{sql:`SELECT 区域, COUNT(*) AS 单数, SUM(金额) AS 总额
FROM "订单"
GROUP BY 区域
HAVING SUM(金额) >= 1000
ORDER BY 区域;`,description:`HAVING SUM(金额) >= 1000：分组之后筛「组」——只剩华东`,detail:`HAVING 作用于「组」，聚合函数只能出现在这里（或 SELECT）。华南 800 被整组过滤掉，一行都不剩。`,stage:2,type:`edge-select`,expected:{columns:[`区域`,`单数`,`总额`],rows:[[`华东`,3,1100]]}},{sql:`SELECT 区域, SUM(金额) AS 总额
FROM "订单"
WHERE 金额 >= 200
GROUP BY 区域
HAVING SUM(金额) >= 800
ORDER BY 区域;`,description:`组合拳：WHERE 先筛行（丢 150 订单）→ 分组 → HAVING 再筛组`,detail:`执行顺序 FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY。小单 150 先被 WHERE 丢掉，华北组因此只有 450，过不了 HAVING 的 800 门槛。`,stage:3,type:`complete`,expected:{columns:[`区域`,`总额`],rows:[[`华东`,850],[`华南`,850]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:2,prompt:`把 HAVING SUM(金额) >= 1000 改写到 WHERE 里可以吗？`,options:[`可以，结果一样`,`不可以，聚合函数不能出现在 WHERE 中`,`可以，但会变慢`,`SQLite 里可以，MySQL 不行`],correctAnswer:`不可以，聚合函数不能出现在 WHERE 中`,hint:`WHERE 执行时组还没形成`,explanation:`WHERE 在分组前执行，此时没有「组」，SUM 无从谈起——直接语法错误。对聚合结果过滤必须用 HAVING。`},{type:`choose-next`,stepIndex:3,prompt:`组合查询里华北被过滤掉，直接原因是？`,options:[`WHERE 丢掉了 150 的订单，华北组总额只剩 450`,`HAVING 不认识华北`,`GROUP BY 把华北排除了`,`ORDER BY 把华北排到了末尾`],correctAnswer:`WHERE 丢掉了 150 的订单，华北组总额只剩 450`,hint:`华北两单是 150 和 450`,explanation:`WHERE 金额>=200 先把 150 的订单丢掉，华北组只剩 450，过不了 HAVING >= 800——这正是「先筛行后筛组」的连锁效应。`}]};function s(){return i(o)}var c=e(`<b>WHERE 筛行、HAVING 筛组</b>——一条查询的执行顺序是 FROM → WHERE → GROUP BY → HAVING → SELECT →
		ORDER BY。逐帧观察分组前后的两次过滤各自丢掉了什么。 <span class="mono">SQLite 方言演示</span>。`,1);function l(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`WHERE 与 HAVING`,desc:e=>{var r=c();t(3),n(e,r)},children:(e,t)=>{a(e,{get load(){return s},topicId:`having-deep`,topicName:`WHERE 与 HAVING`})},$$slots:{desc:!0,default:!0}})}export{l as component};