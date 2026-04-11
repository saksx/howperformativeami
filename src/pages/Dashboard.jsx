import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import ResultsActions from "../components/ResultsActions";
import { calculatePerformativity } from "../scoring/calculatePerformativity";
import {
  clearSpotifyFetchCache,
  fetchSpotifyData,
} from "../spotify/fetchSpotifyData";
import {
  clearSpotifySession,
  getSpotifyAccessToken,
} from "../spotifyConfig";

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatGenreLabel(value) {
  return value.replace(/_/g, " ");
}

function buildGenreBreakdown(scoredArtists) {
  const genreCounts = new Map();

  scoredArtists.forEach((entry) => {
    const genres =
      entry.artist.genres && entry.artist.genres.length > 0
        ? entry.artist.genres
        : [formatGenreLabel(entry.classification.archetype.toLowerCase())];

    genres.forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    });
  });

  const total = Array.from(genreCounts.values()).reduce((sum, count) => sum + count, 0);

  if (!total) {
    return [];
  }

  return Array.from(genreCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([genre, count]) => ({
      genre: genre.toUpperCase(),
      percentage: Math.max(1, Math.round((count / total) * 100)),
    }));
}

function getDashboardErrorMessage(error) {
  const message = error?.message || "";

  if (message.includes("403")) {
    return "Spotify authorized the login, but this app cannot read your data yet. In development mode, your Spotify account must be added under Users and Access for this app.";
  }

  if (message.includes("429")) {
    return "Spotify is rate-limiting requests right now. Give it a moment and try again.";
  }

  return message || "Spotify data could not be loaded.";
}

