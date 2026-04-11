import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export default function SiteFooter() {
  const [activePanel, setActivePanel] = useState(null);

  return (
    <>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <span>howperformativeami</span>
            <span className="site-footer__brand-domain">.com</span>
          </div>

          <div className="site-footer__nav">
            <button
              className="site-footer__button"
              onClick={() => setActivePanel("about")}
            >
              About
            </button>
            <button
              className="site-footer__button"
              onClick={() => setActivePanel("privacy")}
            >
              Privacy
            </button>
          </div>

          <div className="site-footer__socials" aria-label="Social links">
            <a className="site-footer__social" href="/" aria-label="Facebook">
              <img src="/facebook-3-512.png" alt="" />
            </a>
            <a className="site-footer__social" href="/" aria-label="Instagram">
              <img src="/instagram-512.png" alt="" />
            </a>
            <a className="site-footer__social" href="/" aria-label="X">
              <img src="/twitter-x-512.png" alt="" />
            </a>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {activePanel && (
          <motion.div
            className="footer-panel__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePanel(null)}
          >
            <motion.div
              className="footer-panel"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="footer-panel__eyebrow">
                {activePanel === "about" ? "About The Product" : "Privacy Policy"}
              </p>
              <h2 className="footer-panel__title">
                {activePanel === "about"
                  ? "Spotify listening data, translated into a performativity score."
                  : "How your Spotify data is used for scoring."}
              </h2>
              <p className="footer-panel__copy">
                {activePanel === "about"
                  ? "howperformativeami.com connects with your Spotify account, reviews your listening profile, and generates a performativity score based on your top artists and our internal scoring logic. The experience is designed as a playful, editorial-style breakdown of how curated your music taste appears."
                  : "To generate your score, howperformativeami.com may request limited Spotify account data such as your top artists and related profile signals required for the scoring experience. We use that information to calculate and display your performativity results, and we do not ask for playlist editing, playback control, or unrelated account permissions."}
              </p>
              <button
                className="footer-panel__close"
                onClick={() => setActivePanel(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
