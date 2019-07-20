--
--
-- Creates `index`es on the necessary columns
-- PGPASSWORD=psqlpass psql -d eastdb -U postgres -p 5433 -h 192.168.157.69 -vdir="/home/saladi/github/eastdb" < setup_table.sql
-- 
--


-- \connect eastdb
CREATE EXTENSION IF NOT EXISTS cube;

-- create tables
DROP TABLE IF EXISTS uniref50;
CREATE TABLE IF NOT EXISTS uniref50 (
    id VARCHAR(15),
    coords_3d cube,
    coords_8d cube
);


DROP TABLE IF EXISTS uniref50_seq;
CREATE TABLE IF NOT EXISTS uniref50_seq (
    id VARCHAR(15),
    seq TEXT
);

