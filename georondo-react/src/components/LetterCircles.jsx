import React, { useEffect, useState } from "react";
import { useGame } from "../GameContext";

function resolveForcedDiameter() {
  if (typeof window === "undefined") return null;
  const cssVar = getComputedStyle(document.documentElement)
    .getPropertyValue("--ring-diameter")
    .trim();
  if (cssVar) {
    const n = parseInt(cssVar, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

function useRingSize(forced) {
  const calc = () => {
    if (forced) return forced;
    if (typeof window === "undefined") return 900;

    const vmin = Math.min(window.innerWidth, window.innerHeight);
    // bump up slightly from 0.82 → 0.87
    const raw = vmin * 0.87;

    return Math.max(580, Math.min(1250, Math.round(raw)));
  };

  const [size, setSize] = useState(calc);

  useEffect(() => {
    if (forced) {
      setSize(forced);
      return;
    }
    const onResize = () => setSize(calc());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [forced]);

  return size;
}

export default function LetterCircles({
  customAlphabet,
  customCurrentLetterIndex,
  customPlayerAnswers,
  customSkippedLetters,
  customSkipMode,
  ringDiameter,
}) {
  const { alphabet, currentLetterIndex, playerAnswers, skippedLetters, skipMode } = useGame();

  const finalAlphabet = customAlphabet || alphabet;
  const finalCurrentLetterIndex =
    customCurrentLetterIndex !== undefined ? customCurrentLetterIndex : currentLetterIndex;
  const finalPlayerAnswers = customPlayerAnswers || playerAnswers;
  const finalSkippedLetters = customSkippedLetters || skippedLetters;
  const finalSkipMode = customSkipMode !== undefined ? customSkipMode : skipMode;

  const cssForced = resolveForcedDiameter();
  const forced = ringDiameter || cssForced || null;
  const containerSize = useRingSize(forced);

  // bump letters just a little too: 0.062 → 0.066
  const letterSize = Math.max(42, Math.round(containerSize * 0.066));
  const radius = containerSize * 0.46;
  const center = containerSize / 2;

  const getStatus = (index) => {
    if (index === finalCurrentLetterIndex) return "active";
    const answer = finalPlayerAnswers.find((ans) => ans.letter === finalAlphabet[index]);
    if (answer) {
      if (answer.wasCorrect) return "completed";
      if (answer.userAnswer === "") return "skipped";
      return "incorrect";
    }
    return "";
  };

  return (
    <div
      className="letter-circles"
      id="letter-circles"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        transform: "translate(-50%, -50%)",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      {finalAlphabet.map((letter, index) => {
        const angleDeg = (360 / finalAlphabet.length) * index;
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = center + radius * Math.cos(angleRad) - letterSize / 2;
        const y = center + radius * Math.sin(angleRad) - letterSize / 2;
        const status = getStatus(index);

        return (
          <div
            key={letter}
            className={`letter${status ? " " + status : ""}`}
            style={{
              position: "absolute",
              left: `${Math.round(x)}px`,
              top: `${Math.round(y)}px`,
              width: `${letterSize}px`,
              height: `${letterSize}px`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: `${Math.round(letterSize * 0.5)}px`,
              border:
                status === "active"
                  ? `${Math.max(3, Math.round(letterSize * 0.09))}px solid deepskyblue`
                  : undefined,
            }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
