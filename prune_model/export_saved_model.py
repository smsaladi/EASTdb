"""

Convert Keras model to tensorflow format for serving

"""

import argparse

import tensorflow.compat.v1 as tf

def convert_tfserving(model_fn, export_path):
    """Converts a tensorflow model into a format for tensorflow_serving
    
    `model_fn` is the model filename (hdf5 probably)
    `export_path` is the location to write to

    """
    # The export path contains the name and the version of the model
    tf.keras.backend.set_learning_phase(0)  # Ignore dropout at inference
    model = tf.keras.models.load_model(model_fn)

    # Fetch the Keras session and save the model
    # The signature definition is defined by the input and output tensors
    # And stored with the default serving key
    with tf.keras.backend.get_session() as sess:
        tf.saved_model.simple_save(
            sess,
            export_path,
            inputs={'input_seq_batch': model.input},
            outputs={t.name: t for t in model.outputs})

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

