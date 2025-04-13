import React from "react";
import { useState, useEffect, useRef } from "react";
import styles from "./FactCheckBox.module.css";
import styles2 from "./Transcription.module.css";

interface FactCheckData {
  claim: string;
  isFact: boolean;
  description: string;
  sources: string[];
  timestamp: string;
}

interface FactCheckProps {
  factChecks: FactCheckData[];
  onAutoModeChange: (isAuto: boolean) => void;
}

export default function FactCheckBox({
  factChecks,
  onAutoModeChange,
}: FactCheckProps) {
  const [isAutoMode, setIsAutoMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleToggleMode = () => {
    console.log("Toggle mode clicked:", isAutoMode);
    setIsAutoMode((prev) => !prev);
  };

  useEffect(() => {
    onAutoModeChange(isAutoMode);
  }, [isAutoMode, onAutoModeChange]);

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
                  <li key={sourceIndex}>
                    <a href={source} className={styles.source} target="_blank" rel="noopener noreferrer">
                      {source}
                    </a>
                  </li>
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
