--
--
-- Creates `index`es on the necessary columns
-- PGPASSWORD=psqlpass psql -d eastdb -U postgres -p 5433 -h 192.168.157.69 -vdir="/home/saladi/github/eastdb" < load_data.sql
-- 
--


-- Simple hash index on the id
CREATE INDEX IF NOT EXISTS Uniref50_id_hash_idx ON Uniref50 USING hash(id);
CREATE INDEX IF NOT EXISTS Uniref50_seq_id_hash_idx ON Uniref50_seq USING hash(id);

-- Create gist index on each
-- GIN doesn't work since it doesnt support `<->` comparison op
CREATE INDEX IF NOT EXISTS Uniref50_cube_3d_idx ON Uniref50 USING gist(coords_3d);
CREATE INDEX IF NOT EXISTS Uniref50_cube_8d_idx ON Uniref50 USING gist(coords_8d);


