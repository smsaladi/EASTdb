"""
Makes a sample request

"""

import json

import requests
from urllib3.util.retry import Retry
from requests.adapters import HTTPAdapter

import numpy as np

from .keras_utils import pad_sequences, to_categorical


IUPAC_CODES = list('ACDEFGHIKLMNPQRSTVWY*')
pad_val = len(IUPAC_CODES) - 1
input_symbols = {label: i for i, label in enumerate(IUPAC_CODES)}
def seq_to_arr(seq):
    return np.array([input_symbols.get(x, pad_val) for x in seq])

def prepare_batch(seqs):
    seq_arr = [seq_to_arr(s) for s in seqs]
    seq_arr = pad_sequences(seq_arr, maxlen=2000, padding="post", value=pad_val)
    seq_arr = to_categorical(seq_arr, num_classes=21)
    return seq_arr

def infer_batch(seqs, host, model, ver=None):
    """Returns 3d then 8d

    None goes to default url

    This url : 'http://131.215.2.28:8501/v1/models/dspace_embed/versions/6:predict'
    host = '131.215.2.28:8501'
    ver = 6
    model = 'models/dspace_embed'

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
    if ver is None:
        tfserver='http://{h}/v1/{m}:predict'.format(h=host, m=model)
    else:
        tfserver='http://{h}/v1/{m}/versions/{v}:predict'.format(h=host, m=model, v=ver)

    # retry with requests: https://stackoverflow.com/a/35504626/2320823
    s = requests.Session()
    retries = Retry(total=5,
                    backoff_factor=0.1,
                    status_forcelist=[ 500, 502, 503, 504 ])
    s.mount('http://', HTTPAdapter(max_retries=retries))
    r = s.post(tfserver, json=payload, timeout=120)

    pred = json.loads(r.content.decode('utf-8'))
    pred = pred['outputs']

    return pred['eauto3d/batchnorm/add_1:0'], pred['embed_auto_bn4/batchnorm/add_1:0']

