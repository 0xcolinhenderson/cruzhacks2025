"use client";

import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import styles from "./Transcription.module.css";
import { start } from "repl";

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
  const words = sentence.trim().split(/\s+/);
  const firstWord = words[0]?.toLowerCase() || "";
  const secondWord = words[1]?.toLowerCase() || "";
  const startIndicators = [
    "is", "are", "am", "was", "were",
    "do", "does", "did", "can", "could",
    "would", "should", "will", "shall"
  ];
  const generalIndicators = ["what", "why", "how", "when", "where", "who"];
  return (
    startIndicators.includes(firstWord) || startIndicators.includes(secondWord) ||
    words.some((w) => generalIndicators.includes(w.toLowerCase()))
  );
}

function formatSentence(sentence: string): string {
  sentence = sentence.trim();
  if (!sentence) return "";
  const isQuestion = isQuestionSentence(sentence);
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  if (!/[.?]$/.test(sentence)) {
    sentence += isQuestion ? "?" : ".";
  }
  return sentence;
}

export default function Transcription() {
  const [sentences, setSentences] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const addSentence = (sentence: string) => {
    const formatted = formatSentence(sentence);
    if (formatted) {
      setSentences((prev) => [...prev, formatted]);
    }
  };

  const toggleStart = () => {
    if (isCooldown) return;

    if (isStarted) {
      recognition?.stop();
      setIsStarted(false);
    } else {
      try {
        recognition.start();
        setIsStarted(true);
      } catch (error) {
        console.error("SpeechRecognition start error:", error);
      }
    }

    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 1000);
  };

  useEffect(() => {
    if (!recognition) return;

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

      if (final.trim()) {
        addSentence(final.trim());
      }

      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      if (isStarted) {
        recognition?.start();
      }
    };

    return () => {
      recognition?.stop();
    };
  }, [isStarted]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [sentences, interimTranscript]);

  return (
    <div className={styles.transcriptionContainer}>
      <div className={styles.titleContainer}>
        <h2 className={styles.title}>Transcription</h2>
        <Button
          label={isStarted ? "Stop" : "Start"}
          onClick={toggleStart}
          variant={isStarted ? "stop" : "start"}
        />
      </div>
      <div className={styles.divider}></div>

      <div className={styles.paragraphContainer} ref={containerRef}>
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className={styles.sentence}
            onClick={() => console.log("Clicked:", sentence)}
          >
            {sentence}{" "}
          </span>
        ))}
        {interimTranscript && (
          <span className={styles.interim}>{interimTranscript}</span>
        )}
      </div>
    </div>
  );
}
