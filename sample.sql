drop table sample;
create table sample as select* from up_dspace;
alter table sample add column cube_3d cube;
update sample set cube_3d = cube(array[preds_3dim_0, preds_3dim_1, preds_3dim_2]);

explain analyze
    select ids, preds_3dim_0, preds_3dim_1, preds_3dim_2,
       cube_3d, '(-1,1.8,0.9)'::cube <-> cube_3d as d
    from sample
        order by d
    limit 10;

create index cube_3d_idx on sample using gist(cube_3d);


explain analyze
    select ids, preds_3dim_0, preds_3dim_1, preds_3dim_2,
       cube_3d, '(-1,1.8,0.9)'::cube <-> cube_3d as d
    from sample
        order by d
    limit 10;


alter table sample add column cube_8d cube;
update sample set cube_8d = cube(array[preds_8dim_0, preds_8dim_1, preds_8dim_2, preds_8dim_3,preds_8dim_4, preds_8dim_5, preds_8dim_6, preds_8dim_7 ]);

create index cube_8d_idx on sample using gist(cube_8d);
explain analyze select ids, cube_8d, '(-1,1.8,0.9, 1, 2, 3, 4, 5)'::cube <-> cube_8d as d from sample order by d limit 10;