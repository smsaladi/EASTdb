"""Convert Keras model to tensorflow format for serving
"""

import tensorflow as tf

# The export path contains the name and the version of the model
tf.keras.backend.set_learning_phase(0)  # Ignore dropout at inference
model = tf.keras.models.load_model('epoch3_pruned.hdf5')
export_path = 'serving'

# Fetch the Keras session and save the model
# The signature definition is defined by the input and output tensors
# And stored with the default serving key
with tf.keras.backend.get_session() as sess:
    tf.saved_model.simple_save(
        sess,
        export_path,
        inputs={'input_seq_batch': model.input},
        outputs={t.name: t for t in model.outputs})


