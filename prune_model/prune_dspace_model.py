"""
Prune a trained D-SPACE model to only keep layers necessary for embedding

As trained, D-SPACE has a bunch of tasks and associated layers that are
not necessary for solely inferring the embedding for a given protein sequence

"""
import argparse

import tensorflow as tf
from tensorflow.keras.models import Model
from sgidspace.sgikeras.metrics import precision, recall, fmeasure

import kerassurgeon
# from kerassurgeon.operations import delete_layer

def load_model(fn):
    model = tf.keras.models.load_model(fn,
              custom_objects={'precision': precision,
                              'recall': recall,
                              'fmeasure': fmeasure})
    return model

def prune_model(model, rm_layers):
    surgeon = kerassurgeon.Surgeon(model, copy=False)

    layers = {l.name:l for l in model.layers}
    batch = ''

    for l in rm_layers:
        if l in layers:
            surgeon.add_job('delete_layer', layer=layers[l])
            batch += "%s (%s), " % (l, layers[l])
        elif l == '':
            print("Deleting layers..." + batch)
            model = surgeon.operate()
            surgeon = kerassurgeon.Surgeon(model, copy=False)
            model.summary()
            batch = ''
        else:
            raise ValueError("Unrecognized layer name" + l)

    if batch != '':
        model = surgeon.operate()
    return model

def fix_outputs(model):
    out_names = ['embed_auto_bn4', 'eauto3d']
    out_layers = [l.output for l in model.layers if l.name in out_names]
    model2 = Model(model.input, out_layers)
    model2.summary()
    return model2

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("trained_model")
    parser.add_argument("pruned_fn")
    parser.add_argument("--layers_fn", default='remove_layers.txt')

    args = parser.parse_args()

    model = load_model(args.trained_model)
    model = fix_outputs(model)
    model.save(args.pruned_fn)
    return

    with open(args.layers_fn, 'r') as fh:
        rm_layers = [x.strip() for x in fh.readlines() if not x.startswith('#')]

    pruned_model = prune_model(model, rm_layers)
    pruned_model.save(args.pruned_fn)
    return

if __name__ == '__main__':
    main()

