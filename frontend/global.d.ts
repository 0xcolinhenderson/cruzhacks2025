interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}

type SpeechRecognition = typeof window.SpeechRecognition;
type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};
type SpeechRecognitionErrorEvent = Event & {
  error: string;
};
