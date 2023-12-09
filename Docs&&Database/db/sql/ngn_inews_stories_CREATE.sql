-- Set the context to the NewsArts database
USE NewsArts;

-- Create the ngn_inews_stories table
CREATE TABLE IF NOT EXISTS ngn_inews_stories (
    uid bigint NOT NULL AUTO_INCREMENT,
    name nvarchar(100) NULL,
    lastupdate bigint NOT NULL,
    rundown bigint NOT NULL,
    rundownname nvarchar(100) NULL,
    production bigint NOT NULL,
    ord int NOT NULL,
    ordupdate bigint NOT NULL,
    enabled bit NOT NULL,
    tag text NULL,
    identifier nvarchar(32) NULL,
    locator nvarchar(32) NULL,
    PRIMARY KEY (uid),
    UNIQUE KEY unique_rundownname_ord (rundownname, ord)

) ENGINE=InnoDB;
