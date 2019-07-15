--
--
-- Creates `index`es on the necessary columns
-- PGPASSWORD=psqlpass psql -U postgres -p 5433 -h 192.168.157.69 < load_data.sql
-- 
--


-- \connect eastdb
CREATE extension cube;

DROP TABLE IF EXISTS uniref50;

CREATE TABLE IF NOT EXISTS uniref50 (
    ids VARCHAR(10),
    coords_3d float[3],
    coords_8d float[8]
);

DROP TABLE IF EXISTS uniref50_seq;

CREATE TABLE IF NOT EXISTS uniref50_seq (
    ids VARCHAR(10),
    seq TEXT
);


COPY Uniref50 from 'embed.import.csv' CSV;
COPY Uniref50_Seq from 'seq.import.csv' CSV;

-- Simple hash index on the id
CREATE INDEX IF NOT EXISTS id_hash_idx ON Uniref50 USING hash(ids);
CREATE INDEX IF NOT EXISTS id_hash_idx ON Uniref50_seq USING hash(ids);


-- Populate cube column and then create gist index on each
ALTER TABLE Uniref50
    ADD COLUMN cube_3d cube;
    

UPDATE Uniref50
    SET cube_3d = cube(coords_3d);
CREATE INDEX IF NOT EXISTS cube_3d_idx ON Uniref50 USING gist(cube_3d);

ALTER TABLE Uniref50
    ADD COLUMN cube_8d cube;

UPDATE Uniref50
    SET cube_8d = cube(coords_8d);
CREATE INDEX IF NOT EXISTS cube_8d_idx ON Uniref50 USING gist(cube_8d);


