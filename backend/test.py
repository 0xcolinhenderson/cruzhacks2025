import requests
import time

# Base URL of the Flask server
BASE_URL = "http://localhost:5000"

def submit_claim(claim):
    """Submit a claim to the server and return the task ID."""
    response = requests.post(f"{BASE_URL}/queue_claim", params={"claim": claim})
    if response.status_code == 200:
        task_id = response.json().get("result")
        print(f"Task submitted successfully. Task ID: {task_id}")
        return task_id
    else:
        print(f"Failed to submit claim: {response.json().get('error')}")
        return None

def poll_task_status(task_id):
    """Poll the server for the status of a task."""
    while True:
        response = requests.get(f"{BASE_URL}/poll/{task_id}")
        if response.status_code == 200:
            task_status = response.json()
            print(f"Task Status: {task_status['status']}")
            if task_status["status"] == "done":
                print(f"Task Result: {task_status['result']}")
                break
            elif task_status["status"] == "error":
                print(f"Task Error: {task_status['result']}")
                break
        else:
            print(f"Failed to poll task: {response.json().get('error')}")
            break
        time.sleep(2)  # Wait for 2 seconds before polling again

if __name__ == "__main__":
    # Example claim to verify
    claim = "The Eiffel Tower is located in Paris."
    
    # Submit the claim to the server
    task_id = submit_claim(claim)
    
    # If the task was successfully submitted, poll for its status
    if task_id:
        poll_task_status(task_id)