"use client";

import { Gradient } from "whatamesh";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Transcription from "./components/Transcription";
import styles from "./page.module.css";

export default function Home() {
  useEffect(() => {
    const gradient = new Gradient();
    gradient.initGradient("#gradient-canvas");
  }, []);

  const textStream1 = "This is the first transcription text stream...";
  const textStream2 = "This is the second transcription text stream...";

  const routes = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Create Session", path: "/session", isMain: true },
  ];

  return (
    <div className={styles.page}>
      <canvas id="gradient-canvas" className={styles.canvas}></canvas>
      <Navbar routes={routes} />
      <main className={styles.main}>
        <div className={styles.transcriptionContainer}>
          <Transcription textStream={textStream1} />
          <Transcription textStream={textStream2} />
        </div>
      </main>
    </div>
  );
}
