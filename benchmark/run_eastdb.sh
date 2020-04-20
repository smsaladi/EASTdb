#!/bin/sh -ex
BENCHDIR=$(pwd)/mmseqs2-benchmark-pub/
export PATH=$BENCHDIR/tools:$BENCHDIR/mmseqs-benchmark/build/:$PATH
QUERY=$BENCHDIR/db/query.fasta
DB=$BENCHDIR/db/targetdb.fasta
DBANNOTATION=$BENCHDIR/db/targetannotation.fasta
/bin/time -v mmseqs createdb $DB $BENCHDIR/db/mmseqs/db
/bin/time -v mmseqs createdb $QUERY $BENCHDIR/db/mmseqs/query
/bin/time -v mmseqs createindex $BENCHDIR/db/mmseqs/db -k 7 --split 1 
/bin/time -v mmseqs prefilter $BENCHDIR/db/mmseqs/query $BENCHDIR/db/mmseqs/db $BENCHDIR/results/mmseqs/results_faster_pref --threads 16 -k 7 --k-score 140 --max-seqs 4000 
/bin/time -v mmseqs createtsv $BENCHDIR/db/mmseqs/query $BENCHDIR/db/mmseqs/db $BENCHDIR/results/mmseqs/results_faster_pref $BENCHDIR/results/mmseqs/results_faster_pref.tsv 
awk '{print $1"\t"$2"\t"0"\t"0"\t"0"\t"0"\t"0"\t"0"\t"0"\t"0"\t"$3"\t"0}' $BENCHDIR/results/mmseqs/results_faster_pref.tsv > $BENCHDIR/results/mmseqs/results_faster_pref.m8
evaluate_results $QUERY $DBANNOTATION $BENCHDIR/results/mmseqs/results_faster_pref.m8 $BENCHDIR/plots/mmseqs_faster_pref_roc5.dat 4000 1
