-- Set the context to the NewsArts database
USE NewsArts;

-- Create the ngn_inews_items table
CREATE TABLE IF NOT EXISTS ngn_inews_items (
    uid bigint NOT NULL AUTO_INCREMENT,
    name nvarchar(256) NOT NULL,
    lastupdate bigint NOT NULL,
    production bigint NOT NULL,
    rundown bigint NOT NULL,
    story bigint NOT NULL,
    ord int NOT NULL,
    ordupdate bigint NOT NULL,
    template bigint NOT NULL,
    data text NULL,
    scripts text NULL,
    enabled bit NOT NULL,
    tag text NULL,
    PRIMARY KEY (uid)
) ENGINE=InnoDB;
