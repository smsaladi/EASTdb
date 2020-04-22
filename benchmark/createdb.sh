#!/bin/bash -ex
DB=${1}
MODEL=${2}
DBSAVE=${3}

# ./createdb.sh db/targetdb.fasta model.01.hdf5 $HOME/sgidata/modeldb/model.01
# ./createdb.sh db/query.fasta model.01.hdf5 $HOME/sgidata/modeldb/model.01

# for a set of models
# ls $HOME/sgidata/models_pruned/* | parallel --delay 10 "./createdb.sh mmseqs2-benchmark-pub/db/query.fasta {}  ~/sgidata/modeldb/{/.} &> create_query.{/.}.log.txt"

echo -n "TIMING-Start: " && date +%s

# Break into parts and embed database
mkdir -p $DBSAVE
DBTMP=$(mktemp -d -t dbtmp-XXXX)
echo "TMPDIR: " $DBTMP

cat $DB | parallel --pipe --recstart '>' -N1000000 "pigz -p 10 -c > $DBTMP/db.part.{#}.fasta.gz"
echo -n "TIMING-Parts: " && date +%s

## Start Tensorflow server

# Build image with
# singularity build tfserving.sif docker://tensorflow/serving:latest

# Create tf_serving models
# ls ~/sgidata/models_pruned/* | parallel -j20 "python prune_model/export_saved_model.py {} ~/sgidata/models_tfserving/{/.}"

FREEPORT=$(python -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1])')

# if model path has colon, singularity chokes
ln -s $MODEL $DBTMP/model

# Set parallelism
# https://sylabs.io/guides/3.0/user-guide/environment_and_metadata.html#environment
SINGULARITYENV_OMP_NUM_THREADS=30
SINGULARITYENV_TENSORFLOW_INTER_OP_PARALLELISM=2
SINGULARITYENV_TENSORFLOW_INTRA_OP_PARALLELISM=30

singularity run \
    --net --network=none \
    --network-args "portmap=${FREEPORT}:8501/tcp" \
    -B "model/:/models/model/1" \
    tfserving.sif &> $DBTMP/tfserver.log.txt

# Wait until server has loaded
# https://superuser.com/a/375331/470760
until cat $DBTMP/tfserver.log.txt | grep -m 1 "Entering the event loop"; do sleep 0.2 ; done


export TF_HOST="127.0.0.1:$FREEPORT" 
export TF_MODEL="models/model"
export TF_VER=1
export BASE_URL=""
export SQLALCHEMY_DATABASE_URI=""
export SECRET_KEY=""
ls $DBTMP/*.fasta.gz | parallel --retries 10 -j20 --load 100% --joblog ${DBSAVE}/flask_import.joblog "FLASK_APP=webapp.py FLASK_DEBUG=1 flask import --batch_size 2048 {}"
echo -n "TIMING-EMBED: " && date +%s

rm $DBTMP/*.fasta.gz

# Create and write to postgres database
PGDB=`basename $DB .fasta`

if [ -d "${DBSAVE}/db" ]
then
    cp -r $DBSAVE/db $DBTMP/db
else
    initdb -D $DBTMP/db --auth-local="trust"
    cp postgresql.conf $DBTMP/db/
    echo "unix_socket_directories = '$DBTMP/db'" >> $DBTMP/db/postgresql.conf
    mkdir $DBTMP/db/conf.d
fi

pg_ctl -D $DBTMP/db -w start
createdb --host=$DBTMP/db $PGDB
psql --host=$DBTMP/db --dbname=$PGDB --file ../setup_table.sql
echo -n "TIMING-PGSETUP: " && date +%s

# Load data
ls $DBTMP/*.embed.csv | parallel --progress -j20 --joblog $DBTMP/postgres_import.joblog \
        "psql --host=$DBTMP/db --dbname=$PGDB --command '\copy Uniref50 from {} CSV;'"
echo -n "TIMING-LOADEMBED: " && date +%s
ls $DBTMP/*.seq.csv | parallel --progress -j20 --joblog $DBTMP/postgres_import.joblog \
        "psql --host=$DBTMP/db --dbname=$PGDB --command '\copy Uniref50_Seq from {} CSV;'"
echo -n "TIMING-LOADSEQ: " && date +%s
psql --host=$DBTMP/db --dbname=$PGDB --file ../create_index.sql
echo -n "TIMING-INDEX: " && date +%s

pg_ctl -D $DBTMP/db -w stop

cp -r $DBTMP/db $DBSAVE
echo -n "TIMING-END: " && date +%s

jobs -l | awk '{print $3}' | parallel kill

