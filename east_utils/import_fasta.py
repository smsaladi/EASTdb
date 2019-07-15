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

max_int = np.iinfo(int).max
def fmt_arr(x):
    """Formats numpy array into array for postgres to read"""
    x = np.array(x)
    x_str = np.array2string(x,
        max_line_width=max_int, suppress_small=True, separator=',')
    x_str = x_str.replace(' ', '')
    x_str = '{' + x_str[1:-1] + '}'
    return x_str

def format_postgres(ids, seqs, embed_3d, embed_8d):
    df = pd.DataFrame({
        'id': ids,
        'seq': seqs,
        '3d': embed_3d,
        '8d': embed_8d
    })
    df['3d'] = df['3d'].apply(fmt_arr)
    df['8d'] = df['8d'].apply(fmt_arr)

    write_args = dict(index=False, header=False, mode='a')
    df[['id', '3d', '8d']].to_csv("embed.import.csv", **write_args)
    df[['id', 'seq']].to_csv("seq.import.csv", **write_args)

    return

def import_fasta(fasta_file):
    seqiter = read_sequences(fasta_file)
    for batch in tqdm(grouper(seqiter)):
        ids, seqs = zip(*batch)
        embed_3d, embed_8d = infer_batch(seqs)
        format_postgres(ids, seqs, embed_3d, embed_8d)
    
    print("CSV file created. COPY to database, and don't forget to create the index!")
    return
