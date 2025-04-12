from RealtimeSTT import AudioToTextRecorder
from detect_claims import handle_text, context

if __name__ == '__main__':
    recorder = AudioToTextRecorder()

    while True:
        handle_text(recorder.text(), context)