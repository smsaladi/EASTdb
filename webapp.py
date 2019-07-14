"""Web app and utilities for rainbow colormap monitor
"""

import os
import os.path
import re

import flask
from flask_mail import Mail, Message
from flask_wtf.csrf import CSRFProtect, CSRFError

from sqlalchemy import desc

import tweepy

import click
import pytest

# import utils

# Reads env file into environment, if found
# _ = utils.read_env()


app = flask.Flask(__name__)
app.config['BASE_URL'] = os.environ['BASE_URL']

# For data storage
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
db.init_app(app)

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

app.config['WEB_PASSWORD'] = os.environ['WEB_PASSWORD']

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

    cats = flask.request.args.get('categories')
    if cats:
        cats = [int(x) for x in cats.split(',')]
    else:
        cats = [-2, -1, 1, 2]

    papers = (Biorxiv.query
                     .filter(Biorxiv.parse_status.in_(cats))
                     .order_by(desc(Biorxiv.created))
                     .limit(500)
                     .all())

    return flask.render_template('main.html', app=app, papers=papers)

if __name__ == "__main__":
    app.run(debug=True, threaded=True, use_reloader=True)

