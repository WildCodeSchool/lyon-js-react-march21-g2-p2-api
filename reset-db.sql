--@block : Resest the reviews table (tmdb_id, title & comment, user_name)
USE dolly;
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(100) NOT NULL,
  `tmdb_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `user_name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8;
INSERT INTO
  `reviews` (title, tmdb_id, comment, user_name)
VALUES
  ('Mortal Kombat', '460465', 'This is the best movie ever!', 'Doriane');