function shouldRetryWithoutCache(result) {
  const scoredArtists = result?.scoredArtists || [];

  if (scoredArtists.length < 5) {
    return false;
  }

  const undergroundCount = scoredArtists.filter(
    (entry) => entry.classification.archetype === "UNDERGROUND",
  ).length;
  const neverPlayedCount = scoredArtists.filter(
    (entry) => entry.signalBreakdown.neverPlayed === 40,
  ).length;
  const zeroPopularityCount = scoredArtists.filter(
    (entry) => (entry.artist.popularity || 0) === 0,
  ).length;

  return (
    undergroundCount / scoredArtists.length >= 0.8 ||
    neverPlayedCount / scoredArtists.length >= 0.8 ||
    zeroPopularityCount / scoredArtists.length >= 0.8
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [performativeResult, setPerformativeResult] = useState(null);
  const [userData, setUserData] = useState(null);
  const [spotifyError, setSpotifyError] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cardHover, setCardHover] = useState({ active: false, x: 0, y: 0 });
  const [insightHover, setInsightHover] = useState({ active: false, x: 0, y: 0 });
  const [genreHover, setGenreHover] = useState({ active: false, x: 0, y: 0 });
  const [artistHover, setArtistHover] = useState({ active: false, x: 0, y: 0 });

  useEffect(() => {
    let isMounted = true;

    async function loadPerformativity() {
      setIsLoading(true);
      setSpotifyError("");

      const token = await getSpotifyAccessToken();

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const userData = await fetchSpotifyData(token);
        let result = calculatePerformativity(userData);

        if (shouldRetryWithoutCache(result)) {
          clearSpotifyFetchCache();
          const freshUserData = await fetchSpotifyData(token, { cache: false });
          result = calculatePerformativity(freshUserData);
        }

        if (isMounted) {
          setUserData(userData);
          setPerformativeResult(result);
        }
      } catch (error) {
        console.log("SPOTIFY DASHBOARD ERROR:", error);

        if (isMounted) {
          setSpotifyError(getDashboardErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPerformativity();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const scoredArtists = useMemo(
    () => performativeResult?.scoredArtists || [],
    [performativeResult],
  );
  const stats = performativeResult?.stats;
  const displayArtists = useMemo(() => {
    if (!userData || scoredArtists.length === 0) {
      return scoredArtists;
    }

    const scoredArtistMap = new Map(
      scoredArtists.map((entry) => [entry.artist.id, entry]),
    );
    const orderedDisplayArtists = [];
    const seenIds = new Set();
    const addArtists = (artists) => {
      artists.forEach((artist) => {
        if (seenIds.has(artist.id)) {
          return;
        }

        const scoredArtist = scoredArtistMap.get(artist.id);

        if (scoredArtist) {
          orderedDisplayArtists.push(scoredArtist);
          seenIds.add(artist.id);
        }
      });
    };

    addArtists(userData.topArtistsShort);
    addArtists(userData.topArtistsMedium);
    addArtists(userData.topArtistsLong);

    return orderedDisplayArtists.length > 0 ? orderedDisplayArtists : scoredArtists;
  }, [scoredArtists, userData]);
  const topPerformativeArtists = useMemo(
    () => [...displayArtists].sort((left, right) => right.score - left.score).slice(0, 3),
    [displayArtists],
  );
  const rawScoreTotal = useMemo(
    () => scoredArtists.reduce((sum, artist) => sum + artist.rawScore, 0),
    [scoredArtists],
  );
  const performativePercent = stats?.performativePercent || 0;
  const authenticPercent =
    stats?.totalAnalyzed > 0
      ? Math.round((stats.authenticCount / stats.totalAnalyzed) * 100)
      : 0;
  const ghostPercent =
    stats?.totalAnalyzed > 0
      ? Math.round((stats.ghostCount / stats.totalAnalyzed) * 100)
      : 0;
  const genreBreakdown = useMemo(
    () => buildGenreBreakdown(displayArtists),
    [displayArtists],
  );
  const sortedDisplayArtists = useMemo(
    () => [...displayArtists].sort((left, right) => right.score - left.score),
    [displayArtists],
  );
  const topBreakdownArtists = sortedDisplayArtists.slice(0, 10);
  const visibleArtists = showAllArtists
    ? topBreakdownArtists
    : topBreakdownArtists.slice(0, 5);
  const overallScore = performativeResult?.overallScore || 0;
  const scoreLabel = performativeResult?.profile?.label || "ANALYZING";
  const profileSubtitle = performativeResult?.profile?.subtitle || "";

  function handleScoreCardMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCardHover({
      active: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function updateHoverState(event, setter) {
    const rect = event.currentTarget.getBoundingClientRect();
    setter({
      active: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function clearHoverState(setter) {
    setter((current) => ({
      ...current,
      active: false,
    }));
  }

  return (
    <section className="screen screen--results">
      <div className="noise-overlay" />

      <div className="results-stack">
        <motion.section
          className="score-card"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          onMouseEnter={handleScoreCardMove}
          onMouseMove={handleScoreCardMove}
          onMouseLeave={() =>
            setCardHover((current) => ({
              ...current,
              active: false,
            }))
          }
        >
          <div
            className={
              cardHover.active
                ? "score-card__pointer-wrap score-card__pointer-wrap--active"
                : "score-card__pointer-wrap"
            }
            style={{
              transform: `translate(${cardHover.x}px, ${cardHover.y}px)`,
            }}
          >
            <div className="score-card__pointer-gradient" />
          </div>
          <div className="score-card__corner score-card__corner--tl" />
          <div className="score-card__corner score-card__corner--tr" />
          <div className="score-card__corner score-card__corner--bl" />
          <div className="score-card__corner score-card__corner--br" />

          <div className="score-card__content">
            <p className="results-kicker">YOUR PERFORMATIVITY SCORE</p>
            <motion.div
              className="score-number-wrap"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 180 }}
            >
              <h1 className="score-number">{overallScore}</h1>
            </motion.div>
            <motion.div
              className="score-stamp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <span>{scoreLabel}</span>
              <div className="score-stamp__seal">OK</div>
            </motion.div>

            <div className="results-divider" />

            <motion.div
              className="score-facts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="fact-block">
                <p>TOP PERFORMATIVE ARTISTS</p>
                <ul>
                  {topPerformativeArtists.length > 0 ? (
                    topPerformativeArtists.map((entry, index) => (
                      <li key={entry.artist.id}>
                        <span>[{index + 1}]</span>
                        <span>{entry.artist.name}</span>
                      </li>
                    ))
                  ) : (
                    <li>
                      <span>[1]</span>
                      <span>{isLoading ? "Analyzing your library" : "No artists found"}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="fact-block">
                <p>RAW SCORE TOTAL</p>
                <strong>{rawScoreTotal}</strong>
                <small>sum of artist raw scores</small>
              </div>

              <div className="fact-block">
                <p>PERFORMATIVE ARTISTS</p>
                <strong>{formatPercent(performativePercent)}</strong>
                <small>artists scoring 50 or higher</small>
              </div>

              <div className="fact-block">
                <p>GHOST FOLLOW RATIO</p>
                <strong>{formatPercent(ghostPercent)}</strong>
                <small>followed but not recently played</small>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {!spotifyError && !isLoading && (
          <ResultsActions onShowBreakdown={() => setShowBreakdown(true)} />
        )}

        {spotifyError && (
          <div className="auth-error-card auth-error-card--dashboard">
            <p>{spotifyError}</p>
            <button
              className="results-action results-action--secondary"
              onClick={() => {
                clearSpotifySession();
                navigate("/");
              }}
            >
              Back Home
            </button>
          </div>
        )}

        {showBreakdown && !spotifyError && performativeResult && (
          <motion.section
            className="editorial-section"
            id="breakdown"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="section-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 }}
            >
              <h2>THE BREAKDOWN</h2>
              <p>YOUR LISTENING PATTERNS EXPOSED</p>
            </motion.div>

            <motion.div
              className="pull-quote"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="pull-quote__mark">"</span>
              <p>
                {stats.performativeCount} artists scored performative,{" "}
                {stats.authenticCount} landed authentic, and{" "}
                {stats.ghostCount} are basically shelf decor.
              </p>
              <span className="pull-quote__mark pull-quote__mark--end">"</span>
            </motion.div>

            <motion.div
              className="insight-panel"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="insight-index">01</div>
              <div
                className="insight-content hover-glow-card"
                onMouseEnter={(event) => updateHoverState(event, setInsightHover)}
                onMouseMove={(event) => updateHoverState(event, setInsightHover)}
                onMouseLeave={() => clearHoverState(setInsightHover)}
              >
                <div
                  className={
                    insightHover.active
                      ? "hover-glow-card__pointer-wrap hover-glow-card__pointer-wrap--active"
                      : "hover-glow-card__pointer-wrap"
                  }
                  style={{
                    transform: `translate(${insightHover.x}px, ${insightHover.y}px)`,
                  }}
                >
                  <div className="hover-glow-card__pointer-gradient" />
                </div>
                <div className="hover-glow-card__content">
                  <p className="insight-kicker">YOUR SECRET LISTENING HABITS</p>
                  <h3>HIGHEST-SCORING ARTISTS</h3>
                  <div className="insight-list">
                    {[...displayArtists]
                      .sort((left, right) => right.score - left.score)
                      .slice(0, 5)
                      .map((entry, index) => (
                      <motion.div
                        key={entry.artist.id}
                        className="insight-list__row"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.06 }}
                      >
                        <span>[{index + 1}]</span>
                        <p>
                          {entry.artist.name} - score {entry.score}. {entry.callout}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bars-panel"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bars-panel__index">02</div>
              <p className="insight-kicker">CURATED IDENTITY VS ACTUAL BEHAVIOR</p>

              <div className="bar-group">
                <div className="bar-group__labels">
                  <span>AUTHENTIC</span>
                  <span>{formatPercent(authenticPercent)}</span>
                </div>
                <div className="bar-track">
                  <motion.div
                    className="bar-fill bar-fill--lime"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${authenticPercent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 }}
                  >
                    ACTUAL LISTENING
                  </motion.div>
                </div>
              </div>

              <div className="bar-group">
                <div className="bar-group__labels">
                  <span>PERFORMATIVE</span>
                  <span>{formatPercent(performativePercent)}</span>
                </div>
                <div className="bar-track">
                  <motion.div
                    className="bar-fill bar-fill--red"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${performativePercent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.4 }}
                  >
                    CURATED PERSONA
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="genre-breakdown-card hover-glow-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onMouseEnter={(event) => updateHoverState(event, setGenreHover)}
              onMouseMove={(event) => updateHoverState(event, setGenreHover)}
              onMouseLeave={() => clearHoverState(setGenreHover)}
            >
              <div
                className={
                  genreHover.active
                    ? "hover-glow-card__pointer-wrap hover-glow-card__pointer-wrap--active"
                    : "hover-glow-card__pointer-wrap"
                }
                style={{
                  transform: `translate(${genreHover.x}px, ${genreHover.y}px)`,
                }}
              >
                <div className="hover-glow-card__pointer-gradient" />
              </div>
              <div className="hover-glow-card__content">
                <div className="genre-breakdown-card__badge">03</div>
                <h3>GENRE DISTRIBUTION</h3>
                <div className="genre-grid">
                  {genreBreakdown.map((genre, index) => (
                    <div key={genre.genre} className="genre-card">
                      <div className="genre-card__chart">
                        <motion.div
                          className="genre-card__fill"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${genre.percentage * 4}px` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.1 + index * 0.08 }}
                        />
                      </div>
                      <p className="genre-card__percent">{genre.percentage}%</p>
                      <p className="genre-card__label">{genre.genre}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              className="artist-breakdown-card hover-glow-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onMouseEnter={(event) => updateHoverState(event, setArtistHover)}
              onMouseMove={(event) => updateHoverState(event, setArtistHover)}
              onMouseLeave={() => clearHoverState(setArtistHover)}
            >
              <div
                className={
                  artistHover.active
                    ? "hover-glow-card__pointer-wrap hover-glow-card__pointer-wrap--active"
                    : "hover-glow-card__pointer-wrap"
                }
                style={{
                  transform: `translate(${artistHover.x}px, ${artistHover.y}px)`,
                }}
              >
                <div className="hover-glow-card__pointer-gradient" />
              </div>
              <div className="hover-glow-card__content">
                <div className="artist-breakdown-card__badge">04</div>
                <h3>FULL ARTIST BREAKDOWN</h3>
                <div className="artist-list">
                  {visibleArtists.map((entry, index) => (
                    <motion.div
                      className="artist-row"
                      key={entry.artist.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <div className="artist-rank">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="artist-meta">
                        <strong>{entry.artist.name}</strong>
                        <span>
                          {formatGenreLabel(entry.classification.archetype)} |{" "}
                          {entry.callout || "No dominant signal detected."}
                        </span>
                      </div>
                      <div className="artist-score">{entry.score}</div>
                    </motion.div>
                  ))}
                </div>
                {topBreakdownArtists.length > 5 && (
                  <div className="artist-breakdown-toggle">
                    <button
                      className="artist-breakdown-toggle__button"
                      onClick={() => setShowAllArtists((current) => !current)}
                    >
                      {showAllArtists ? "SHOW TOP 5" : "SEE TOP 10"}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              className="verdict-wrap"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <div className="verdict-block verdict-block--framed">
                <p>FINAL VERDICT</p>
                <h3>
                  {scoreLabel}. {profileSubtitle}
                </h3>
              </div>

              <div className="verdict-actions">
                <button
                  className="results-action results-action--primary"
                  onClick={async () => {
                    const sharePayload = {
                      title: "How Performative Am I?",
                      text: `I scored ${overallScore} and got ${scoreLabel}.`,
                      url: window.location.href,
                    };

                    try {
                      if (navigator.share) {
                        await navigator.share(sharePayload);
                        return;
                      }

                      await navigator.clipboard.writeText(window.location.href);
                    } catch (error) {
                      console.log("SHARE ERROR:", error);
                    }
                  }}
                >
                  SHARE THIS SHAME
                </button>
                <button
                  className="results-action results-action--secondary"
                  onClick={() => {
                    setShowBreakdown(false);
                    setShowAllArtists(false);
                    clearSpotifySession();
                    navigate("/");
                  }}
                >
                  START OVER
                </button>
              </div>
            </motion.div>
          </motion.section>
        )}
      </div>
    </section>
  );
}
