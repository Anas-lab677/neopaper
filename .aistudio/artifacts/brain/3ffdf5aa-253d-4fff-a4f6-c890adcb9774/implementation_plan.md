# Daybreak — Your Personal Morning Paper

Daybreak is a finite, personalized daily morning newspaper web application that gathers verified reporting from publisher RSS feeds, analyzes and synthesizes source-grounded briefs via Gemini, personalizes editions based on reader interests and feedback, and renders identical broadsheet web editions and downloadable PDFs.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on your requirements and design specifications:

- **Confirmed Decision 1 (Storage Architecture)**: Dual-mode architecture. An embedded high-performance server-side data store provides instant zero-config exploration with deterministically labeled sample profiles (Reader A & Reader B), while seamlessly synchronizing with Supabase PostgreSQL and Auth when environment variables are supplied.
- **Confirmed Decision 2 (Allowlist RSS Feeds)**: Configurable server-side RSS collector with the 9 verified feeds across World, Business, Technology, Science & Space, Climate & Environment, Culture, and Sports (BBC News, NASA, Le Monde English). Bounded timeouts (5s), content sanitization, XML parsing, deduplication, and isolated error boundaries ensure any single feed failure does not halt edition delivery.
- **Confirmed Decision 3 (PDF Architecture & Viewer)**: In-browser interactive newspaper PDF previewer alongside instant PDF download. Both render from the exact same immutable `edition_items` snapshot using a clean print-ready broadsheet layout, with page turn navigation, zoom, and direct download stream.
- **Confirmed Decision 4 (AI Grounding Policy)**: Gemini (`gemini-3.8-flash`) acts strictly on supplied publisher excerpt/source text to generate structured summaries, 2–3 key takeaways, and category tags. If source text is sparse or Gemini is unreachable, clean publisher excerpts and direct source links are displayed with clear attribution.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces endless doomscrolling with a single, finite, beautifully typeset morning paper delivered once a day according to the reader's schedule and reading time (5, 10, or 20 minutes).
- **Target Audience**: Discerning readers, knowledge workers, and researchers who want to start their day informed without anxiety or distraction.
- **Core Promise**: *"A little perspective. A world of possibility. Your morning, made personal."*
- **Key Value**: Clear beginning and end, genuine source attribution with direct links to publishers, transparent explanations ("Why this story?"), adaptive personalization from explicit feedback, and matching broadsheet PDF print edition.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Welcome & Onboarding**:
   - *Step 1 (Interests)*: Grid selection of core topics (Technology, Science, Climate, Business, World, Culture, Sports) + tag input for specific queries (e.g. "AI tools", "space exploration").
   - *Step 2 (Morning Routine)*: Reader name (optional), reading budget (5 min / ~5 stories, 10 min / ~8 stories, 20 min / ~12 stories), timezone detection, delivery time (e.g. 7:00 AM), and serendipity toggle ("Surprise me with one story outside my usual interests").
   - *Step 3 (First Edition Preparation & Account)*: Option for quick guest exploration or Supabase sign-in, preference summary, and "Make my paper" action with honest, multi-stage loading progress (*Collecting recent stories* → *Choosing what matters to you* → *Preparing your edition*).
2. **Today's Paper (The Front Page)**:
   - Traditional newspaper masthead with Daybreak sunrise icon, issue date, volume, and personalized greeting (*"Good morning, Sara. A little perspective for your day."*).
   - Primary action strip: "Preview newspaper" and "Download PDF".
   - "Today at a glance" curation summary and reading time estimate.
   - Lead story with primary photo, large serif headline, concise source brief, and "Why this story?" disclosure.
   - 2-column or 3-column organized secondary sections (Technology, Science, Climate, etc.) and a dedicated "A Little Discovery" card when enabled.
   - Real-time search and topic filter tabs within the day's edition.
   - Closing ritual: **"Three things to take into today"** linked directly to source articles, followed by a private reflection prompt: *"What is one thing you want to remember?"* with account save.
3. **Story Reader Dialog**:
   - Clean distraction-free reading overlay.
   - Publisher attribution, verified timestamp, source-grounded brief, supported key takeaways, and prominent *"Read original article at [Publisher] ↗"*.
   - Reader action controls: Save/Bookmark, Skip from view (with instant Undo toast), "More like this" (+0.3 weight), and "Less like this" (-0.3 weight).
