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
  addFactCheck: (data: {
    claim: string;
    isFact: boolean;
    description: string;
    sources: string[];
    timestamp: string;
  }) => void;
  autoMode: boolean;
}

export default function Transcription({
  addFactCheck,
  autoMode,
}: TranscriptionProps) {
  const [sentences, setSentences] = useState<string[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [loadingSentences, setLoadingSentences] = useState<Set<number>>(new Set());
  const [disabledSentences, setDisabledSentences] = useState<Set<number>>(new Set());
  const [recordingStartTime, setRecordingStartTime] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const isDisabled = (index: number) => disabledSentences.has(index);

  const addSentence = (sentence: string) => {
    const formatted = formatSentence(sentence);
    if (formatted) {
      setSentences((prev) => {
        const updatedSentences = [...prev, formatted];
        handleSentenceFinalized(formatted, updatedSentences);
        return updatedSentences;
      });
    }
  };

  const toggleStart = () => {
    if (isCooldown) return;

    if (isStarted) {
      const stopTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });
      const startTime = recordingStartTime || stopTime;
      setSentences((prev) => [
        ...prev,
        `Recorded from ${startTime} to ${stopTime}`,
      ]);
      recognition?.stop();
      setIsStarted(false);
      setRecordingStartTime(null);
    } else {
      const nowTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: true,
      });
      setRecordingStartTime(nowTime);
      setInterimTranscript("");
      try {
        recognition?.start();
        setIsStarted(true);
      } catch (error) {
        console.error("SpeechRecognition start error:", error);
      }
    }
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 1000);
  };

  const handleSentenceClick = async (sentence: string, index: number) => {
    setLoadingSentences((prev) => new Set(prev).add(index));
    if (disabledSentences.has(index)) {
      console.log("Sentence is disabled:", sentence);
      return;
    }

    try {
      const queueResponse = await fetch("http://localhost:5000/queue_claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ claim: sentence }),
      });
      if (!queueResponse.ok) {
        console.error("Failed to queue claim:", queueResponse.statusText);
        return;
      }

    const { result: taskId } = await queueResponse.json();
    console.log(`Task submitted successfully. Task ID: ${taskId}`);

    let taskStatus = "pending";
    let taskResult = null;

    while (taskStatus === "pending" || taskStatus === "running") {
      const pollResponse = await fetch(`http://localhost:5000/poll/${taskId}`);
      if (!pollResponse.ok) {
        console.error("Failed to poll task:", pollResponse.statusText);
        break;
      }

      const pollData = await pollResponse.json();
      taskStatus = pollData.status;
      taskResult = pollData.result;

      console.log(`Task Status: ${taskStatus}`);
      if (taskStatus === "done" || taskStatus === "error") {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (taskStatus === "done" && taskResult) {
      const { verdict, reasoning, sources } = JSON.parse(taskResult);
      addFactCheck({
        claim: sentence,
        isFact: verdict,
        description: reasoning,
        sources,
        timestamp: new Date().toLocaleTimeString(),
      });
    } else if (taskStatus === "error") {
      console.error("Task Error:", taskResult);
    }
    } catch (error) {
      console.error("Error processing sentence:", error);
    } finally {
      setLoadingSentences((prev) => {
        const newSet = new Set(prev);
        newSet.delete(index);
        disabledSentences.add(index);
        return newSet;
      });
    }
  };

  const handleSentenceFinalized = (
    sentence: string,
    updatedSentences: string[]
  ) => {
    console.log("Finalized sentence:", sentence);
    console.log("Sentences array:", updatedSentences);
    const index = updatedSentences.findIndex((s) => s === sentence);
    console.log("Index of sentence:", index);
    console.log("Auto mode:", autoMode);

    if (index !== -1 && autoMode) {
      console.log("Auto mode is on, processing sentence:", sentence);
      handleSentenceClick(sentence, index);
    } else {
      console.log("Auto mode is off, not processing sentence:", sentence);
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

    //WATCH OUT NEVER return isStarted
    return () => {
      recognition?.stop();
    };
  }, [autoMode]);

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
        {sentences.map((sentence, index) => {
          const isRecordedTimestamp = sentence.startsWith("Recorded from");
          if (isRecordedTimestamp) {
            return (
              <div key={index} className={styles.timestamp}>
                {sentence}
              </div>
            );
          }
          return (
            <span
              key={index}
              className={`${styles.sentence} ${
                disabledSentences.has(index)
                  ? styles.disabled
                  : loadingSentences.has(index)
                  ? styles.loading
                  : ""
              }`}
              onClick={() => {
                if (isDisabled(index)) return;
                handleSentenceClick(sentence, index);
              }}
            >
              {sentence}{" "}
            </span>
          );
        })}
        {interimTranscript && (
          <span className={styles.interim}>{interimTranscript}</span>
        )}
      </div>
    </div>
  );
}
