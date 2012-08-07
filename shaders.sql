CREATE TABLE `shaders` (
  `id`          int(11)         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `short_id`    varchar(20)     NOT NULL,
  `date`        timestamp       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `z`           text,
  `r`           varchar(255),
  `d`           float,
  UNIQUE KEY `short_id` (`short_id`)
) DEFAULT CHARSET=utf8;
