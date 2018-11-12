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
        yield chain([next(batchiter)], batchiter)


def infer_batches(seqiter, model):
    for grp in grouper(seqiter):
        ids, seq_arr, seqs = zip(*grp)
        seq_arr = pad_sequences(seq_arr, maxlen=2000, padding="post")
        seq_arr = to_categorical(seq_arr, num_classes=21)
        preds = model.predict_on_batch(seq_arr)
        yield ids, seqs, preds


def write_to_db(batch):
    pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("fasta_fn")
    parser.add_argument("model")

    args = parser.parse_args()

    seqiter = read_sequences(args.fasta_fn)
    model = load_model(args.model)
    batches = infer_batches(seqiter, model)
    for i, b in enumerate(batches):
        print(i, b[2])

    return

if __name__ == '__main__':
    main()

