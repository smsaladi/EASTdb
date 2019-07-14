"""
Reads in a FASTA file and provides the embedding for each sequence

For example: 
python embed_fasta.py --wipe --table test sample.faa ~/Dropbox/Caltech/EAST_bigfiles/epoch3_pruned.hdf5

"""

import argparse
import functools
from itertools import islice, chain
import gzip

import numpy as np
import pandas as pd

import Bio.SeqIO

from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences
from keras.utils import to_categorical

from sqlalchemy import create_engine, text

from tqdm import tqdm


IUPAC_CODES = list('ACDEFGHIKLMNPQRSTVWY*')
input_symbols = {label: i for i, label in enumerate(IUPAC_CODES)}

def read_sequences(fn):
    if fn.endswith('.gz'):
        op = functools.partial(gzip.open, encoding='UTF-8')
    else:
        op = open

    with op(fn, 'rt') as fh:
        for r in Bio.SeqIO.parse(fh, "fasta"):
            _, rec_id, _ = r.id.split('|')
            seq = str(r.seq)
            seq_arr = np.array([input_symbols.get(x, 20) for x in seq])
            yield rec_id, seq_arr, seq


def grouper(iterable, size=64):
    """Groups an iterable into size
    https://stackoverflow.com/a/8290514/2320823
    """
    sourceiter = iter(iterable)
    while True:
        batchiter = islice(sourceiter, size)
        try:
            yield chain([next(batchiter)], batchiter)
        except StopIteration:
            return
def infer_batches(seqiter, model):
    for grp in grouper(seqiter):
        ids, seq_arr, seqs = zip(*grp)
        seq_arr = pad_sequences(seq_arr, maxlen=2000, padding="post")
        seq_arr = to_categorical(seq_arr, num_classes=21)
        preds = model.predict_on_batch(seq_arr)
        try:
            yield ids, seqs, preds
        except StopIteration:
            return

def write_to_db(ids, seqs, preds, con, table):
    """Writes a single batch of data into the database
    """

    preds_3d, preds_8d = preds[1], preds[0]

    # split up preds from the lists of eight and three
    names_3d = ['preds_3dim_' + str(i) for i in range(3)]
    names_8d = ['preds_8dim_' + str(i) for i in range(8)]

    # convert everything to pandas
    df = pd.DataFrame.from_dict({'ids': ids, 'seqs': seqs})
    df_3d = pd.DataFrame(preds_3d, columns=names_3d)
    df_8d = pd.DataFrame(preds_8d, columns=names_8d)

    df = pd.concat([df, df_3d, df_8d], axis=1, copy=False)

    # uncomment to write to test.csv and then stop
    # df.to_csv("test.csv", index=False)
    # raise ValueError
    df.to_sql(table, con=con, if_exists='append', index=False)

    return


def setup_db(table, wipe=False):
    # write to database
    # dialect+driver://username:password@host:port/database
    # change testdb to eastdb for final version
    engine = create_engine("postgresql://postgres:psqlpass@131.215.2.28:5433/eastdb")
     
    if not wipe:
        return engine

    # drop table, since we only allow writing everything at once
    sql = text('DROP TABLE IF EXISTS {};'.format(table))
    result = engine.execute(sql)
    print(result)
    
    sql = text("""
        CREATE TABLE IF NOT EXISTS {} (
            ids VARCHAR(10),
            seqs TEXT,
            preds_3dim_0 REAL,
            preds_3dim_1 REAL,
            preds_3dim_2 REAL,
            cube_3d CUBE,
            preds_8dim_0 REAL,
            preds_8dim_1 REAL,
            preds_8dim_2 REAL,
            preds_8dim_3 REAL,
            preds_8dim_4 REAL,
            preds_8dim_5 REAL,
            preds_8dim_6 REAL,
            preds_8dim_7 REAL,
            cube_8d CUBE
        );
        """.format(table))
    result = engine.execute(sql)
    print(result)

    return engine


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fasta_fn")
    parser.add_argument("model")
    parser.add_argument("--wipe", action='store_true')
    parser.add_argument("--table", default='up_dspace')

    args = parser.parse_args()

    engine = setup_db(args.table, args.wipe) 
    
    seqiter = read_sequences(args.fasta_fn)
    model = load_model(args.model)
    batches = infer_batches(seqiter, model)

    for b in tqdm(batches):
        write_to_db(*b, con=engine, table=args.table)
    
    print("Data inserted, don't forget to create the index!")

    return

if __name__ == '__main__':
    main()

