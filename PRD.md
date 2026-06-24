# Momentum Radar — Product Requirements Document

## Problem
Developers consistently discover trending technologies weeks or months after momentum has already peaked. Existing tools (GitHub Trending, Google Trends, Stack Overflow Surveys) show raw popularity, not acceleration. There is no quick, daily-glance tool that surfaces _what is abnormally hot right now versus its own normal_ — the statistical anomaly, not the absolute count.

## Target Users
Early-adopter developers, DevRel leads, and technology radar curators who need to spot emerging languages, frameworks, and packages before they go mainstream. They check daily or weekly, want signal in under 10 seconds, and value statistical rigor over hype.

## Core Feature (default: exactly ONE)
- **Anomaly-Ranked Momentum Leaderboard**: Fetches live data from npm downloads (12-week time series), GitHub repository activity (topic search counts), and Hacker News discussion volume, computes a z-score for each tracked technology comparing current-week momentum against its own 8-week baseline, and renders a ranked leaderboard sorted by composite momentum z-score. Each row shows the technology name, its composite momentum score, a sparkline of recent activity, per-source breakdown badges (npm/GitHub/HN), and an arrow indicating trend direction. — Acceptance Criteria: On page load, the leaderboard renders at least 15 ranked technologies sorted by composite z-score, each with a computed momentum score derived from real npm download data fetched client-side, visible within 5 seconds of page load, with sparklines showing actual 8-week download history.

## Should Have (optional — only if the ONE feature requires it)
- **Smart API Caching with Staleness Indicator**: Caches fetched API responses in localStorage with a timestamp; on reload, shows cached data instantly while indicating data freshness ("Updated 3h ago" / "Stale — click to refresh"). Prevents rate-limit exhaustion and gives users a reason to return daily to see fresh rankings. — Acceptance Criteria: After initial load, page reload renders leaderboard from cache in under 500ms with a visible freshness timestamp; a manual refresh button triggers a fresh fetch and updates the leaderboard with new z-scores.

## Out of Scope (v1) — LIST AT LEAST 3 things explicitly NOT being built
- **User accounts / saved watchlists**: Personalization would dilute the single-purpose "glance at the board" value and add auth complexity with no backend. Users return for the public leaderboard, not personalization.
- **Alerts / notifications (email, Slack, push)**: Requires a backend, scheduler, and user management. The "reason to return" is the bookmarked daily check, not push interruptions.
- **Historical trend explorer with date-range picker**: A full time-series explorer would shift the product from "what's hot now" (anomaly radar) to a general analytics dashboard, breaking the single-purpose promise.
- **AI-generated summaries or recommendations**: Violates the deterministic, LLM-free design principle. The z-score math IS the intelligence; users interpret the numbers themselves.

## Success Metrics
- Primary: User sees the full ranked leaderboard with computed z-scores within 5 seconds of first page load
- Secondary: Returning visitor sees cached leaderboard in under 500ms and can identify at least one technology they didn't know was surging

## Design Principles
- **Data is the hero**: The ranked leaderboard occupies the entire viewport on first load — no marketing copy, no "Get Started" button. The numbers and their visual ranking ARE the product.
- **One-hue intensity ramp**: Momentum intensity uses a single warm-hue scale (desaturated neutral → saturated #C7452E). No rainbow palettes. Higher z-score = more vivid color. The eye is drawn to what's surging.
- **Statistical transparency**: Every score shows its sources and the math is visible. No black-box "trending algorithm" mystique — the z-score formula and per-source breakdown are shown inline.
