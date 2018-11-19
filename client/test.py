"""
Reads in a FASTA file and provides the embedding for each sequence
"""

import argparse
import functools
from itertools import islice, chain
import gzip
import json

import numpy as np

import Bio.SeqIO

from keras.models import load_model, model_from_json
from keras.preprocessing.sequence import pad_sequences
from keras.utils import to_categorical

IUPAC_CODES = list('ACDEFGHIKLMNPQRSTVWY*')
input_symbols = {label: i for i, label in enumerate(IUPAC_CODES)}

def read_sequences(fn):
    if fn.endswith('.gz'):
        op = functools.partial(gzip.open, encoding='UTF-8')
    else:
        op = open

    with op(fn, 'rt') as fh:
        for r in Bio.SeqIO.parse(fh, "fasta"):
            print("r: ", r)
            _, rec_id, _ = r.id.split('|')
            seq = str(r.seq)
            print("seq: ", seq)
            seq_arr = np.array([input_symbols.get(x, 20) for x in seq])
            print("rec_id: ", rec_id)
            print("seq_arr: ", seq_arr)
            yield rec_id, seq_arr, seq


def grouper(iterable, size=32):
    """Groups an iterable into size
    https://stackoverflow.com/a/8290514/2320823
    """
    sourceiter = iter(iterable)
    while True:
        batchiter = islice(sourceiter, size)
        yield chain([next(batchiter)], batchiter)


def infer_batches(seqiter, model):
    print("got here")
    for grp in grouper(seqiter):
        print("grp: ", grp)
        print(zip(*grp))
        ids, seq_arr, seqs = zip(*grp)
        seq_arr = pad_sequences(seq_arr, maxlen=2000, padding="post")
        seq_arr = to_categorical(seq_arr, num_classes=21)
        preds = model.predict_on_batch(seq_arr)
        yield ids, seqs, preds


def write_to_db(batch):
    pass


def main():
    seqiter = read_sequences('3AUP000217400.fasta')
    model = load_model("epoch3_pruned.hdf5")

    batches = infer_batches(seqiter, model)

    for i, b in enumerate(batches):
        print(i, b[2])

    return
    

if __name__ == '__main__':
    main()

