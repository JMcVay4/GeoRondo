import React from "react";
import { useGame } from "../GameContext";

const containerSize = 1100;
const radius = containerSize * 0.25;
const center = containerSize / 2;

export default function LetterCircles() {
  const { alphabet, currentLetterIndex, playerAnswers, skippedLetters } = useGame();

  const getStatus = (index) => {
    const answer = playerAnswers.find(ans => ans.letter === alphabet[index]);
    if (answer) {
      if (answer.wasCorrect) return "completed";
      if (answer.userAnswer === "") return "skipped";
      return "incorrect";
    }
    if (index === currentLetterIndex) return "active";
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
      {alphabet.map((letter, index) => {
        const angleDeg = (360 / alphabet.length) * index;
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
