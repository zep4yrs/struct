import{E as e,rt as t,w as n}from"../chunks/BeWIKSww.js";import"../chunks/xihTtKlq.js";import{n as r}from"../chunks/BRm1gARQ.js";import{n as i,t as a}from"../chunks/BBGqNeZw.js";var o={name:`约束体系`,seedSql:`-- M2.11 约束体系 seed：学生 / 选课（PK · NOT NULL · UNIQUE · CHECK · FK CASCADE）
CREATE TABLE "学生"
(
    "学号" INTEGER PRIMARY KEY,
    "姓名" TEXT NOT NULL,
    "邮箱" TEXT UNIQUE,
    "分数" INTEGER CHECK (分数 BETWEEN 0 AND 100)
);

CREATE TABLE "选课"
(
    "学号" INTEGER,
    "课程" TEXT,
    FOREIGN KEY (学号) REFERENCES "学生" (学号) ON DELETE CASCADE
);
`,stages:[`DDL：建表即定规矩`,`列约束：PK / NOT NULL / UNIQUE / CHECK`,`表间约束：外键与级联`],frames:[{sql:`SELECT name, type, notnull, pk FROM pragma_table_info('学生');`,description:`先看「规矩」：学生表的列级约束清单（pragma_table_info）`,detail:`学号 pk=1（主键）、姓名 notnull=1（非空）、邮箱 UNIQUE、分数 CHECK——约束写在 DDL 里，之后所有写入自动被检查。`,stage:0,type:`init`,expected:{columns:[`name`,`type`,`notnull`,`pk`],rows:[[`学号`,`INTEGER`,0,1],[`姓名`,`TEXT`,1,0],[`邮箱`,`TEXT`,0,0],[`分数`,`INTEGER`,0,0]]}},{sql:`INSERT INTO "学生" VALUES (1, '张三', NULL, 90);
INSERT OR IGNORE INTO "学生" VALUES (1, '张三二号', NULL, 85);
SELECT changes() AS 实际插入行数;`,description:`主键冲突：学号=1 已存在，第二条 INSERT 被拒绝（插入 0 行）`,detail:`INSERT OR IGNORE 把「违反约束」从报错变成静默跳过，changes() 返回 0 即可观察约束是否生效。生产上应显式捕获冲突（如 ON CONFLICT 子句）。`,stage:1,type:`edge-select`,expected:{columns:[`实际插入行数`],rows:[[0]]},rowTags:{0:`PK 拒绝`}},{sql:`INSERT OR IGNORE INTO "学生" VALUES (2, '李四', 'zs@x.com', 80);
INSERT OR IGNORE INTO "学生" VALUES (3, '王五', 'zs@x.com', 70);
SELECT changes() AS 实际插入行数;`,description:`UNIQUE 邮箱重复：第二条被拒绝（0 行）；注意多条 NULL 不算重复`,detail:`UNIQUE 约束列里 NULL 之间互不冲突（SQL 标准「NULL ≠ NULL」）——上一帧张三的邮箱就是 NULL。这是面试高频细节。`,stage:1,type:`edge-select`,expected:{columns:[`实际插入行数`],rows:[[0]]},rowTags:{0:`UNIQUE 拒绝`}},{sql:`INSERT OR IGNORE INTO "学生" VALUES (4, '赵六', 'zl@x.com', 105);
SELECT changes() AS 实际插入行数;`,description:`CHECK 越界：分数 105 不在 0~100，被拒绝`,detail:`CHECK(分数 BETWEEN 0 AND 100) 让数据库成为「最后防线」——应用层漏判的脏数据在这里被拦下。MySQL 8.0.16 之前 CHECK 只解析不执行，注意版本。`,stage:1,type:`edge-select`,expected:{columns:[`实际插入行数`],rows:[[0]]},rowTags:{0:`CHECK 拒绝`}},{sql:`PRAGMA foreign_keys = ON;
INSERT INTO "选课" VALUES (1, '数学');
SELECT COUNT(*) AS 有效选课数 FROM "选课";`,description:`外键生效：学号 1 存在于学生表，选课插入成功`,detail:`SQLite 默认关闭外键检查，必须每连接执行 PRAGMA foreign_keys=ON；MySQL InnoDB 默认开启。这是两大数据库最易踩的方言差异之一。`,stage:2,type:`edge-select`,expected:{columns:[`有效选课数`],rows:[[1]]}},{sql:`DELETE FROM "学生" WHERE 学号 = 1;
SELECT COUNT(*) AS 剩余选课 FROM "选课" WHERE 学号 = 1;`,description:`ON DELETE CASCADE：删除学生，其选课记录自动级联消失`,detail:`外键 ON DELETE CASCADE 把「先删子表再删父表」的手工顺序交给数据库。换成 RESTRICT 则父表删除被直接拒绝——按业务语义选择级联策略。`,stage:2,type:`complete`,expected:{columns:[`剩余选课`],rows:[[0]]}}],practiceQuestions:[{type:`choose-next`,stepIndex:2,prompt:`邮箱列是 UNIQUE，插入两条邮箱都为 NULL 的行会怎样？`,options:[`第二条被拒绝`,`两条都成功`,`第一条被拒绝`,`整表损坏`],correctAnswer:`两条都成功`,hint:`SQL 标准里 NULL 与 NULL 相等吗？`,explanation:`UNIQUE 判定的是「值相等」，而 NULL 表示未知、彼此不相等——所以多条 NULL 共存合法。想强制唯一非空，加 NOT NULL。`},{type:`choose-next`,stepIndex:5,prompt:`把外键改成 ON DELETE RESTRICT，删除学号=1 的学生会怎样？`,options:[`成功并级联删选课`,`被拒绝：存在选课记录`,`选课记录变 NULL`,`学生表被清空`],correctAnswer:`被拒绝：存在选课记录`,hint:`RESTRICT 的字面意思`,explanation:`RESTRICT = 只要子表还有引用就拒绝删除父表；CASCADE 才会连带删除。选哪种取决于业务要不要「连带责任」。`}]};function s(){return i(o)}var c=e(`<b>PK · NOT NULL · UNIQUE · CHECK · 外键级联</b>五大约束操作台： 用 INSERT OR IGNORE + changes()
		观察每条约束是否真的把坏数据拦下。 每帧都是真实执行的 SQL（<span class="mono">SQLite 方言演示</span>）。`,1);function l(e){r(e,{sectionNum:`§05`,sectionName:`SQL 实验`,title:`约束体系`,desc:e=>{var r=c();t(3),n(e,r)},children:(e,t)=>{a(e,{get load(){return s},topicId:`constraints`,topicName:`约束体系`})},$$slots:{desc:!0,default:!0}})}export{l as component};