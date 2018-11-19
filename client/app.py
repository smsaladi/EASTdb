from flask_cors import CORS
from flask import Flask, request, render_template, json, jsonify, send_from_directory


app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def main():
    return render_template('index.html')

@app.route("/read_sequences", methods=["POST"])
def read_sequences(string):
    if fn.endswith('.gz'):
        op = functools.partial(gzip.open, encoding='UTF-8')
    else:
        op = open

    with op(fn, 'rt') as fh:
        for r in Bio.SeqIO.parse(fh, "fasta"):
            # print("r: ", r)
            _, rec_id, _ = r.id.split('|')
            seq = str(r.seq)
            # print("seq: ", seq)
            seq_arr = np.array([input_symbols.get(x, 20) for x in seq])
            # print("rec_id: ", rec_id)
            # print("seq_arr: ", seq_arr)
            yield rec_id, seq_arr, seq


if __name__ == "__main__":
    app.run()

