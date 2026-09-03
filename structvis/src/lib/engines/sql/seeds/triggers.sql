-- M3.3 触发器 seed：选课 + 日志表（SQLite 方言）
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
