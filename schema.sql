-- 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- 创建图片表
CREATE TABLE IF NOT EXISTS photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  width INT DEFAULT NULL,
  height INT DEFAULT NULL,
  user_id INT NOT NULL,
  status INT DEFAULT 1, -- 1: 正常, 0: 已删除
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 创建图片-分类关联表
CREATE TABLE IF NOT EXISTS photo_categories (
  photo_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (photo_id, category_id),
  FOREIGN KEY (photo_id) REFERENCES photos (id),
  FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- 插入默认分类
INSERT INTO categories (name) VALUES ('全部');
INSERT INTO categories (name) VALUES ('风景');
INSERT INTO categories (name) VALUES ('人物');
INSERT INTO categories (name) VALUES ('动物');
INSERT INTO categories (name) VALUES ('建筑');

-- 插入默认用户 (密码: admin123)
INSERT INTO users (username, password) VALUES ('admin', 'admin123');
