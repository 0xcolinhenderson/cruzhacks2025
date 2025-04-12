import React from "react";
import styles from "./Transcription.module.css";

interface TranscriptionProps {
  textStream: string;
}

const Transcription: React.FC<TranscriptionProps> = ({ textStream }) => {
  return (
    <div className={styles.transcriptionContainer}>
      <h2 className={styles.title}>Transcription</h2>
      <div className={styles.divider}></div>
      <textarea
        readOnly
        className={styles.textArea}
        value={textStream}
      ></textarea>
    </div>
  );
};

export default Transcription;
