import React from "react";
import MatchDetails from "../components/MatchDetails";

export default function MatchDetailsPage({ score = 0, breakdown = [], tamil = true }) {
  return (
    <div className="max-w-xl mx-auto p-4">
      <MatchDetails score={score} breakdown={breakdown} tamil={tamil} />
    </div>
  );
}
