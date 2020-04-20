#!/bin/sh -ex
BENCHDIR=$(pwd)/mmseqs2-benchmark-pub/
export PATH=$BENCHDIR/tools:$BENCHDIR/mmseqs-benchmark/build/:$PATH
QUERY=$BENCHDIR/db/query.fasta
DB=$BENCHDIR/db/targetdb.fasta

# embed sequences and create database
/bin/time -v ./createdb $DB $BENCHDIR/db/mmseqs/db
/bin/time -v ./createdb $QUERY $BENCHDIR/db/mmseqs/query

# execute search
/bin/time -v mmseqs createtsv $BENCHDIR/db/mmseqs/query $BENCHDIR/db/mmseqs/db $BENCHDIR/results/mmseqs/results_faster_pref $BENCHDIR/results/mmseqs/results_faster_pref.tsv 

awk '{print $1"\t"$2"\t"0"\t"0"\t"0"\t"0"\t"0"\t"0"\t"0"\t"0"\t"$3"\t"0}' $BENCHDIR/results/mmseqs/results_faster_pref.tsv > $BENCHDIR/results/mmseqs/results_faster_pref.m8

