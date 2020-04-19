--
--
-- Creates `index`es on the necessary columns
-- PGPASSWORD=psqlpass psql -d eastdb -U postgres -p 5433 -h 192.168.157.69 -vdir="/home/saladi/github/eastdb" < load_data.sql
-- 
--


-- Simple index on the id
-- hash vs B-tree
-- https://dba.stackexchange.com/a/212706/137071
-- https://stackoverflow.com/a/38168395/2320823
CREATE INDEX IF NOT EXISTS Uniref50_id_hash_idx ON Uniref50 (id);
CREATE INDEX IF NOT EXISTS Uniref50_seq_id_hash_idx ON Uniref50_seq (id);

-- Create gist index on each
-- GIN doesn't work since it doesnt support `<->` comparison op
CREATE INDEX IF NOT EXISTS Uniref50_cube_3d_idx ON Uniref50 USING gist(coords_3d);
CREATE INDEX IF NOT EXISTS Uniref50_cube_8d_idx ON Uniref50 USING gist(coords_8d);


