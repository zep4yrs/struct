-- ═══════════════════════════════════════════════════════════════
-- SQL 工作台种子库：express_station 校园快递驿站（对齐王晨阳老师
-- sql2026 教参 第04讲 综合项目实战，schema/数据 1:1，MySQL→SQLite 方言翻译）
-- 教参原文：code/第04讲_校园快递驿站.sql（CREATE DATABASE/USE/AUTO_INCREMENT/
-- COMMENT 为 MySQL 专属，SQLite 下的等价写法见下）
-- ═══════════════════════════════════════════════════════════════

-- 货架表（被引用表）
CREATE TABLE "shelves"
(
    "shelf_id"      INTEGER PRIMARY KEY AUTOINCREMENT, -- 货架编号
    "shelf_code"    TEXT NOT NULL UNIQUE,              -- 货架编码（如 A-01）
    "area"          TEXT NOT NULL,                     -- 所在区域（A区/B区/C区）
    "capacity"      INTEGER NOT NULL,                  -- 最大容量
    "current_count" INTEGER NOT NULL DEFAULT 0         -- 当前存放数量
);

-- 包裹表（引用 shelves）
CREATE TABLE "packages"
(
    "package_id"      INTEGER PRIMARY KEY AUTOINCREMENT, -- 包裹编号
    "tracking_no"     TEXT NOT NULL UNIQUE,              -- 快递单号
    "recipient_name"  TEXT NOT NULL,                     -- 收件人姓名
    "recipient_phone" TEXT NOT NULL,                     -- 收件人手机号
    "shelf_id"        INTEGER NOT NULL,                  -- 所在货架
    "courier_company" TEXT NOT NULL,                     -- 快递公司
    "status"          TEXT NOT NULL DEFAULT '待取件',     -- 状态
    "arrival_time"    TEXT NOT NULL,                     -- 到达时间
    "pickup_time"     TEXT DEFAULT NULL,                 -- 取件时间
    "pickup_code"     TEXT NOT NULL,                     -- 取件码
    FOREIGN KEY ("shelf_id") REFERENCES "shelves" ("shelf_id")
);

-- 投诉表（引用 packages）
CREATE TABLE "complaints"
(
    "complaint_id"   INTEGER PRIMARY KEY AUTOINCREMENT, -- 投诉编号
    "package_id"     INTEGER NOT NULL,                  -- 被投诉的包裹
    "complaint_type" TEXT NOT NULL,                     -- 投诉类型
    "description"    TEXT,                              -- 详细描述
    "status"         TEXT NOT NULL DEFAULT '待处理',     -- 处理状态
    "created_at"     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 投诉时间
    FOREIGN KEY ("package_id") REFERENCES "packages" ("package_id")
);

-- ───────────────── 初始数据（Part 3）─────────────────

-- 录入货架信息
INSERT INTO "shelves" ("shelf_code", "area", "capacity", "current_count") VALUES
('A-01', 'A区', 50, 0),
('A-02', 'A区', 50, 0),
('B-01', 'B区', 40, 0),
('B-02', 'B区', 40, 0),
('C-01', 'C区', 30, 0),
('C-02', 'C区', 30, 0);

-- 录入包裹信息
INSERT INTO "packages" ("tracking_no", "recipient_name", "recipient_phone", "shelf_id", "courier_company", "status", "arrival_time", "pickup_time", "pickup_code") VALUES
('SF2026001', '张三',   '13800001111', 1, '顺丰', '已取件', '2026-03-25 09:00:00', '2026-03-25 14:30:00', '582916'),
('ZT2026001', '李四',   '13800002222', 1, '中通', '待取件', '2026-03-25 09:30:00', NULL, '173042'),
('YT2026001', '王五',   '13800003333', 2, '圆通', '待取件', '2026-03-25 10:00:00', NULL, '294518'),
('JD2026001', '赵六',   '13800004444', 2, '京东', '已取件', '2026-03-25 10:30:00', '2026-03-25 16:00:00', '837261'),
('YD2026001', '孙七',   '13800005555', 3, '韵达', '超期',   '2026-03-20 08:00:00', NULL, '461029'),
('SF2026002', '周八',   '13800006666', 3, '顺丰', '待取件', '2026-03-26 09:00:00', NULL, '715384'),
('ZT2026002', '吴九',   '13800007777', 4, '中通', '已退回', '2026-03-22 11:00:00', NULL, '928653'),
('YT2026002', '郑十',   '13800008888', 4, '圆通', '待取件', '2026-03-26 10:30:00', NULL, '346172'),
('SF2026003', '张三',   '13800001111', 5, '顺丰', '待取件', '2026-03-26 11:00:00', NULL, '502847'),
('JD2026002', '李四',   '13800002222', 5, '京东', '待取件', '2026-03-26 13:00:00', NULL, '693157'),
('ZT2026003', '陈十一', '13800009999', 1, '中通', '超期',   '2026-03-19 15:00:00', NULL, '184726'),
('YD2026002', '林十二', '13800010000', 2, '韵达', '待取件', '2026-03-26 14:00:00', NULL, '275483'),
('SF2026004', '王五',   '13800003333', 6, '顺丰', '已取件', '2026-03-24 09:00:00', '2026-03-24 18:00:00', '816394'),
('ZT2026004', '赵六',   '13800004444', 6, '中通', '待取件', '2026-03-26 15:00:00', NULL, '429561'),
('YT2026003', '张三',   '13800001111', 3, '圆通', '待取件', '2026-03-26 16:00:00', NULL, '657238');

-- 录入投诉记录
INSERT INTO "complaints" ("package_id", "complaint_type", "description", "status", "created_at") VALUES
(5,  '通知不及时', '包裹到了3天才收到短信通知',             '待处理', '2026-03-23 10:00:00'),
(7,  '放错位置',   '包裹标签写B区，实际放在了C区，找了半天', '已解决', '2026-03-23 14:00:00'),
(5,  '超时未处理', '投诉了2天了还没人管',                   '待处理', '2026-03-25 09:00:00'),
(11, '通知不及时', '包裹到了一周才通知',                     '处理中', '2026-03-26 08:00:00');

-- 初始化货架库存数量
UPDATE "shelves" SET "current_count" = 2 WHERE "shelf_id" = 1;
UPDATE "shelves" SET "current_count" = 2 WHERE "shelf_id" = 2;
UPDATE "shelves" SET "current_count" = 3 WHERE "shelf_id" = 3;
UPDATE "shelves" SET "current_count" = 1 WHERE "shelf_id" = 4;
UPDATE "shelves" SET "current_count" = 2 WHERE "shelf_id" = 5;
UPDATE "shelves" SET "current_count" = 1 WHERE "shelf_id" = 6;
