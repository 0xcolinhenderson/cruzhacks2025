"use client";

import { Gradient } from "whatamesh";
import { useEffect } from "react";
import styles from "../page.module.css";
import Navbar from "../components/Navbar";

export default function AboutPage() {
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

  return (
    <div className={styles.page}>
      <canvas id="gradient-canvas" className={styles.canvas}></canvas>
      <Navbar routes={routes} />
      <main className={styles.main}>
        <div className={`${styles.contentContainer} ${styles.horizontalSlide}`}>
          <div className={styles.header}>
            <h1 className={styles.title}>About</h1>
          </div>
          <div className={styles.tiles}>
            <div className={styles.tile}>
              <h2>Inspiration</h2>
              <p>
                With the increase in reliance on the Internet, there has also been an alarming increase in the spread of misinformation. We were inspired to build our project because we noticed how much misinformation has entered our daily lives in things like social media, news articles, and sometimes even informational websites. Our goal is help everyone figure out for themselves what the truth is.
              </p>
            </div>
            <div className={styles.tile}>
              <h2>What it does</h2>
              <p>
                Our tool helps users reveal the truth in their conversations. It records and transcribes speech in real time. Any sentence can be clicked and automatically fact-checked against multiple reputable sources, all of which are conveniently linked in a quick AI report for transparency.
              </p>
            </div>
            <div className={styles.tile}>
              <h2>How we built it</h2>
              <p>
                Our project is built off of Next.js infrastructure alongside a Flask RESTful API server. Our backend utilizes a queue system to handle requests, which query Gemini API alongside a local retriever model using Langchain & Ollama libraries. We source our information through Wikipedia’s API, as it gives easily obtainable sourcing and straight-to-the-point information.
              </p>
            </div>
            <div className={styles.tile}>
              <h2>Built With</h2>
              <ul>
                <li>Flask</li>
                <li>Google Gemini API</li>
                <li>Langchain</li>
                <li>Next.js</li>
                <li>Ollama</li>
                <li>Python</li>
                <li>React</li>
                <li>Typescript</li>
                <li>Web Speech API</li>
                <li>Wikipedia API</li>
              </ul>
            </div>
            <div className={`${styles.tile} ${styles.tileCreatedBy}`}>
              <p>
                Created by: Ayush Bandopadhyay, Colin Henderson, Preston Clayton
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
