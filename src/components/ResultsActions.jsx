import { useState } from "react";
import { motion } from "motion/react";

export default function ResultsActions({ onShowBreakdown, onRestartLabel = "SHARE RESULTS" }) {
  const [copied, setCopied] = useState(false);

  function handleBreakdown() {
    if (onShowBreakdown) {
      onShowBreakdown();
    }
  }

  async function handleShare() {
    const sharePayload = {
      title: "How Performative Am I?",
      text: "Check out my How Performative Am I? results.",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(sharePayload);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.log("SHARE ERROR:", error);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2 }}
      className="results-actions"
    >
      <button className="results-action results-action--primary" onClick={handleBreakdown}>
        SEE FULL BREAKDOWN
      </button>
      <button className="results-action results-action--secondary" onClick={handleShare}>
        {copied ? "LINK COPIED" : onRestartLabel}
      </button>
    </motion.div>
  );
}
