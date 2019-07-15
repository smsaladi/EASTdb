"""
Reads in a FASTA file and provides the embedding for each sequence

For example: 
python embed_fasta.py --wipe --table test sample.faa ~/Dropbox/Caltech/EAST_bigfiles/epoch3_pruned.hdf5

"""

import functools
from itertools import islice, chain
import gzip

import numpy as np
import pandas as pd
import Bio.SeqIO

from sqlalchemy import create_engine, text
import click
from tqdm import tqdm

from .embed_seq import infer_batch


def read_sequences(fn):
    if fn.endswith('.gz'):
        op = functools.partial(gzip.open, encoding='UTF-8')
    else:
        op = open

    with op(fn, 'rt') as fh:
        for r in Bio.SeqIO.parse(fh, "fasta"):
            _, rec_id, _ = r.id.split('|')
            seq = str(r.seq)
            yield rec_id, seq

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


messages = {
    "pre":
"""
Set up table with the following:

> postgresql://postgres:psqlpass@131.215.2.28:5433/eastdb")

DROP TABLE IF EXISTS {table};

CREATE TABLE IF NOT EXISTS {table} (
    ids VARCHAR(10),
    coords_3d double[3],
    coords_8d double[8]
);

Let the output file finish writing and then import:
COPY {table} from '{tempfn}' CSV

""",
    "post":
"""
Convert column types and create indexes
"""
}

max_int = np.iinfo(int).max
def fmt_arr(x):
    x = np.array(x)
    x_str = np.array2string(x,
        max_line_width=max_int, suppress_small=True, separator=',')
    x_str = x_str.replace(' ', '')
    x_str = '{' + x_str[1:-1] + '}'
    return x_str

def print_postgres(ids, seqs, embed_3d, embed_8d):
    for i, s, d3, d8 in zip(ids, seqs, embed_3d, embed_8d):
        print('{},"{}","{}"'.format(i, fmt_arr(d3), fmt_arr(d8)))
    return

def import_fasta(fasta_file):
    seqiter = read_sequences(fasta_file)
    for batch in tqdm(grouper(seqiter)):
        ids, seqs = zip(*batch)
        embed_3d, embed_8d = infer_batch(seqs)
        print_postgres(ids, seqs, embed_3d, embed_8d)
    
    print("CSV file created. COPY to database, and don't forget to create the index!")
    return
