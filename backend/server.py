from flask import Flask, request, jsonify
import threading
import uuid
import time
from queue import Queue

app = Flask(__name__)

task_queue = Queue()
task_status = {}

state = {
    "output": "",
    "running": False,
    "complete": False,
    "failed": False
}

def fakeahh_task(input_data):
    time.sleep(5)
    return f"{input_data} is done now or somethn;lsakh"

def worker():
    while True:
        task_id, input_data = task_queue.get()
        task_status[task_id] = {"status": "running", "result": None}
        try:
            result = fakeahh_task(input_data)
            task_status[task_id] = {"status": "done", "result": result}
        except Exception as e:
            task_status[task_id] = {"status": "error", "result": str(e)}
        finally:
            task_queue.task_done()

threading.Thread(target=worker, daemon=True).start()

@app.route('/queue_claim', methods=['POST'])
def queue_claim():
    claim = request.args.get("claim")
    if not claim or claim == "":
        return jsonify({"error": "No sentence provided"}), 400

    task_id = str(uuid.uuid4())
    task_status[task_id] = {"status": "pending", "result": None}
    # TODO logic should branch off here to handle nlp base case
    #
    task_queue.put((task_id, claim))
    return jsonify({"task_id": task_id})

@app.route('/poll/<task_id>', methods=['GET'])
def poll(task_id):
    if task_id not in task_status:
        return jsonify({"error": "Task ID not found"}), 404
    return jsonify({"task_id": task_id, **task_status[task_id]})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
