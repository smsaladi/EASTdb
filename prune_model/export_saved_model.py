"""

Convert Keras model to tensorflow format for serving

"""

import argparse

import tensorflow.keras as keras

from tensorflow.python.keras import backend as K
from tensorflow.compat.v1 import saved_model

# SavedModel builder business
from tensorflow.python.saved_model import builder as saved_model_builder
from tensorflow.python.saved_model import tag_constants, signature_constants
from tensorflow.python.saved_model.signature_def_utils_impl import predict_signature_def

from sgidspace.sgikeras.metrics import precision, recall, fmeasure


def convert_tfserving(model_fn, export_path):
    """Converts a tensorflow model into a format for tensorflow_serving

    `model_fn` is the model filename (hdf5 probably)
    `export_path` is the location to write to
    """
    # The export path contains the name and the version of the model
    K.set_learning_phase(0)  # Ignore dropout at inference
    model = keras.models.load_model(model_fn,
            custom_objects={'precision': precision,
                            'recall': recall,
                            'fmeasure': fmeasure})
    saved_model.save(model, export_path)
    return


    # This doesn't work but may be necessary in the future...
    # For builder business see:
    # https://github.com/tensorflow/serving/issues/310#issuecomment-297015251

    builder = saved_model_builder.SavedModelBuilder(export_path)
    with K.get_session() as sess:
        signature = predict_signature_def(
            inputs={'input_seq_batch': model.input},
            outputs={t.name: t for t in model.outputs})

        builder.add_meta_graph_and_variables(
            sess=sess,
            tags=[tag_constants.SERVING],
            signature_def_map={'predict': signature})
        builder.save()

    return


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('model')
    parser.add_argument('export_path')

    args = parser.parse_args()

    convert_tfserving(args.model, args.export_path)

    return

if __name__ == '__main__':
    main()

