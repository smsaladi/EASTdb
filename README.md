README
======

The workings of the backend of the EAST sequence search method -- dealing
with preparing sequence data, loading this data into the database, and
creating the associated indices.

1. Prune D-SPACE model to just keep sequence --> embedding
```shell
cd prune_model
python prune_dspace_model.py ../../sgidspace/train_v1/epoch3.hdf5 epoch3_pruned.hdf5
```

2. Download data from uniprot

```shell
cd prepare_data
bash download_data.bash
```

3. Calculate embeddings (and insert into database)

```shell
python embed_fasta.py uniprot_sprot.fasta.gz ../prune_model/epoch3_pruned.hdf5
```

4. Convert model to tfjs format

```shell
tensorflowjs_converter --input_format=keras epoch3_pruned.hdf5 epoch3_pruned_tfjs
```