4. **Archive & Saved**:
   - Archive: chronological list of past immutable editions with issue dates, lead headlines, story counts, reopening, and matching PDF access.
   - Saved: bookmarked stories library with search, topic filtering, removal with Undo, and original source links.
5. **Your Interests & Learned Preferences**:
   - Manage explicit topic subscriptions and specific keywords.
   - Transparent inspection table of learned preference signals (e.g. "Climate: Growing interest — You've read more climate stories lately").
   - "Reset learned preferences" button that restores baseline without wiping explicit topics or saved papers.
6. **Newspaper PDF Preview & Download**:
   - In-browser viewer with page flip controls, zoom, and fullscreen.
   - Generated from the identical immutable snapshot so stories, order, and takeaways match the web edition 1:1.

### Visual Identity & Theme Tokens
- **Background**: Archival warm paper `#F7F5EF` with subtle limestone framing.
- **Ink / Typography**: Antique charcoal `#252B27` and museum stone `#5A6258`.
- **Accents**: Editorial terracotta `#B65B3D` (primary actions & highlights) and soft sage `#7D8B72` (discovery, nature, learning indicators).
- **Typography**:
  - *Headlines & Masthead*: Serif font family (`font-serif`, Playfair Display / Georgia / Cormorant) with balanced headline wrapping (`text-wrap: balance`).
  - *Controls & Metadata*: Clean contemporary sans-serif (`font-sans`, Plus Jakarta Sans / Inter style) with tracked uppercase kickers (`text-xs uppercase tracking-wider`).
- **Layout Restraint**:
  - Zero-pill discipline: unboxed text metadata with clean `·` dividers.
  - No decorative status dots, no AI buzzword meters, no mechanical `//` comments.
  - Strict 3-zone Top Bar Contract: Brand wordmark — Navigation links (`Today`, `Archive`, `Saved`, `Your interests`) — Account/Sign-in trigger.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Dual-Mode Persistence (Embedded Store + Supabase SQL)**
  - *Chosen Approach*: The Express backend boots with an in-memory & file-backed transactional store implementing the exact Supabase schema (profiles, user_interests, sources, articles, editions, edition_items, interactions, saved_articles, reflections). If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured in `.env`, operations proxy to Supabase PostgreSQL with Row Level Security.
  - *Why*: Allows immediate live operation, judging, and review without blocking on third-party cloud credential setup, while maintaining full production-grade database migrations and SQL schemas.
- **Decision 2: RSS Allowlist Caching & Error Isolation**
  - *Chosen Approach*: Server maintains a persistent allowlist registry. Feeds are polled with 5s timeouts and 1MB size limits. Articles are sanitized, deduplicated by canonical URL and title hash, and indexed in the shared library.
  - *Why*: Prevents re-fetching the same remote XML on every reader request and guarantees that if Le Monde or BBC has transient downtime, the edition still compiles seamlessly from other available sources with an honest banner (*"Some publishers are unavailable. Your paper includes 6 available stories."*).
- **Decision 3: Transparent Ranking Algorithm**
  - *Chosen Approach*: Composite score:
    $$\text{Score} = w_{\text{topic}} \cdot \text{TopicMatch} + w_{\text{kw}} \cdot \text{KeywordMatch} + w_{\text{fresh}} \cdot \text{Recency} + w_{\text{learned}} \cdot \text{FeedbackDelta} - \text{Penalty}_{\text{repeat}}$$
    Weights: Explicit Topic = 0.35, Keywords = 0.25, Freshness = 0.20, Learned Feedback = 0.20. Publisher diversity cap restricts any single source to $\le 35\%$ of an edition.
  - *Why*: Predictable, explainable, and produces distinctly different papers for different reader interests without opaque black-box drift.
- **Decision 4: In-Browser Newspaper PDF Viewer & Downloader**
  - *Chosen Approach*: A dedicated visual PDF layout engine on the server and client that renders multi-column print-ready pages, accompanied by a PDF preview modal and one-click PDF download stream.
  - *Why*: Delivers the tactile satisfaction of a physical newspaper while honoring the hackathon requirement that web edition and PDF snapshot never diverge.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Daybreak Frontend (React 19)                    │
