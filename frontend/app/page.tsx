"use client";

import { Gradient } from "whatamesh";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Transcription from "./components/Transcription";
import FactCheckBox from "./components/FactCheckBox";
import styles from "./page.module.css";

export default function Home() {
  useEffect(() => {
    const gradient = new Gradient();
    gradient.initGradient("#gradient-canvas");
  }, []);

  const textStream1 = "Test message. Joe Biden.";

  const routes = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    {
      name: "Github",
      path: "https://github.com/0xcolinhenderson/cruzhacks2025",
      icon: "/github.svg",
    },
    { name: "Create Session", path: "/session", isMain: true },
  ];

  return (
    <div className={styles.page}>
      <canvas id="gradient-canvas" className={styles.canvas}></canvas>
      <Navbar routes={routes} />
      <main className={styles.main}>
        <div className={styles.contentContainer}>
          <FactCheckBox textStream={textStream1} />
          <Transcription textStream={textStream1} />
        </div>
      </main>
    </div>
  );
}
