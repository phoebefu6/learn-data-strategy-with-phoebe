# Agent brief - shared by every fan-out page of learn-data-strategy-with-phoebe

Filled 2026-10-29 from `~/.claude/skills/course-builder/references/agent-brief.template.md` by the
foundations lead. Internal build document: never link it from an audience page.

You are writing ONE static HTML session page. No servers, no npm. **If your target file already
exists on disk, do not write it; report that and stop.** Write the file, return its path and one
line of coverage. No HTML in your reply.

## Read first, in this order

1. The template page. Copy its structure, classes, SVG grammar and quiz markup EXACTLY, including
   how many options each question has (FOUR options, A to D):
   - Single track: `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-data-strategy-with-phoebe/courses/01-diagnosis-before-ambition.html`
   - The bench page, for how Keelson numbers are quoted: `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-data-strategy-with-phoebe/courses/03-the-first-three-bets.html`
2. The source map: every verified number, its evidence tier, per-session coverage, the seams. Use
   ONLY its numbers; never invent a statistic; if a fact is missing, teach the uncertainty.
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-data-strategy-with-phoebe/materials/official-course-map.md`
3. The stylesheet `:root` block for the palette tokens:
   `/Users/phoebe.fu/Documents/claude_work/github_repo/learn-data-strategy-with-phoebe/assets/style.css`

## Page skeleton (keep every component)

toolbar (crumb EXACTLY "learn-data-strategy-with-phoebe / Session N of 6" with the repo name linked
to ../index.html, #toggle-all, #zoom-toggle) · masthead (eyebrow "Learn Data Strategy with Phoebe ·
Session N of 6", h1 with one `<span class="accent">`, .sub, .chip-row with the level chip
(🟢 Foundations / 🟡 Core / 🟠 Deeper / 🔴 Capstone, matching the difficulty below), two
`.chip.audience`, `.chip.time` "45 min", .agenda a1-a4) · main.wrap · section#intro (Part 0: kicker,
.lede, .legend pills, .callout.win "★ What you walk out with tonight") · 3 Parts, each
`section.section#part-N` with section-kicker (klabel "Part N · covers ...", h2,
`.tag.concept "N min live"`), a `.lede`, ONE figure, `details.card` accordions (summary:
`.mode.live` or `.mode.self`, title, `.mini`, `.caret ▶`), at least one `.callout.example` with
`span.ex-pill` "Real world" on the page · section#demo-1 Build-along (kicker
`.tag.demo "★ 22 min · everyone builds"`, .lede, ONE figure, `.steps > .step`, each with a
`.prompt-box.good` carrying a `span.label`; the build adds one page to Keelson's strategy document,
see the outline below) · section#exercise Homework (ol, 4 items) · section#quiz (3 x
`.quiz-q data-answer="0-based"`, `p.qtext`, four `button.qopt` "A · ...", `p.qwhy`; one
`p.quiz-score` after the last) · section#official, h2 EXACTLY "What this session teaches, and where
it came from", `.covered > .covered-row` (pill solid ✓ / light ◐ + name + note), then the `.mono`
line EXACTLY "Every fact on this page, and its verification tier, is recorded in the course's
source map." · section.cheat#cheatsheet (h3 "Session N cheat sheet <span>· pin this</span>",
.grid-2 of six .cheat-item) · `.callout.next` with `.nx-pill` "Next session" (session 6: "Course
home" wording, linking ../index.html) · footer.pagefoot · `<script src="../assets/app.js?v=1">`.

Head: the template's social meta block with this page's own title/description/url (og:image stays
`https://phoebefu6.github.io/learn-data-strategy-with-phoebe/assets/og-cover.png`);
`<title>Session N · <Title> - learn data strategy with phoebe</title>`;
`<link rel="stylesheet" href="../assets/style.css?v=3">`. Nothing else external.

First `details.card` in the FIRST Part is `open`; no other. Sentence case headings. Warm
practitioner voice, concrete, never dry. Inside prompt-boxes escape `&` `<` `>`. 450 to 650 lines
is guidance about depth, never a target: never collapse whitespace, dissolve a list into a
paragraph, or drop a component to fit.

## Hard rules (a violation is rework)

- NEVER an em dash or en dash, anywhere (prose, code, aria-labels, comments). Hyphen only.
- No meta text: never "this course", "in this course", "the course teaches", "banned here". State
  the professional norm directly with its reason. The two exact estate phrases above are the only
  self-references; "session 5" cross-references are fine.
- Attribution "by Phoebe Fu". Never "built with" a tool.
- Every number comes from the map or is labelled constructed. For constructed data print "your
  numbers will differ", never invented outputs as if run. Keelson bench numbers: only the canon
  table in the map.
- Contested or missing evidence: teach the disagreement; never resolve what the literature has not.
  Folklore ("80 percent of data projects fail", "data is the new oil", CDO tenure numbers) is taught
  as folklore with its real trail (map F14, F15), never as evidence.
- Citations in the exact form of the map's appendix; anything marked REPORTED is "reported".
- NEVER "lottery" or "lotteries"; say the mechanism ("decided by row order", "arbitrary", "a
  random draw"). A verbatim quoted title in curly quotes is the only exception.
- Default to the English word. A Chinese term that is genuinely a name carries its English in
  brackets right after it, every occurrence.
- Titles, widget ids and class names must not collide with siblings. Banned: any title of
  learn-data-governance (incl. "The operating model + maturity"), learn-okr, learn-ai-leadership,
  learn-performance-management, learn-ai-hr, learn-ai-productivity; "A system you keep", "The
  one-page marketing plan", "Is it worth the time?", "Where your week actually goes". Grep
  `~/Documents/claude_work/github_repo/learn-*-with-phoebe/courses/*.html` before adding any new
  h2 you are unsure of. The `bt-` class prefix and `bets-` ids belong to the session 3 widget only.
- Light surfaces only. Brass `#C9A45C` is a FILL under dark ink, never text; never white text on
  brass. No dark panels.
- No real insurer, employer or client by name in the case. No salary or pay figures. Phoebe's own
  work, employers and journey never appear.
- Quiz answer letters must vary: page 01 uses B, D, A; page 03 uses C, A, D. Use these:
  02 = D, B, C · 04 = A, C, B · 05 = C, D, A · 06 = B, A, D.

## Figure grammar (hand-drawn, every figure)

Palette, ONLY these hexes (no invented greys): `#0F1A6B` navy (accent) · `#0A1150` deep navy ·
`#2B3A93` mid navy · `#C7CCEB` soft · `#EEF0FA` navy-50 · `#C9A45C` brass (contrast fill, the ONE
thing the figure is about) · `#F8F1E2` brass-50 · `#4A360C` brass-ink (bold contrast text) ·
`#161A33` ink · `#525773` muted · `#CBCEDD` faint · `#E5E7F0` hairline · `#FFFFFF` · universal reds
`#991B1B` `#FEF2F2` `#FCA5A5` only for a wrong-way panel.

- `<figure class="zoomable">` > `<svg viewBox="0 0 880 H" role="img" aria-label="the data, not the
  shape">` > `<defs>` + `<style>` + content, then `<figcaption>🔍 Click to zoom - takeaway</figcaption>`.
  Grow H, never W.
- Prefix unique per figure, used for every class and id: `f<session><letter>` (f2a, f2b, f2c, f2d
  for session 2; f4a... for session 4). Page 01 uses f1a-f1d and page 03 uses f3a-f3c.
- `<defs>` holds three things with the figure prefix P: a wobble filter `id="PSk"`
  (`feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="<int>"` +
  `feDisplacementMap scale="2.4" xChannelSelector="R" yChannelSelector="G"`, `x="-3%" y="-3%"
  width="106%" height="106%"`), a hachure pattern `id="PHc"` (7x7 userSpaceOnUse, rotate(-38), one
  `#0F1A6B` line, opacity .5), an open arrowhead `id="PAr"` (path `M1 1 L9 5 L1 9`, fill none,
  `#161A33` stroke 1.6). ALL shapes sit inside ONE `<g filter="url(#PSk)" fill="none"
  stroke="#161A33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">`; rects carry
  a tiny rotation (-4 to 4 degrees for hand-placed items, under 1 for panels). Fills: white,
  `#EEF0FA`, the hachure for "the pile" or "the data", and brass `#C9A45C` ONLY for the one thing the
  figure is about. One doodle anchor per figure, simple strokes, never a mascot. Text classes:
  `.PH` 800 12px ink heading · `.PL` 600 12px ink label · `.PS` 400 11px muted · `.PB` 800 11px
  `#4A360C` · `.PV` 800 16-20px `#0A1150` value · `.PW` 800 12px white on a NAVY fill only · `.PA`
  700 11px `#0F1A6B` axis caption · `.PN` 400 12px muted note. Hand-stacked items must not overlap
  as painted rects (the gate flags a pile).
- ALL `<text>` outside any filtered group, sans stack, never below 10.5px.
- Fit (owner: `diagram-kit.md`): max chars ≈ (box width - 20) / 7 at 12px, 6.4px/char at 11px;
  full-width note under 110 chars; 40px between neighbouring point labels; bottom note 22px below
  the last row, H clears it by 8px. No line, arrow or curve may cross a label. When in doubt,
  shorten.
- Floor: one figure per Part plus one in the build-along. Draw the MECHANISM (who reports to whom
  and where a decision is made, where money enters and which signal moves first, which bet blocks
  which), never a metaphor literally, never decoration.

## Voice and honesty

Every Part gets a real-world story: public national strategies (map F6-F10), the published
frameworks, or a plainly labelled familiar pattern ("a familiar pattern in any organisation").
Constructed cases say "constructed" on the page: Keelson Mutual and its people (Maya Okafor, new
CDO, 6 weeks in; Tom Reyes, COO and her sponsor; Priya Natarajan, head of claims; Ben Hale, chief
actuary; Elena Ruiz, chief risk officer). No market statistic for Keelson. Gartner figures are
"reported". Session 5 never computes NPV or ROI (planned business-cases course owns it).

## Cross-links (absolute URLs)

- Decision Intelligence (weighing options): https://phoebefu6.github.io/learn-decision-intelligence-with-phoebe/
- OKRs (goal-setting mechanics, session 5 value metrics): https://phoebefu6.github.io/learn-okr-with-phoebe/
- Data PMO (delivery, session 6 roadmap): https://phoebefu6.github.io/learn-data-pmo-with-phoebe/
- Strategic Thinking (generic strategy): https://phoebefu6.github.io/learn-strategic-thinking-with-phoebe/
- Data Product (building one): https://phoebefu6.github.io/learn-data-product-with-phoebe/
- Data Literacy (consuming numbers): https://phoebefu6.github.io/learn-data-literacy-with-phoebe/
- Data Governance (session 4 depth): https://phoebefu6.github.io/learn-data-governance-with-phoebe/
- Leadership and AI (org redesign): https://phoebefu6.github.io/learn-leadership-ai-with-phoebe/
- Planned, NO link: business cases and ROI; data monetisation.
- Hub: https://phoebefu6.github.io/learn-with-phoebe/

## Footer chain and session titles

01 Diagnosis before ambition → 02 What the data is for → 03 The first three bets → 04 Operating
model → 05 Funding and value tracking → 06 The strategy on a page.
Footer left: "Session N of 6 · learn-data-strategy-with-phoebe · by Phoebe Fu &nbsp;·&nbsp; 📚 <a href="https://phoebefu6.github.io/learn-with-phoebe/">Learn with Phoebe ↗</a>"
Footer right: "← Prev: <title>" and "Next: <title> →" (last page: "← Prev" and "Course home").

| N | File | Title (exact) | Difficulty |
|---|------|---------------|------------|
| 01 | courses/01-diagnosis-before-ambition.html | Diagnosis before ambition | 🟢 green, hand-authored |
| 02 | courses/02-what-the-data-is-for.html | What the data is for | green-yellow (🟡 Core chip, --diff #FBBF24 on the card) |
| 03 | courses/03-the-first-three-bets.html | The first three bets | 🟡 yellow, THE BENCH, hand-authored |
| 04 | courses/04-operating-model.html | Operating model | 🟠 orange |
| 05 | courses/05-funding-and-value-tracking.html | Funding and value tracking | 🟠 orange |
| 06 | courses/06-strategy-on-a-page.html | The strategy on a page | 🔴 red |

## One-line outlines for the fan-out pages

- **02 What the data is for.** Part 1 DalleMule and Davenport's offense and defense, read at the
  level the map allows (F3-F5: title, authors, four printed figures at source; definitions reported).
  Part 2 SSOT and MVOTs: one governed source, several fit-for-purpose versions, drawn as the
  mechanism (one SCV feeding claims, pricing and finance views). Part 3 placing an insurer on the
  dial: regulation pulls defense, competition pulls offense; why the dial moves over time.
  Build-along: place Keelson on the dial with evidence from session 1's diagnosis, then write a
  two-sentence ambition statement and test it against Rumelt's "goals are not strategy".
- **04 Operating model.** Part 1 centralised, hub-and-spoke, federated: what each optimises and
  where it breaks (draw where decisions and people sit). Part 2 the CDO reporting line: options and
  trade-offs, with the reported Gartner 36%-to-CEO figure (F11) taught as one survey, not a norm.
  Part 3 domain ownership and MINIMUM governance to ship three bets (critical data elements, an
  owner per bet's data, one decision forum), linking the governance course for depth; DAMA-DMBOK
  wheel as reported (F12). Build-along: Keelson's model choice + a RACI for CDQ, FTR, CFT.
- **05 Funding and value tracking.** Part 1 three funding models: central budget, chargeback, bet
  (venture-style staged) funding; who carries the risk in each. Part 2 leading against lagging value
  signals per bet (FTR: share of claims scored at first notice before referral rate moves), the
  reported Gartner 30% "cannot measure impact" (F11). Part 3 the board ask: one page, the range from
  session 3 (173 of 500 draws), no ROI maths (planned course). Build-along: fund CDQ, FTR, CFT and
  write two value metrics each, one leading and one lagging.
- **06 The strategy on a page.** Part 1 read the UK National Data Strategy (F6) and the US Federal
  Data Strategy (F7, F8) as worked material: what is diagnosis, policy, action in each. Part 2
  Singapore: no document titled a national data strategy exists (F9); the Government Data Strategy
  sits inside the Digital Government Blueprint (F10, reported); what that teaches about where data
  strategy lives. Part 3 sequencing, risks, and a comms cadence for the first 100 days. Build-along:
  Keelson's one-page strategy (kernel + three bets + model + funding + metrics) and a 100-day
  roadmap, assembled from sessions 1-5.
