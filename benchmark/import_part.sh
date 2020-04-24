#!/bin/bash

PREFIX=${1}

echo "TIMING-STARTEMBED: $PREFIX : `date +%s`"
FLASK_APP=`pwd`/../webapp.py FLASK_DEBUG=1 flask import --batch_size 128 $PREFIX.fasta.gz
echo "TIMING-ENDEMBED: $PREFIX : `date +%s`"

rm $OUT/$PREFIX.fasta.gz

psql --host=$OUT/db --dbname=$PGDB --command <<EOF
    \copy Uniref50 from ${PREFIX}.embed.csv CSV;
    \copy Uniref50_Seq from ${PREFIX}.seq.csv CSV;
EOF

echo "TIMING-ENDLOAD: $PREFIX : `date +%s`"

