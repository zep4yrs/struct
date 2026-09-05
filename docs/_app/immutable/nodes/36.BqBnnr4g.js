import{E as e,ot as t,w as n}from"../chunks/DLvny-g4.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/Dian-3jp.js";import{n as i,t as a}from"../chunks/TV1Ru-Hn.js";var o={name:`触发器`,seedSql:`-- M3.3 触发器 seed：选课 + 日志表（SQLite 方言）
CREATE TABLE "选课"
(
    "学号"   INTEGER,
    "课程号" TEXT,
    "成绩"   INTEGER
);

CREATE TABLE "选课日志"
(
    "日志号" INTEGER PRIMARY KEY AUTOINCREMENT,
    "学号"   INTEGER,
    "课程号" TEXT,
    "动作"   TEXT
);
`,stages:[`观察目标表`,`CREATE TRIGGER：挂上自动逻辑`,`触发验证：DML 带动日志`,`时机与粒度`],frames:[{sql:`SELECT * FROM "选课日志" ORDER BY 日志号;`,description:`日志表当前为空——接下来让触发器自动往里写`,detail:`触发器的价值就在「自动」：应用层不写一行代码，数据库在 DML 时刻自动执行挂载的逻辑。`,stage:0,type:`init`,expected:{columns:[`日志号`,`学号`,`课程号`,`动作`],rows:[]}},{sql:`CREATE TRIGGER "记录选课"
AFTER INSERT ON "选课"
FOR EACH ROW
BEGIN
  INSERT INTO "选课日志" (学号, 课程号, 动作) VALUES (NEW.学号, NEW.课程号, '已选课');
END;
SELECT '触发器已创建' AS 状态;`,description:`CREATE TRIGGER：AFTER INSERT ON 选课 → 自动写一条日志`,detail:`NEW.列 引用「正在插入的新行」；AFTER 表示在插入成功之后执行（BEFORE 则在之前，可用于校验/改写）。FOR EACH ROW = 每受影响行触发一次。`,stage:1,type:`edge-select`,expected:{columns:[`状态`],rows:[[`触发器已创建`]]}},{sql:`INSERT INTO "选课" VALUES (20101, 'CS101', 95);
SELECT * FROM "选课日志" ORDER BY 日志号;`,description:`INSERT 一条选课 → 日志表自动出现一行（应用层零代码）`,detail:`这就是 AFTER INSERT 触发器在工作：对选课表的插入成功后，数据库自动执行了 BEGIN…END 里的日志写入。`,stage:2,type:`edge-select`,expected:{columns:[`日志号`,`学号`,`课程号`,`动作`],rows:[[1,20101,`CS101`,`已选课`]]},rowTags:{0:`自动写入`}},{sql:`INSERT INTO "选课" VALUES (20102, 'CS102', 88);
INSERT INTO "选课" VALUES (20103, 'CS101', 78);
SELECT * FROM "选课日志" ORDER BY 日志号;`,description:`FOR EACH ROW：连续插入 2 条选课 → 日志累计 3 行`,detail:`每条 INSERT 命中的每一行都触发一次——批量插入 100 行就会有 100 条日志，这就是「行级触发器」的粒度。`,stage:2,expected:{columns:[`日志号`,`学号`,`课程号`,`动作`],rows:[[1,20101,`CS101`,`已选课`],[2,20102,`CS102`,`已选课`],[3,20103,`CS101`,`已选课`]]}},{sql:`SELECT name, tbl_name FROM sqlite_master WHERE type = 'trigger';`,description:`数据字典中的触发器：挂在哪张表一目了然`,detail:`MySQL 对应 information_schema.triggers。触发器适合审计日志/级联维护这类「必须跟着数据走」的逻辑；复杂业务请放应用层。`,stage:3,type:`complete`,expected:{columns:[`name`,`tbl_name`],rows:[[`记录选课`,`选课`]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:2,prompt:`NEW.学号 中的 NEW 指什么？`,options:[`新建的表`,`正在插入的那一行`,`下一个学生`,`最新的事务`],correctAnswer:`正在插入的那一行`,hint:`INSERT 事件里有「新数据」`,explanation:`行级触发器里 NEW 表示新插入/更新后的行（DELETE 里用 OLD 引用旧行）——通过它们把事件数据带进触发逻辑。`},{type:`choose-next`,stepIndex:3,prompt:`一条 INSERT 插入 100 行，FOR EACH ROW 的触发器执行几次？`,options:[`1 次`,`100 次`,`0 次`,`取决于表大小`],correctAnswer:`100 次`,hint:`FOR EACH ROW 的字面意思`,explanation:`行级触发器对每个受影响行执行一次。语句级（FOR EACH STATEMENT，MySQL 支持）才是一次。`}]};function s(){return i(o)}var c=e(`<b>CREATE TRIGGER</b>：把「插入选课 → 自动写日志」挂到数据库里，应用层零代码。 逐帧验证 AFTER
		时机、NEW 行引用与 FOR EACH ROW 行级粒度。 每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function l(e){r(e,{sectionNum:`§09`,sectionName:`编程接口`,title:`触发器`,desc:e=>{var r=c();t(3),n(e,r)},children:(e,t)=>{a(e,{get load(){return s},topicId:`triggers`,topicName:`触发器`})},$$slots:{desc:!0,default:!0}})}export{l as component};