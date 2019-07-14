#!/bin/bash

docker run -t --rm --runtime=nvidia -p 8501:8501 --name tfserving \
    --mount type=bind,source=`pwd`/../serving,target=/models/dspace \
    -e MODEL_NAME=dspace \
    -t tensorflow/serving:latest-gpu \
    --enable_batching \
    --per_process_gpu_memory_fraction=0.5