│  ┌───────────────┐ ┌────────────────┐ ┌───────────────┐ ┌────────────┐ │
│  │ Onboarding    │ │ Today's Paper  │ │ Story Reader  │ │ PDF Viewer │ │
│  │ (3-Step Form) │ │ (Front Page)   │ │ Modal / Brief │ │ & Download │ │
│  └───────┬───────┘ └───────┬────────┘ └───────┬───────┘ └──────┬─────┘ │
│          │                 │                  │                │       │
│  ┌───────▼─────────────────▼──────────────────▼────────────────▼─────┐ │
│  │                     API Service & Session State                   │ │
└──────────┬─────────────────────────────────────────────────────────────┘
           │ HTTP API (/api/*)
┌──────────▼─────────────────────────────────────────────────────────────┐
│                       Express 4 Backend Server                         │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │ Feeds Collector         │  │ Gemini Grounded Synthesis           │  │
│  │ - 9 Allowlist Feeds     │  │ - Model: gemini-3.8-flash           │  │
│  │ - Fast XML RSS Parser   │  │ - Briefs, Takeaways, Classification │  │
│  │ - Deduplication & Cache │  │ - Strict Excerpt-Only Grounding     │  │
│  └──────────┬──────────────┘  └──────────────────┬──────────────────┘  │
│             │                                    │                     │
│  ┌──────────▼────────────────────────────────────▼──────────────────┐  │
│  │ Edition Builder & Ranking Engine                                 │  │
│  │ - Topic & Keyword Scoring       - Publisher Diversity Balancing  │  │
│  │ - Feedback Deltas (+0.3 / -0.3) - Timezone-aware snapshot freeze │  │
│  └──────────────────────────┬───────────────────────────────────────┘  │
│                             │                                          │
│  ┌──────────────────────────▼───────────────────────────────────────┐  │
│  │ Persistence Adapter: Dual Mode                                   │  │
│  │ - Embedded JSON/SQLite Store (Default Zero-Config)               │  │
│  │ - Supabase PostgreSQL + Auth (When SUPABASE_URL configured)      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Database Entities & Snapshot Integrity
1. `profiles`: `id`, `display_name`, `reading_duration` (5, 10, 20), `timezone`, `delivery_time`, `discovery_enabled`, `created_at`.
2. `user_interests`: `user_id`, `topic` (Technology, Science, Climate, Business, World, Culture, Sports), `weight`, `is_explicit`.
3. `sources`: `id`, `name`, `url`, `category`, `is_active`, `last_fetched_at`, `status`.
4. `articles`: `id`, `canonical_url`, `publisher`, `headline`, `published_at`, `raw_excerpt`, `brief_summary`, `takeaways` (JSON array), `topics` (JSON array), `image_url`.
5. `editions`: `id`, `user_id`, `edition_date`, `revision`, `story_count`, `reading_time_minutes`, `status`, `recap_takeaways` (JSON array), `reflection_note`.
6. `edition_items`: `id`, `edition_id`, `article_id`, `sort_order`, `section_name`, `headline`, `brief_summary`, `selection_reason`, `publisher`, `source_url`.
7. `interactions`: `user_id`, `article_id`, `action` (`more_like_this`, `less_like_this`, `save`, `skip`, `read`), `created_at`.
8. `reflections`: `id`, `user_id`, `edition_id`, `note`, `created_at`.

---

## 5. Verification & Testing Plan

1. **Dual Profile Differentiation Test**: Generate an edition for Reader A (Technology + Science) and Reader B (Business + Sports). Confirm zero overlap in primary headlines.
2. **Feed Resilience Test**: Intentionally simulate a timeout on one feed URL. Confirm the edition still compiles with the remaining 8 feeds and renders the warning banner cleanly without throwing an unhandled exception.
3. **Feedback & Learning Test**: Apply "More like this" to a Climate story and "Less like this" to a Gadgets story. Trigger a fresh edition revision and verify the change in topic distribution and explanation string.
4. **Snapshot & PDF Matching Test**: Inspect the web edition item IDs and sort order, open the in-browser PDF previewer, and confirm identical title, publisher, and ordering.
5. **Archive Immutability Test**: Verify that saving a new edition or changing user preferences leaves previously generated editions untouched.
6. **Mobile Responsive & Accessibility Test**: Test single-column layout on 375px viewport, keyboard navigation on reader modals, and high contrast compliance.
