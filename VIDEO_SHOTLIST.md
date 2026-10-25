# AgentDate — Official Video Demo Shotlist & Recording Guide
**Target Duration:** 2 minutes 55 seconds (≤ 3:00 competition limit)  
**Project:** AgentDate — Autonomous Agentic Dating Site  
**AI Engine:** Google Gemini 2.5 Flash  
**Public Demo URL:** https://agentdate.onrender.com (or local `http://localhost:3001`)  
**Assets Location:** `video-assets/`

---

## ⏱️ Video Timeline Breakdown

### 🎬 Scene 1: Introduction & Vision
* **Timestamp:** `00:00 – 00:15` (15s)
* **Screen:** Homepage (`http://localhost:3001/` or public URL)
* **Visual Action:**
  - Show the dark glassmorphic landing page with animated glowing orb and stats pills (`25 agents loaded`, `300 dates completed`, `✓ Gemini 2.5 Flash ready`).
  - Smooth pan over "Agents Date. You Watch."
* **Voiceover / Narration:**
  > "Welcome to AgentDate — the autonomous matchmaking system where AI agents date on your behalf. Instead of humans swiping endlessly on superficial bios, AgentDate extracts deep behavioral signals from public LinkedIn and Instagram profiles, constructs psychological digital twins using Gemini 2.5 Flash, and lets them date in multi-turn simulated conversations."
* **Supporting Asset:** `video-assets/01_homepage.png`

---

### 🎬 Scene 2: Profile Ingestion & 25-Person Bundled Dataset
* **Timestamp:** `00:15 – 00:45` (30s)
* **Screen:** Homepage "Add a Person" form & "Load 25 Real People" section
* **Visual Action:**
  - Demonstrate pasting a LinkedIn URL (`https://linkedin.com/in/username`) and Instagram URL (`https://instagram.com/username`).
  - Click "Create Agent Profile" — show the real-time Server-Sent Events status pills (`🔗 Reading LinkedIn...`, `📸 Instagram Analysis...`, `🧠 AI analyzing...`).
  - Highlight the "Load 25 Real Public Figures" demo feature featuring verified tech figures (Sam Altman, Lex Fridman, Sundar Pichai, Tim Ferriss).
* **Voiceover / Narration:**
  > "Adding a person takes two URLs: LinkedIn for career trajectory and intellectual focus, plus Instagram for lifestyle, aesthetic taste, and social energy. For judges and immediate testing, AgentDate ships with a pre-analyzed dataset of 25 prominent figures, fully seeded and ready without any manual setup."
* **Supporting Asset:** `video-assets/01_homepage.png`, `video-assets/02_profiles_25_people.png`

---

### 🎬 Scene 3: Analyzed Profile Deep Dive & Evidence Provenance
* **Timestamp:** `00:45 – 01:20` (35s)
* **Screen:** Profiles Grid (`/profiles`) & Individual Profile Detail (`/profiles/:id`)
* **Visual Action:**
  - Click on an analyzed profile (e.g. Sam Altman or Lex Fridman).
  - Highlight the synthesized psychological profile: Personality archetype, Tagline, Dating Bio, Communication Style, Love Language, Core Values, and Dealbreakers.
  - Scroll down to show the **Source Evidence & Provenance Section**: verified LinkedIn career milestones, Instagram bio signals, and raw scraped signals.
* **Voiceover / Narration:**
  > "Every profile is transparent and grounded in evidence. Here in Sam's profile, Gemini synthesized his communication style — direct, visionary, seeking ambitious partners — with clear citations back to his career trajectory and public posts. Nothing is fabricated from thin air; every persona trait traces back to verified source data."
* **Supporting Asset:** `video-assets/03_profile_detail_evidence.png`

---

### 🎬 Scene 4: Real-Time Dual-Agent Dating Simulation
* **Timestamp:** `01:20 – 02:15` (55s)
* **Screen:** Live Dating Arena (`/dating`)
* **Visual Action:**
  - Select two agents from the selector dropdowns (e.g., Person A and Person B).
  - Click "Start Live AI Date".
  - Watch the chat interface stream genuine multi-turn conversational turns live via Server-Sent Events (SSE).
  - Show agents discussing intellectual passions, work-life balance, and philosophical questions.
  - Watch the real-time scoring evaluation appear upon conclusion: Compatibility Score (%), Verdict, and 4D Breakdown (Chemistry & Sparks, Values Alignment, Communication Fit, Lifestyle Match), plus an AI-Recommended First Date idea.
* **Voiceover / Narration:**
  > "Now for the core magic: the Live Dating Arena. When two agents meet, they engage in an autonomous, 10-turn dialogue powered by Gemini 2.5 Flash. Watch how each agent maintains persona consistency, tests values, and responds authentically. Immediately upon date completion, the engine calculates a 4-dimensional compatibility score across chemistry, values, communication, and lifestyle, generating a bespoke first date itinerary."
* **Supporting Asset:** `video-assets/04_live_dating_simulation.png`

---

### 🎬 Scene 5: Multi-Dimensional Rankings & Match Explanations
* **Timestamp:** `02:15 – 02:50` (35s)
* **Screen:** Rankings Leaderboard (`/rankings`)
* **Visual Action:**
  - Navigate to the Rankings page.
  - Show the sorted list of people with their top recommended matches.
  - Expand a match to show the 4D compatibility bars, match grade badge (`A+`, `A`, `B`), and AI-generated compatibility rationale.
  - Demonstrate instant search and filter across the 300+ pre-evaluated pairings.
* **Voiceover / Narration:**
  > "In the Rankings view, every user sees their optimal matches ranked by multi-dimensional compatibility. Over 300 unique pairings and 600 directional ratings have been pre-computed across our 25-person network. Users don't get arbitrary percentages; they get actionable psychological explanations of why two people complement or challenge each other."
* **Supporting Asset:** `video-assets/05_compatibility_rankings.png`

---

### 🎬 Scene 6: Outro & Submission Summary
* **Timestamp:** `02:50 – 02:55` (5s)
* **Screen:** Closing title slide / Homepage footer
* **Visual Action:**
  - Display project logo, GitHub link, and Live Demo URL.
  - Show legal disclosure: *"All dating conversations are autonomous AI simulations for demonstration."*
* **Voiceover / Narration:**
  > "AgentDate: AI agents that date on your behalf. Try the live demo today or inspect the open-source code on GitHub. Thank you!"

---

## 🎥 Recording Checklist
- [x] Resolution: 1920x1080 (1080p, 60fps or 30fps)
- [x] Audio: Clean microphone input with light background audio
- [x] Cursor: Smooth mouse movements, hover over key cards and badges
- [x] Zero Localhost references visible in production recording
- [x] Walkthrough backup video available at `video-assets/walkthrough_recording.webp`
