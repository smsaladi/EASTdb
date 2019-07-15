"""
Makes a sample request

"""

import json

import requests

import numpy as np

import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.utils import to_categorical


IUPAC_CODES = list('ACDEFGHIKLMNPQRSTVWY*')
input_symbols = {label: i for i, label in enumerate(IUPAC_CODES)}
def seq_to_arr(seq):
    return np.array([input_symbols.get(x, 20) for x in seq])

def prepare_batch(seqs):
    seq_arr = [seq_to_arr(s) for s in seqs]
    seq_arr = pad_sequences(seq_arr, maxlen=2000, padding="post")
    seq_arr = to_categorical(seq_arr, num_classes=21)
    return seq_arr

def infer_batch(seqs, tfserver='http://192.168.157.69:8501/v1/models/dspace:predict'):
    """
    Returns 3d then 8d
    """
    seq_arr = prepare_batch(seqs)

    # reshape for request
    seq_arr = seq_arr.astype(int)
    seq_arr = seq_arr.tolist()
    seq_arr = [s for s in seq_arr]

    # send data to tf server
    payload = {
        "inputs": {
            "input_seq_batch": seq_arr
        }
    }
    r = requests.post(tfserver, json=payload)
    pred = json.loads(r.content.decode('utf-8'))
    pred = pred['outputs']

    return pred['eauto3d/batchnorm/add_1:0'], pred['embed_auto_bn4/batchnorm/add_1:0']

