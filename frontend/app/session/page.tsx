"use client";

import { Gradient } from "whatamesh";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Transcription from "../components/Transcription";
import FactCheckBox from "../components/FactCheckBox";
import styles from "../page.module.css";

interface FactCheckData {
  claim: string;
  isFact: boolean;
  description: string;
  sources: string[];
  timestamp: string;
}

export default function Home() {
  const [factChecks, setFactChecks] = useState<FactCheckData[]>([]);
  const [autoMode, setAutoMode] = useState(false);

  const handleAutoModeChange = (isAuto: boolean) => {
    setAutoMode(isAuto);
  };

  useEffect(() => {
    const gradient = new Gradient();
    gradient.initGradient("#gradient-canvas");
  }, []);

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

  const addFactCheck = ({
    claim,
    isFact,
    description,
    sources,
    timestamp,
  }: {
    claim: string;
    isFact: boolean;
    description: string;
    sources: string[];
    timestamp: string;
  }) => {
    setFactChecks((prev) => [
      ...prev,
      { claim, isFact, description, sources, timestamp },
    ]);
  };

  return (
    <div className={styles.page}>
      <canvas id="gradient-canvas" className={styles.canvas}></canvas>
      <Navbar routes={routes} />
      <main className={styles.main}>
        <div className={styles.contentContainer}>
          <FactCheckBox
            factChecks={factChecks}
            onAutoModeChange={handleAutoModeChange}
          />
          <Transcription addFactCheck={addFactCheck} autoMode={autoMode} />
        </div>
      </main>
    </div>
  );
}
