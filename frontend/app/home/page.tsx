"use client";

import { Gradient } from "whatamesh";
import { useEffect } from "react";
import styles from "../page.module.css";
import Navbar from "../components/Navbar";
export default function BlankPage() {
  useEffect(() => {
    const gradient = new Gradient();
    gradient.initGradient("#gradient-canvas");
  }, []);

  const routes = [
    { name: "Home", path: "/Home" },
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
          <div className={styles.titleContainer}>
            <h1 className={styles.title}>
              Realtime Conversational Fact-Checking
            </h1>
            <h2 className={styles.subtitle}>
              Generate realtime analysis & transcription of conversations, to
              combat misinformation. Created for UCSC CruzHacks 2025.
            </h2>
          </div>
        </div>
      </main>
      <div className={styles.mainContent}>
        <div className={styles.feature}>
          <img src="/analysis.JPG" alt="Analysis" />
          <h3 className={styles.featureTitle}>
            Realtime Conversational Analysis
          </h3>
          <p>
            Analyze conversations in real-time to detect misinformation and
            ensure factual accuracy.
          </p>
        </div>
        <div className={styles.feature}>
          <img src="/stt.JPG" alt="STT" />
          <h3 className={styles.featureTitle}>Speech-to-Text</h3>
          <p>
            Convert spoken words into text dynamically with advanced speech
            recognition
          </p>
        </div>
        <div className={styles.feature}>
          <img src="/other.JPG" alt="Verify Claims" />
          <h3 className={styles.featureTitle}>
            Realtime Conversational Analysis
          </h3>
          <p>
            Verify claims using AI-powered tools and trusted sources. All
            analysis of claims provde sourcing to allow for transparency.
          </p>
        </div>
      </div>
    </div>
  );
}
