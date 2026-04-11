import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { beginSpotifyLogin } from "../spotifyConfig";

const GLITCH_VARIANTS = [
  "We know you don't actually listen to that.",
  "Your friends aren't impressed anymore.",
  "Stop pretending you like experimental jazz.",
  "We see through the playlist curation.",
];

export default function LoginButton() {
  const [glitchText, setGlitchText] = useState(GLITCH_VARIANTS[0]);
  const [typedText, setTypedText] = useState("");
  const [heroHover, setHeroHover] = useState({
    active: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchText((current) => {
        const nextOptions = GLITCH_VARIANTS.filter((variant) => variant !== current);
        return nextOptions[Math.floor(Math.random() * nextOptions.length)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTypedText("");
    let index = 0;

    const typingInterval = window.setInterval(() => {
      index += 1;
      setTypedText(glitchText.slice(0, index));

      if (index >= glitchText.length) {
        window.clearInterval(typingInterval);
      }
    }, 32);

    return () => window.clearInterval(typingInterval);
  }, [glitchText]);

  const login = async () => {
    try {
      await beginSpotifyLogin();
    } catch (error) {
      console.log("SPOTIFY LOGIN ERROR:", error);
    }
  };

  const handleHeroMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHeroHover({
      active: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  return (
    <section
      className="screen screen--landing"
      onMouseEnter={handleHeroMove}
      onMouseMove={handleHeroMove}
      onMouseLeave={() =>
        setHeroHover((current) => ({
          ...current,
          active: false,
        }))
      }
    >
      <div className="noise-overlay" />
      <div
        className={
          heroHover.active
            ? "landing-screen__pointer-wrap landing-screen__pointer-wrap--active"
            : "landing-screen__pointer-wrap"
        }
        style={{
          transform: `translate(${heroHover.x}px, ${heroHover.y}px)`,
        }}
      >
        <div className="landing-screen__pointer-gradient" />
      </div>

      <motion.div
        className="landing-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="landing-headline">
          <motion.h1
            className="display display--light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            HOW
          </motion.h1>
          <motion.h1
            className="display display--accent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            PERFORMATIVE
          </motion.h1>
          <motion.h1
            className="display display--light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
          >
            AM I?
          </motion.h1>
        </div>

        <motion.p
          className="glitch-copy"
          key={glitchText}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {typedText}
          <span className="typing-caret" aria-hidden="true">|</span>
        </motion.p>

        <motion.button
          className="cta-button"
          onClick={login}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.44, duration: 0.32 }}
        >
          <span className="cta-button__corner cta-button__corner--top" />
          <span className="cta-button__corner cta-button__corner--bottom" />
          CONNECT SPOTIFY
        </motion.button>
      </motion.div>
    </section>
  );
}
