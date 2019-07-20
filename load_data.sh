#!/bin/bash


DIR=`pwd`
EMBED=${1}.embed.csv
SEQ=${1}.seq.csv

PGPASSWORD=psqlpass \
	psql -d eastdb -U postgres -p 5433 -h 192.168.157.69 <<EOF

\cd $DIR
\copy Uniref50 from $EMBED CSV;
\copy Uniref50_Seq from $SEQ CSV;

EOF

