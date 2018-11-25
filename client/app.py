from flask_cors import CORS
from flask import Flask, request, json, jsonify, send_from_directory


app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def main():
    return json.dumps({"message": "Hello world!"})

@app.route("/get_nums")
def get_nums():
    numbers = request.args.get('numbers')
    return json.dumps({"message": numbers})


if __name__ == "__main__":
    app.run()

