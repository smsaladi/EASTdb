"""
Use tflite convert to downsize model
"""

import tensorflow as tf
from tensorflow.keras.models import load_model


# tf.enable_resource_variables()
model_fn = '/home/saladi/Dropbox/Caltech/EAST_bigfiles/epoch3_pruned.hdf5'
model = load_model(model_fn)

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [
        tf.lite.Optimize.OPTIMIZE_FOR_SIZE, tf.lite.OpsSet.TFLITE_BUILTINS_INT8]

def representative_dataset_gen():
    for _ in range(num_calibration_steps):
        yield [input]

# converter.representative_dataset = representative_dataset_gen

tflite_model = converter.convert()

with open("converted_model.tflite", "wb") as fh:
    fh.write(tflite_model)

