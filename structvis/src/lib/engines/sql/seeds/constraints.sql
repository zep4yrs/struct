-- M2.11 约束体系 seed：学生 / 选课（PK · NOT NULL · UNIQUE · CHECK · FK CASCADE）
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
