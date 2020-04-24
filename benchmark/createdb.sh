#!/bin/bash -ex
FASTA=${1}
OUT=${2}

PGDB=`basename ${FASTA} .fasta`

echo "TIMING-Start: `date +%s`"

# Break into parts and embed database
mkdir -p $OUT
cat $FASTA | \
    parallel --pipe --recstart '>' -N500000 \
    "pigz -p 10 -c > $OUT/${PGDB}.part.{#}.fasta.gz"
echo "TIMING-Parts: `date +%s`"

export BASE_URL=""
export SQLALCHEMY_DATABASE_URI=""
export SECRET_KEY=""
ls $OUT/${PGDB}.part.*.fasta.gz | \
    parallel --retries 10 -j30 --delay 3 --load 100% \
        --joblog ${OUT}/flask_import.${PGDB}.joblog \
        "FLASK_APP=../webapp.py FLASK_DEBUG=1 flask import --batch_size 128 {}"
echo "TIMING-EMBED: `date +%s`"

rm $OUT/*.fasta.gz

# Create and write to postgres database

# Create database if doesn't exist
if [ ! -d "${OUT}/db" ]; then
    initdb -D $OUT/db --auth-local="trust"
    cp postgresql.conf $OUT/db/
    echo "unix_socket_directories = '$OUT/db'" >> $OUT/db/postgresql.conf
    mkdir $OUT/db/conf.d
fi

pg_ctl -D $OUT/db -w start
createdb --host=$OUT/db $PGDB || true
psql --host=$OUT/db --dbname=$PGDB --file ../setup_table.sql
echo "TIMING-PGSETUP: `date +%s`"

# Load data
ls $OUT/*.embed.csv | parallel --progress -j20 --joblog $OUT/postgres_import.${PGDB}.joblog \
        "psql --host=$OUT/db --dbname=$PGDB --command '\copy Uniref50 from {} CSV;'"
echo "TIMING-LOADEMBED: `date +%s`"
ls $OUT/*.seq.csv | parallel --progress -j20 --joblog $OUT/postgres_import.${PGDB}.joblog \
        "psql --host=$OUT/db --dbname=$PGDB --command '\copy Uniref50_Seq from {} CSV;'"
echo "TIMING-LOADSEQ: `date +%s`"
psql --host=$OUT/db --dbname=$PGDB --file ../create_index.sql
echo "TIMING-INDEX: `date +%s`"

pg_ctl -D $OUT/db -w stop

echo "TIMING-END: `date +%s`"

