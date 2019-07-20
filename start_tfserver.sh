#!/bin/bash

docker run -t --rm --runtime=nvidia -p 8501:8501 --name tfserving \
    --mount type=bind,source=$HOME/github/eastdb/tf_prod_models,target=/models \
    -t tensorflow/serving:latest-gpu \
    --model_config_file="/models/tf_serving.config" \
    --enable_batching


