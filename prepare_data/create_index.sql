--
--
-- Creates `index`es on the necessary columns
-- PGPASSWORD=psqlpass psql -U postgres -p 5433 -h 131.215.26.148  < create_index.sql
-- 
--


\connect eastdb

-- Simple hash index on the id and sequence
CREATE INDEX IF NOT EXISTS id_hash_idx ON up_dspace USING hash(ids);
CREATE INDEX IF NOT EXISTS seq_hash_idx ON up_dspace USING hash(seqs);

-- Populate cube column and then create gist index on each

UPDATE test
    SET cube_3d = cube(array[preds_3dim_0, preds_3dim_1, preds_3dim_2]);
CREATE INDEX IF NOT EXISTS cube_3d_idx ON up_dspace USING gist(cube_3d);

UPDATE test
    SET cube_8d = cube(array[preds_8dim_0, preds_8dim_1, preds_8dim_2,
	                     preds_8dim_3, preds_8dim_4, preds_8dim_5,
			     preds_8dim_6, preds_8dim_7]);
CREATE INDEX IF NOT EXISTS cube_8d_idx ON up_dspace USING gist(cube_8d);

-- drop numeric columns
-- ALTER TABLE up_dspace DROP COLUMN preds_3dim_0, preds_3dim_1, preds_3dim_2;
-- ALTER TABLE up_dspace DROP COLUMN preds_8dim_0, preds_8dim_1, preds_8dim_2,
--                                   preds_8dim_3, preds_8dim_4, preds_8dim_5,
--                                   preds_8dim_6, preds_8dim_7;

