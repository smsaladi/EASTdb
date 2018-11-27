"""
Reads in a FASTA file and provides the embedding for each sequence
"""

import argparse
import functools
from itertools import islice, chain
import gzip

import numpy as np

import Bio.SeqIO

from keras.models import load_model
from keras.preprocessing.sequence import pad_sequences
from keras.utils import to_categorical

from sqlalchemy import create_engine, text
import pandas as pd
import numpy as np

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


def grouper(iterable, size=32):
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


def write_to_db(ids, seqs, preds, con):
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

    df.to_sql('up_dspace', con=con, if_exists='append', index=False)

    return


def setup_db():
    # write to database
    # dialect+driver://username:password@host:port/database
    # change testdb to eastdb for final version
    engine = create_engine("postgresql://postgres:psqlpass@131.215.26.148:5433/eastdb")
   
    # drop table, since we only allow writing everythign at once
    sql = text('DROP TABLE IF EXISTS up_dspace;')
    result = engine.execute(sql)
    print(result)

    return engine
 

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fasta_fn")
    parser.add_argument("model")

    args = parser.parse_args()

    engine = setup_db() 
    
    seqiter = read_sequences(args.fasta_fn)
    model = load_model(args.model)
    batches = infer_batches(seqiter, model)

    for b in tqdm(batches):
        write_to_db(*b, con=engine)

    return

if __name__ == '__main__':
    main()

