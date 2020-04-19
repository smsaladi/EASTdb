"""Web app that passes a sequence through to the tensorflow server and
queries the database
"""

import os
import os.path
import re

import flask
import click
from flask_wtf.csrf import CSRFProtect, CSRFError

from sqlalchemy_repr import PrettyRepresentableBase

import numpy as np
import pandas as pd

import click
import pytest

from models import db
import east_utils

# import utils

# Reads env file into environment, if found
# _ = utils.read_env()


app = flask.Flask(__name__)
app.config['BASE_URL'] = os.environ['BASE_URL']

# For data storage
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db.init_app(app)

app.config['DEBUG'] = os.environ.get('DEBUG', 0)

app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
csrf = CSRFProtect(app)

# tensorflow serving configuration
app.config['tf_host'] = os.environ['TF_HOST'] # '131.215.2.28:8501'
app.config['tf_model'] = 'models/dspace_embed'
app.config['tf_ver'] = os.environ.get('TF_VER', 7)


@app.route('/')
def home():
    """Renders the website with current results
    """
    return flask.render_template('index.html')

@app.route('/about')
def about():
    """Renders the website with current results
    """
    return flask.render_template('about.html')

@app.route('/query', methods=['POST'])
def query_sequence():
    """Renders the website with current results
    """
    req = flask.request
    if not req.is_json:
        return format_error(
            "Request doesn't look like it's JSON-formatted. Check the sample request."
        )

    data = req.get_json()

    if 'collection' not in data.keys():
        return format_error(
            "Request requires a `collection` to work with. Check the sample request."
        )
    hitcount = data['messages']['hitcount']
    lookup_dim = data['messages']['dim']
    ver = data['messages'].get('version', app.config['tf_ver'])

    collection = data['collection']
    try:
        seqs = [s['seq'] for s in collection]
    except:
        return format_error(
            "Each member of `collection` requires a `seq` attribute. Check the sample request."
        )

    # request looks ok, now calculate embeddings
    print("looking up embedding")
    embed_3d, embed_8d = east_utils.infer_batch(seqs,
            host=app.config['tf_host'],
            model=app.config['tf_model'],
            ver=ver)

    for i, _ in enumerate(collection):
        [collection[i].pop(k)
            for k in collection[i].keys()
                if k not in ['seq', 'id']]

        collection[i]['3d'] = embed_3d[i]
        collection[i]['8d'] = embed_8d[i]

        # lookup embedding for each and add to collection with key "hits"
        print("submitting query", flush=True)
        if lookup_dim == '3':
            df_hits = lookup_embedding(embed_3d[i], hitcount)
        else:
            df_hits = lookup_embedding(embed_8d[i], hitcount)
        print(df_hits)
        collection[i]['hits'] = df_hits.to_dict(orient='records')

    return format_response(data['messages'], collection)

query_template = """
    SELECT {table}.id as id, {col} as coords, '{coords}'::cube <-> {col} as d, seq
    FROM {table}
    INNER JOIN {table}_seq ON {table}.id = {table}_seq.id
    ORDER BY d
    LIMIT {count};"""

def lookup_embedding(coords, count):
    """Looks up coordinates in database
    """
    # avoid sql injection by checking/forcing type
    coords = np.array(coords, dtype=float)
    if np.any(coords == np.nan):
        return ""

    if len(coords) == 3:
        col = 'coords_3d'
    elif len(coords) == 8:
        col = 'coords_8d'
    else:
        raise ValueError("Improper number of coordinates for lookup")

    coords = east_utils.fmt_arr(coords, ends='()')

    query = query_template.format(
        table='Uniref50', col=col, coords=coords, count=count)
    print(query)

    df = pd.read_sql(query, db.engine, coerce_float=False)

    return df

def format_response(messages, collection):
    if 'apikey' in messages.keys():
        messages.pop('apikey')
    messages['status'] = 'ok'

    response = {
        'messages': messages,
        'collection': collection
    }
    return flask.jsonify(response)

def format_error(msg):
    err = {
        "messages": {
            "status": msg
            }
        }
    return flask.jsonify(err)

@app.cli.command("import")
@click.argument('fasta_file')
@click.option('--batch_size', default=128)
def import_fasta(fasta_file, batch_size):
    """To import data into the database"""
    east_utils.import_fasta(fasta_file,
            batch_size=batch_size,
            host=app.config['tf_host'],
            model=app.config['tf_model'],
            ver=app.config['tf_ver'])
    return

if __name__ == "__main__":
    app.run(debug=True, threaded=True, use_reloader=True)

