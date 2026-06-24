# Test Specifications

## Unit Tests (Vitest + React Testing Library)

### anomaly.test.ts
- [ ] computes correct z-score for a simple known dataset (mean=50, std=10, value=70 → z=2.0)
- [ ] returns z-score of 0 when value equals the mean
- [ ] handles edge case of zero standard deviation (returns 0 to avoid division by zero)
- [ ] correctly computes 8-week baseline mean from weekly download arrays
- [ ] correctly computes 8-week baseline standard deviation from weekly download arrays
- [ ] composite momentum score correctly weights npm (0.5), GitHub (0.3), HN (0.2) z-scores
- [ ] sorts technologies by composite score descending
- [ ] handles missing data source gracefully (treats as z-score 0, excludes from composite weight renormalization)

### dataSources.test.ts
- [ ] parses npm downloads range response into weekly buckets correctly
- [ ] constructs correct GitHub search URL for a given topic
- [ ] constructs correct HN Algolia search URL for a given keyword
- [ ] localStorage cache returns null for missing key
- [ ] localStorage cache returns parsed data for valid key with timestamp
- [ ] localStorage cache reports stale when timestamp older than threshold

### MomentumLeaderboard.test.tsx
- [ ] renders without crash
- [ ] shows loading state while data is being fetched
- [ ] renders at least 15 leaderboard rows when data is loaded
- [ ] sorts rows by composite momentum score (highest first)
- [ ] displays each technology name and composite score
- [ ] shows sparkline SVG for each row
- [ ] shows per-source badges (npm, GitHub, HN) with individual z-scores
- [ ] applies intensity-based color styling based on z-score magnitude
- [ ] shows "Updated Xh ago" freshness indicator from cache timestamp

### LeaderboardRow.test.tsx
- [ ] renders without crash given valid props
- [ ] displays technology name
- [ ] displays composite momentum score rounded to 2 decimal places
- [ ] shows upward arrow when z-score > 0, downward when < 0
- [ ] renders sparkline with correct number of data points
- [ ] shows per-source z-score badges with correct values

### Sparkline.test.tsx
- [ ] renders without crash
- [ ] renders an SVG element
- [ ] generates correct number of path points from input data array
- [ ] handles empty data array gracefully (renders empty SVG)

## User Journey Tests

### Primary Workflow
1. App loads → shows loading skeleton while fetching data from npm/GitHub/HN APIs
2. Data loads → leaderboard renders sorted by composite momentum z-score, highest first
3. User scans the leaderboard → sees technology names, scores, sparklines, and source badges
4. User reloads page → cached data renders instantly (<500ms) with freshness timestamp
5. User clicks "Refresh" button → triggers fresh API fetch and updates rankings

### Cache Behavior
1. First visit → no cache → fetches live data → stores in localStorage
2. Second visit (within cache window) → loads from cache instantly → shows "Updated Xh ago"
3. After cache expiry → shows stale indicator → user can force refresh

## Acceptance Criteria Checklist
(Reviewer verifies these against PRD.md Must Have features)
- [ ] AC: On page load, the leaderboard renders at least 15 ranked technologies sorted by composite z-score, each with a computed momentum score derived from real npm download data fetched client-side, visible within 5 seconds of page load, with sparklines showing actual 8-week download history.
- [ ] AC: After initial load, page reload renders leaderboard from cache in under 500ms with a visible freshness timestamp; a manual refresh button triggers a fresh fetch and updates the leaderboard with new z-scores.
