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
  const words = sentence.trim().split(/\s+/);
  const firstWord = words[0]?.toLowerCase() || "";
  const startIndicators = [
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
  return (
    startIndicators.includes(firstWord) ||
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

interface TranscriptionProps {
  addFactCheck: (claim: string) => void;
}

export default function Transcription({ addFactCheck }: TranscriptionProps) {
  const [sentences, setSentences] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [loadingSentences, setLoadingSentences] = useState<Set<number>>(
    new Set()
  );

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
      // add box with timestamp "Recording started h:mm:ss AM/PM"
      recognition?.stop();
      setIsStarted(!isStarted);
    } else {
      try {
        setInterimTranscript("");

        // add box with timestamp "Recording started h:mm:ss AM/PM"
        recognition?.start();
        setIsStarted(!isStarted);
      } catch (error) {
        console.error("SpeechRecognition start error:", error);
      }
    }
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 1000);
  };

  const handleSentenceClick = async (sentence: string, index: number) => {
    setLoadingSentences((prev) => new Set(prev).add(index));

    try {
      const response = await fetch("http://localhost:5000/detect_claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence: sentence }),
      });
      if (!response.ok) {
        console.error("Failed to process sentence:", response.statusText);
        return;
      }

      const data = await response.json();
      addFactCheck(sentence);
    } catch (error) {
      console.error("Error processing sentence:", error);
    } finally {
      setLoadingSentences((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
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
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
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
            className={`${styles.sentence} ${
              loadingSentences.has(index) ? styles.loading : ""
            }`}
            onClick={() => handleSentenceClick(sentence, index)}
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
