from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/detect_claim', methods=['POST'])
def detect_claim():
    data = request.json
    sentence = data.get('sentence')
    if not sentence:
        return jsonify({"error": "No sentence provided"}), 400

    result = {"status": "success", "message": f"Processed: {sentence}"}
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)