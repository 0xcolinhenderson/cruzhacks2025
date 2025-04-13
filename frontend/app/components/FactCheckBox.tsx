import React from "react";
import { useState, useEffect, useRef } from "react";
import styles from "./FactCheckBox.module.css";
import styles2 from "./Transcription.module.css";

interface TextareaData {
  claim: string;
  isFact: boolean;
  description: string;
  sources: string[];
  timestamp: string;
}

interface FactCheckProps {
  textStream: string;
}

export default function FactCheckBox({ textStream }: FactCheckProps) {
  const [factChecks, setFactChecks] = useState<TextareaData[]>([]);
  const [isAutoMode, setIsAutoMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addFactCheck = () => {
    const currentTime = new Date().toLocaleTimeString();
    const claim = textStream;
    const isFact = Math.random() > 0.5;
    const description = isFact
      ? "This claim is supported by evidence."
      : "This claim is not supported by evidence.";
    const sources = isFact
      ? ["Source 1", "Source 2", "Source 3"]
      : ["No reliable sources found."];

    setFactChecks((prev) => [
      ...prev,
      { claim, isFact, description, sources, timestamp: currentTime },
    ]);
  };

  const handleToggleMode = () => {
    setIsAutoMode((prev) => !prev);

    if (!isAutoMode) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          addFactCheck();
        }, 3000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [factChecks]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.factCheckBoxContainer}>
      <div className={styles2.titleContainer}>
        <h2 className={styles2.title}>Fact Check</h2>
        <div className={styles.switchContainer}>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={isAutoMode}
              onChange={handleToggleMode}
            />
            <span className={styles.slider}></span>
          </label>
          <div className={styles.switchText}>
            <span className={styles.switchLabel}>
              {isAutoMode ? "Auto" : "Manual"}
            </span>
          </div>
        </div>
      </div>
      <div className={styles2.divider}></div>
      <div
        className={styles2.textContainer}
        id="factcheck-container"
        ref={containerRef}
      >
        {factChecks.map((factCheck, index) => (
          <div key={index} className={styles.factCheck}>
            <div className={styles.factCheckHeader}>
              <span className={styles.factCheckLabel}>
                <span
                  className={
                    factCheck.isFact
                      ? styles.factCheckTitleGreen
                      : styles.factCheckTitleRed
                  }
                >
                  FACT CHECK:
                </span>{" "}
                {factCheck.claim}
              </span>
              <span
                className={
                  factCheck.isFact
                    ? styles.factCheckIconGreen
                    : styles.factCheckIconRed
                }
              >
                {factCheck.isFact ? "✔" : "✘"}
              </span>
            </div>
            <p className={styles.factCheckDescription}>
              {factCheck.description}
            </p>
            <div className={styles.factCheckSources}>
              <strong>Sources:</strong>
              <ul>
                {factCheck.sources.map((source, sourceIndex) => (
                  <li key={sourceIndex}>{source}</li>
                ))}
              </ul>
            </div>
            <p className={styles2.messageData}>{factCheck.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
