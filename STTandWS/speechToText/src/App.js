import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// Helper function to determine if a sentence should be considered a question.
function isQuestionSentence(sentence) {
  sentence = sentence.trim();
  if (sentence.length === 0) return false;

  // Split the sentence into individual words.
  const words = sentence.split(/\s+/);
  const firstWord = words[0].toLowerCase();

  // Words that indicate a question only if they appear at the beginning.
  const startOnlyIndicators = [
    "is", "are", "am", "was", "were", "do", "does", "did",
    "can", "could", "would", "should", "will", "shall"
  ];
  // Words that may indicate a question regardless of position.
  const generalIndicators = ["what", "why", "how", "when", "where", "who"];

  // Check if the first word is a question indicator.
  if (startOnlyIndicators.includes(firstWord) || generalIndicators.includes(firstWord)) {
    return true;
  }
  
  // For sentences with at least 4 words, also check the second word for start-only indicators.
  if (words.length >= 4) {
    const secondWord = words[1].toLowerCase();
    if (startOnlyIndicators.includes(secondWord)) {
      return true;
    }
  }
  
  // Check the rest of the sentence for any general question indicators.
  for (let word of words.slice(1)) {
    if (generalIndicators.includes(word.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

// Helper function to format a sentence by trimming, capitalizing, and adding punctuation.
function formatSentence(sentence) {
  sentence = sentence.trim();
  if (sentence.length === 0) return "";
  
  const isQuestion = isQuestionSentence(sentence);
  
  // Capitalize the first letter.
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  
  // Append punctuation if none exists.
  if (!/[.?]$/.test(sentence)) {
    sentence += isQuestion ? "?" : ".";
  }
  
  return sentence;
}

// Set up the Web Speech API for speech recognition.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = "en-US";

function App() {
  // States for recording and transcript data.
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  // New state: only the newly finalized chunk.
  const [newFinalChunk, setNewFinalChunk] = useState("");

  // States for connection and message statuses.
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [messageStatus, setMessageStatus] = useState("");

  // Ref for the transcript display (for auto-scrolling).
  const containerRef = useRef(null);
  
  // State to hold the WebSocket instance.
  const [socket, setSocket] = useState(null);

  // WebSocket connection effect with reconnection every 5 seconds if disconnected.
  useEffect(() => {
    let ws;
    let reconnectIntervalId;
    
    const connect = () => {
      try {
        ws = new WebSocket("ws://localhost:8080"); //TODO Update this URL FOR OUR BACKEND
        ws.onopen = () => {
          console.log("Connected to WebSocket server");
          setConnectionStatus("Connected");
          setSocket(ws);
          // Clear any running reconnection interval.
          if (reconnectIntervalId) {
            clearInterval(reconnectIntervalId);
            reconnectIntervalId = null;
          }
        };
        ws.onclose = () => {
          console.log("WebSocket connection closed");
          setConnectionStatus("Disconnected");
          setSocket(null);
          // If not already reconnecting, start trying every 5 seconds.
          if (!reconnectIntervalId) {
            reconnectIntervalId = setInterval(() => {
              console.log("Attempting to reconnect to WebSocket server...");
              connect();
            }, 5000);
          }
        };
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          ws.close(); // Force a close to trigger the reconnect logic in onclose.
        };
      } catch (error) {
        console.error("WebSocket connection error:", error);
        setConnectionStatus("Disconnected");
      }
    };
    
    connect();
    
    // Cleanup on component unmount.
    return () => {
      if (reconnectIntervalId) clearInterval(reconnectIntervalId);
      if (ws) ws.close();
    };
  }, []);

  // Set up speech recognition event handlers.
  useEffect(() => {
    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      // Process each result from speech recognition.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      // If finalized text exists, format it and update transcript states.
      if (final) {
        const formattedFinal = formatSentence(final);
        setFinalTranscript(prev => prev + " " + formattedFinal);
        setNewFinalChunk(formattedFinal);
      }
      // Update interim transcript for real-time display.
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
      if (isRecording) {
        console.log("Restarting speech recognition...");
        recognition.start();
      }
    };
  }, [isRecording]);

  // Periodically refresh the speech recognition session (every 30 seconds) to prevent browser timeout.
  useEffect(() => {
    if (!isRecording) return;
    const refreshInterval = 30000; // 30 seconds.
    const intervalID = setInterval(() => {
      console.log("Refreshing recognition session...");
      recognition.stop();
    }, refreshInterval);
    return () => clearInterval(intervalID);
  }, [isRecording]);

  // Smoothly auto-scroll the transcript container when new text is added.
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [finalTranscript, interimTranscript]);

  // Send only the new finalized transcript chunk via WebSocket when updated.
  useEffect(() => {
    if (newFinalChunk.trim() !== "" && socket && socket.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({ newTranscript: newFinalChunk });
        socket.send(message);
        console.log("Sent final transcript chunk:", message);
        // Indicate for a brief moment that the message was sent.
        setMessageStatus("Message sent");
        setTimeout(() => setMessageStatus(""), 1000);
        // Reset the new final chunk to avoid re-sending.
        setNewFinalChunk("");
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    }
  }, [newFinalChunk, socket]);

  // Toggle recording on/off.
  const toggleRecording = () => {
    if (isRecording) {
      recognition.stop();
    } else {
      setInterimTranscript("");
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="App">
      {/* Debug button placed in the upper left corner */}
      <div className="debug-button">
        <div
          className="debug-indicator"
          style={{ backgroundColor: connectionStatus === "Connected" ? "green" : "red" }}
        />
        <span>
          {connectionStatus} {messageStatus && ` - ${messageStatus}`}
        </span>
      </div>
      
      {/* Main controls and transcript display */}
      <div className="controls">
        <button className="mic-button" onClick={toggleRecording}>
          {isRecording ? "Stop" : "Record"}
        </button>
      </div>
      <div className="text-container" ref={containerRef}>
        <p className="transcript">
          {finalTranscript} <span className="interim">{interimTranscript}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
