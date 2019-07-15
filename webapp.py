"""Web app that passes a sequence through to the tensorflow server and
queries the database
"""

import os
import os.path
import re

import flask
import click
from flask_mail import Mail, Message
from flask_wtf.csrf import CSRFProtect, CSRFError

from sqlalchemy_repr import PrettyRepresentableBase

import tweepy

import numpy as np

import click
import pytest

import east_utils

# import utils

# Reads env file into environment, if found
# _ = utils.read_env()


app = flask.Flask(__name__)
app.config['BASE_URL'] = os.environ['BASE_URL']

# For data storage
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

# db = SQLAlchemy(model_class=PrettyRepresentableBase)
# db.init_app(app)

# For monitoring papers (until Biorxiv provides a real API)
app.config['TWITTER_APP_KEY'] = os.environ['TWITTER_APP_KEY']
app.config['TWITTER_APP_SECRET'] = os.environ['TWITTER_APP_SECRET']
app.config['TWITTER_KEY'] = os.environ['TWITTER_KEY']
app.config['TWITTER_SECRET'] = os.environ['TWITTER_SECRET']

# for author notification
app.config['MAIL_SERVER'] = os.environ['MAIL_SERVER']
app.config['MAIL_PORT'] = int(os.environ['MAIL_PORT'])
app.config['MAIL_USE_TLS'] = bool(int(os.environ['MAIL_USE_TLS']))
app.config['MAIL_USERNAME'] = os.environ['MAIL_USERNAME']
app.config['MAIL_PASSWORD'] = os.environ['MAIL_PASSWORD']
app.config['MAIL_DEFAULT_SENDER'] = os.environ['MAIL_DEFAULT_SENDER'].replace("'", "")
app.config['MAIL_REPLY_TO'] = os.environ['MAIL_REPLY_TO'].replace("'", "")
app.config['MAIL_MAX_EMAILS'] = int(os.environ['MAIL_MAX_EMAILS'])

app.config['DEBUG'] = os.environ.get('DEBUG', 0)

app.config['SECRET_KEY'] = os.environ['SECRET_KEY']
csrf = CSRFProtect(app)

tweepy_auth = tweepy.OAuthHandler(
    app.config['TWITTER_APP_KEY'], app.config['TWITTER_APP_SECRET'])
tweepy_auth.set_access_token(
    app.config['TWITTER_KEY'], app.config['TWITTER_SECRET'])
tweepy_api = tweepy.API(tweepy_auth)

mail = Mail(app)

@app.route('/')
def home():
    """Renders the website with current results
    """
    return flask.render_template('index.html')


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

    collection = data['collection']

    try:
        seqs = [s['seq'] for s in collection]
    except:
        return format_error(
            "Each member of `collection` requires a `seq` attribute. Check the sample request."
        )
    
    # request looks ok, now calculate embeddings
    embed_3d, embed_8d = east_utils.infer_batch(seqs)

    for i, _ in enumerate(collection):
        [collection[i].pop(k)
            for k in collection[i].keys()
                if k not in ['seq', 'id']]
                
        collection[i]['3d'] = embed_3d[i]
        collection[i]['8d'] = embed_8d[i]
        
    return format_response(data['messages'], collection)

def lookup_embedding(coords):
    # avoid sql injection by checking/forcing type
    coords = np.array(coords, dtype=float)
    if np.any(coords == np.nan):
        return ""

    return

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
def import_fasta(fasta_file):
    """To import data into the database"""
    east_utils.import_fasta(fasta_file)
    return

if __name__ == "__main__":
    app.run(debug=True, threaded=True, use_reloader=True)
