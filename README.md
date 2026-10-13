# Which Sub Is Worth It?

An open tracker for the OSS community that answers one question: **how much work does each AI subscription actually get done per week?**

A subscription's value depends on two things:

1. **How many API dollars' worth of usage it covers per week.** These are community estimates.
2. **How efficiently each model turns those dollars into finished work.** This is measured by [Artificial Analysis](https://artificialanalysis.ai/leaderboards/models) as *cost per Intelligence Index task* at every reasoning effort.

```
tasks per week = weekly $ value ÷ $ per AA Intelligence Index task
```

Open `index.html` in a browser, or serve the folder with GitHub Pages. There is no build step.

## What's tracked

| Plan | Weekly API value (estimate) | Models |
|---|---|---|
| Claude Max 20x | ~$10,000 | Claude Opus 5.5, Claude Sonnet 5.5 at full value. Claude Fable 5.1 at the same rate, but it can use only 50% of the weekly limits (~$5,000). |
| OpenAI Pro 20x | ~$1,000 on GPT-6 Sol and GPT-6.1 Sol (same pricing), ~$1,400 on GPT-6 Astra at full limits. The limit-cut switch shows the same week at 50% (adjustable). | Limits are weighted differently per model. |

Each model is tracked at low, medium, high, xhigh and max effort. For each one the page records the AA Intelligence Index (v4.3.2), cost per task, output speed and list price.

## What the page shows

- **Sticky control bar.** Section navigation that tracks where you are, a live Claude vs. OpenAI scoreboard, a quality-bar slider that works from anywhere on the page, and a light/dark toggle.
- **Scenarios.** One-click presets (Volume first, Balanced, Hard problems, Long agent runs), each showing its current winner.
- **Quality-bar meter + week at a glance.** Pick a minimum Intelligence Index and see which plan finishes more tasks. A unit chart shows a week of work as squares that animate as you change settings. Pick a minimum Intelligence Index and see which plan finishes more tasks, and with which model and effort.
- **Usage at each reasoning effort.** A grouped bar chart of tasks/week for Opus 5.5 vs GPT-6.1 Sol at low, medium, high and xhigh, with the lead at each effort.
- **Before / after the OpenAI limit cut.** A switch that recomputes the whole page with full or cut OpenAI limits, a slider for the cut size, winner strips for both states, and a table of flipped scores.
- **Your assumptions.** Sliders with exact-entry boxes for each plan's weekly value, the Fable limit cap and your task size (how many AA tasks one of your tasks is worth). Toggle models in or out and reset to defaults. Settings are remembered in your browser.
- **Intelligence vs. tasks/week scatter.** Each model's effort curve, with the Pareto frontier ringed. Click a legend entry to hide a model. Points glide to new positions as you change assumptions. Click a point to pin its details, set it as your bar, or send it to the head-to-head.
- **"Does Sol's efficiency make up for it?"** The best tasks/week each plan can reach at every quality bar, with a computed summary of which plan leads where. Hover to compare, click to set the bar.
- **Build your week.** Split one shared weekly budget between a routine model and a hard-task model per plan. It respects the Fable limit cap and shows how the weekly limit is used.
- **Head to head.** Put any two options side by side (intelligence, tasks/week, cost, speed, points per dollar) with the winner marked, plus a swap button.
- **Sortable ledger.** Every model and effort ranked by tasks/week, score, $/task, speed, or index points per dollar. Filter by plan, hover a row to find it on the scatter, and use the A/B buttons to load rows into the head-to-head.

Code: `index.html` (layout and styles), `app.js` (rendering and interaction), `data.js` (all numbers).

## Headline (snapshot 2026-10-13): Claude Max 20x at ~$10,000/week vs GPT-6.1 Sol at ~$1,000/week

Tasks finished per week if you run one effort level all week (Artificial Analysis cost per task):

| Effort | Claude Opus 5.5 | GPT-6.1 Sol | Lead |
|---|---|---|---|
| low | 18,182 (index 42) | 7,692 (index 34) | Opus 2.36× |
| medium | 7,463 (index 51) | 4,762 (index 44, estimated) | Opus 1.57× |
| high | 5,495 (index 54) | 3,448 (index 49, estimated) | Opus 1.59× |
| xhigh | 2,890 (index 56) | 2,564 (index 51) | Opus 1.13× |

- At these values, Claude Max 20x finishes more tasks at every quality bar from 34 to 58, and at a higher score at every effort level.
- At equal quality (index 51), Opus 5.5 medium finishes ~7,463 tasks/week against GPT-6.1 Sol xhigh's ~2,564, a lead of 2.9×.
- GPT-6.1 Sol is still the cheapest per task ($0.39 at xhigh vs $1.34 for Opus medium). The 10× gap in weekly value is what decides it.
- GPT-6.1 Sol medium and high are not yet published by Artificial Analysis. They are estimated by averaging along the published curve and marked "est." on the page.

## Contributing

All numbers live in [`data.js`](data.js), with an Artificial Analysis source link per row. To fix a value, fill a gap, or add a model or plan, edit that file and open a PR with a source.

Known gaps: Sonnet 5.5 xhigh (all metrics), GPT-6.1 Sol medium and high (estimated until AA publishes them), Fable 5.1 medium cost, GPT-6 Astra xhigh cost, and several output speeds.

## Caveats

- An AA task is a benchmark task, not your task. Compare ratios, not absolute counts.
- Weekly plan values are estimates and change when vendors change limits.
- The rankings assume one model for the whole week. Use Build your week to split the budget.

Not affiliated with Anthropic, OpenAI, or Artificial Analysis.
