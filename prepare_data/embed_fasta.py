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

from sqlalchemy import create_engine
import pandas as pd
import numpy as np



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


def write_to_db(batches):
    ids_list = []
    seqs_list = []
    preds_eightdim_list = []
    preds_threedim_list = []
    
    # run the generators and get the data
    for i, b in enumerate(batches):
        ids, seqs, preds = b[0], b[1], b[2]
        ids_list.extend(ids)
        seqs_list.extend(seqs)
        preds_eightdim_list.extend(preds[0])
        preds_threedim_list.extend(preds[1])
    
    # split up preds from the lists of eight and three
    eight_names = ['preds_eightdim_' + str(i) for i in range(8)]
    three_names = ['preds_threedim_' + str(i) for i in range(3)]
    column_names = ['ids','seqs']
    
    # convert everything to pandas
    column_names.extend(eight_names)
    column_names.extend(three_names)
    df = pd.DataFrame(columns=column_names)
    for i in range(len(ids_list)):
        preds_eight = preds_eightdim_list[i]
        preds_three = preds_threedim_list[i]
        df.loc[i] = (ids_list[i], seqs_list[i], 
                    preds_eight[0],
                    preds_eight[1],
                    preds_eight[2],
                    preds_eight[3],
                    preds_eight[4],
                    preds_eight[5],
                    preds_eight[6],
                    preds_eight[7],
                    preds_three[0],
                    preds_three[1],
                    preds_three[2])
    
    # write to test.csv
    df.to_csv("test.csv", index=False)

    # make database
    # dialect+driver://username:password@host:port/database
    engine = create_engine("postgresql://postgres:pgpass@localhost:5432/testdb")
    df.to_sql('test_data', con=engine)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fasta_fn")
    parser.add_argument("model")

    args = parser.parse_args()

    seqiter = read_sequences(args.fasta_fn)
    model = load_model(args.model)
    batches = infer_batches(seqiter, model)
#     for i, b in enumerate(batches):
#         print(i, b[2])
    write_to_db(batches)

    return

if __name__ == '__main__':
    main()

