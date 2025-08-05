import React from "react";
import { useGame } from "../GameContext";

const containerSize = 1100;
const radius = containerSize * 0.25;
const center = containerSize / 2;

export default function LetterCircles({ 
  customAlphabet, 
  customCurrentLetterIndex, 
  customPlayerAnswers, 
  customSkippedLetters, 
  customSkipMode 
}) {
  const { alphabet, currentLetterIndex, playerAnswers, skippedLetters, skipMode } = useGame();
  
  const finalAlphabet = customAlphabet || alphabet;
  const finalCurrentLetterIndex = customCurrentLetterIndex !== undefined ? customCurrentLetterIndex : currentLetterIndex;
  const finalPlayerAnswers = customPlayerAnswers || playerAnswers;
  const finalSkippedLetters = customSkippedLetters || skippedLetters;
  const finalSkipMode = customSkipMode !== undefined ? customSkipMode : skipMode;

  const getStatus = (index) => {
    if (index === finalCurrentLetterIndex) return "active";

    const answer = finalPlayerAnswers.find(ans => ans.letter === finalAlphabet[index]);
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
        marginBottom: "300px",
      }}
    >
      {finalAlphabet.map((letter, index) => {
        const angleDeg = (360 / finalAlphabet.length) * index;
        const angleRad = angleDeg * (Math.PI / 180);
        const x = center + radius * Math.cos(angleRad) - 25;
        const y = center + radius * Math.sin(angleRad) - 25;
        const status = getStatus(index);

        return (
          <div
            key={letter}
            className={`letter${status ? " " + status : ""}`}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
            }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
