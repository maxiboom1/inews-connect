-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS NewsArts;

-- Set the context to the NewsArts database
USE NewsArts;

-- Create the ngn_inews_rundowns table
CREATE TABLE IF NOT EXISTS ngn_inews_rundowns (
    uid bigint NOT NULL AUTO_INCREMENT,
    name nvarchar(32) NULL,
    lastupdate bigint NOT NULL,
    production bigint NOT NULL,
    enabled bit NOT NULL,
    exported bit NOT NULL,
    tag text NULL,
    PRIMARY KEY (uid)
) ENGINE=InnoDB;
