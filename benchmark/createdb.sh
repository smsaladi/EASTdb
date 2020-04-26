#!/bin/bash -ex
FASTA=${1}
OUT=${2}

PGDB=`basename ${FASTA} .fasta`

echo "TIMING-Start: `date +%s`"

# Break into parts
mkdir -p $OUT
cat $FASTA | \
    parallel --pipe --recstart '>' -N100000 \
    "pigz -p 10 -c > $OUT/${PGDB}.part.{#}.fasta.gz"
echo "TIMING-Parts: `date +%s`"

# Create and write to postgres database

# Create database if doesn't exist
if [ ! -d "${OUT}/db" ]; then
    initdb -D $OUT/db --auth-local="trust"
    mkdir $OUT/db/conf.d
fi

cp postgresql.conf $OUT/db/
echo "unix_socket_directories = '$OUT/db'" >> $OUT/db/postgresql.conf

PGPORT=`./freeport`

pg_ctl -D $OUT/db -o "-p $PGPORT" -w start
createdb --host=$OUT/db --port=$PGPORT $PGDB || true
psql --host=$OUT/db --port=$PGPORT --dbname=$PGDB --file ../setup_table.sql
echo "TIMING-PGSETUP: `date +%s`"


load_shard () {
    PREFIX=${1}

    echo "TIMING-STARTEMBED: $PREFIX : `date +%s`"
    
    export BASE_URL=""
    export SQLALCHEMY_DATABASE_URI=""
    export SECRET_KEY=""
    FLASK_APP=`pwd`/../webapp.py FLASK_DEBUG=1 flask import --batch_size 128 $PREFIX.fasta.gz
    echo "TIMING-ENDEMBED: $PREFIX : `date +%s`"

    rm $PREFIX.fasta.gz

    psql --host=$OUT/db --port=$PGPORT --dbname=$PGDB <<EOF
        \copy Uniref50 from ${PREFIX}.embed.csv CSV;
        \copy Uniref50_Seq from ${PREFIX}.seq.csv CSV;
EOF

    echo "TIMING-ENDLOAD: $PREFIX : `date +%s`"
}
export PGDB=$PGDB
export PGPORT=$PGPORT
export OUT=$OUT
export -f load_shard

# Embed and load database
ls $OUT/${PGDB}.part.*.fasta.gz | \
    parallel --retries 10 -j30 --delay 3 --load 100% \
        --joblog ${OUT}/flask_import.${PGDB}.joblog --plus \
        "load_shard {..}"
echo "TIMING-EMBEDLOAD: `date +%s`"

psql --host=$OUT/db --port=$PGPORT --dbname=$PGDB --file ../create_index.sql
echo "TIMING-INDEX: `date +%s`"

pg_ctl -D $OUT/db -o "-p $PGPORT" -w stop -m smart

echo "TIMING-END: `date +%s`"

