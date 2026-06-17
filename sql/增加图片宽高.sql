-- 为 photos 表补充图片实际宽高
SET @has_width := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'photos'
    AND COLUMN_NAME = 'width'
);

SET @sql := IF(
  @has_width = 0,
  'ALTER TABLE photos ADD COLUMN width INT DEFAULT NULL AFTER path',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_height := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'photos'
    AND COLUMN_NAME = 'height'
);

SET @sql := IF(
  @has_height = 0,
  'ALTER TABLE photos ADD COLUMN height INT DEFAULT NULL AFTER width',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;