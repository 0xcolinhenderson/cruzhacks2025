from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import uuid
import time
from queue import Queue
from ai_pipeline import verify_claim

app = Flask(__name__)
CORS(app)

task_queue = Queue()
task_status = {}

state = {
    "output": "",
    "running": False,
    "complete": False,
    "failed": False
}

def worker():
    while True:
        task_id, input_data = task_queue.get()
        task_status[task_id] = {"status": "running", "result": None}
        try:
            result = verify_claim(input_data)
            task_status[task_id] = {"status": "done", "result": result}
        except Exception as e:
            task_status[task_id] = {"status": "error", "result": str(e)}
        finally:
            task_queue.task_done()

threading.Thread(target=worker, daemon=True).start()

@app.route('/queue_claim', methods=['POST'])
def queue_claim():
    claim = request.json.get("claim")
    if not claim or claim == "":
        return jsonify({"error": "No sentence provided"}), 400

    task_id = str(uuid.uuid4())
    task_status[task_id] = {"status": "pending", "result": None}
    task_queue.put((task_id, claim))
    return jsonify({"result": task_id})

@app.route('/poll/<task_id>', methods=['GET'])
def poll(task_id):
    if task_id not in task_status:
        return jsonify({"error": "Task ID not found"}), 404
    return jsonify({"task_id": task_id, **task_status[task_id]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
