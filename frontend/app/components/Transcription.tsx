"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import styles from "./Transcription.module.css";

let recognition: SpeechRecognition | null = null;

if (typeof window !== "undefined") {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
}

function isQuestionSentence(sentence: string): boolean {
  sentence = sentence.trim();
  if (sentence.length === 0) return false;

  const words = sentence.split(/\s+/);
  const firstWord = words[0].toLowerCase();

  const startOnlyIndicators = [
    "is",
    "are",
    "am",
    "was",
    "were",
    "do",
    "does",
    "did",
    "can",
    "could",
    "would",
    "should",
    "will",
    "shall",
  ];
  const generalIndicators = ["what", "why", "how", "when", "where", "who"];

  if (
    startOnlyIndicators.includes(firstWord) ||
    generalIndicators.includes(firstWord)
  ) {
    return true;
  }

  if (words.length >= 4) {
    const secondWord = words[1].toLowerCase();
    if (startOnlyIndicators.includes(secondWord)) {
      return true;
    }
  }

  for (let word of words.slice(1)) {
    if (generalIndicators.includes(word.toLowerCase())) {
      return true;
    }
  }

  return false;
}

function formatSentence(sentence: string): string {
  sentence = sentence.trim();
  if (sentence.length === 0) return "";

  const isQuestion = isQuestionSentence(sentence);

  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

  if (!/[.?]$/.test(sentence)) {
    sentence += isQuestion ? "?" : ".";
  }

  return sentence;
}

interface TextareaData {
  text: string[];
  timestamp: string;
}

interface TranscriptionProps {
  textStream: string;
}

export default function Transcription({ textStream }: TranscriptionProps) {
  const [textareas, setTextareas] = useState<TextareaData[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isCooldown, setIsCooldown] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const addTextarea = (sentence: string) => {
    const formattedSentence = formatSentence(sentence);
    const currentTime = new Date().toLocaleTimeString();
    const words = formattedSentence.split(" ");
    setTextareas((prev) => [...prev, { text: words, timestamp: currentTime }]);
  };

  const handleTranscriptClick = (index: number, textarea: TextareaData) => {
    console.log(`Transcript box ${index} clicked!`, textarea);
  };

  const toggleStart = () => {
    if (isCooldown) return;

    if (isStarted) {
      console.log("Stopping speech recognition...");
      recognition.stop();
      setIsStarted(false);
    } else {
      console.log("Starting speech recognition...");
      try {
        recognition.start();
        setIsStarted(true);
      } catch (error) {
        console.error("SpeechRecognition start error:", error);
      }
    }

    setIsCooldown(true);
    setTimeout(() => {
      setIsCooldown(false);
    }, 1000);
  };

  useEffect(() => {
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        addTextarea(final.trim());
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        console.warn("No speech detected, continuing to listen...");
      } else {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      console.log("Recognition ended.");
      if (isStarted) {
        console.log("Restarting recognition...");
        recognition.start();
      }
    };

    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [textareas]);

  return (
    <div className={styles.transcriptionContainer}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>Transcription</h2>
        <div className={styles.buttonGroup}>
          <Button
            label={isStarted ? "Stop" : "Start"}
            onClick={toggleStart}
            variant={isStarted ? "stop" : "start"}
          />
        </div>
      </div>
      <div className={styles.divider}></div>
      <div
        className={styles.textContainer}
        id="textarea-container"
        ref={containerRef}
      >
        {textareas.map((textarea, index) => (
          <div
            key={index}
            className={`${styles.message} ${styles.clickableMessage}`}
            onClick={() => handleTranscriptClick(index, textarea)}
          >
            <div className={styles.textArea}>
              {textarea.text.map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  className={styles.word}
                  style={{
                    animationDelay: `${wordIndex * 0.1}s`,
                  }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </div>
            <p className={styles.messageData}>{textarea.timestamp}</p>
          </div>
        ))}
        {interimTranscript && (
          <div className={styles.message}>
            <div className={styles.textArea}>
              <span
                className={styles.word}
                style={{
                  color: "#b2b2b2",
                }}
              >
                {interimTranscript}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
