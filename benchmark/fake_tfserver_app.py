"""

Fakes a tensorflow server, just sends to model

http://131.215.2.28:8501/v1/models/dspace_embed/versions/6:predict

"""

import os
import argparse

import flask
from flask import request, jsonify

import numpy as np
from tensorflow.keras.models import load_model

app = flask.Flask(__name__)

def create_app(model_fn):
    app.config['model'] = load_model(model_fn, compile=False)
    return app

@app.route('/', defaults={'path': ''}, methods=['POST'])
@app.route('/<path:path>', methods=['POST'])
def predict(path):
    """Renders the website with current results
    """
    batch = request.get_json(force=True)
    batch = batch["inputs"]["input_seq_batch"]
    batch = np.array(batch, dtype=int)
    preds = app.config['model'].predict_on_batch(batch)
    preds = {'outputs': {
        'embed_auto_bn4/batchnorm/add_1:0': preds[0].tolist(),
        'eauto3d/batchnorm/add_1:0': preds[1].tolist()
    }}
    return jsonify(preds)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("model")
    args = parser.parse_args()
    app = create_app(args.model)
    app.run(threaded=True)

