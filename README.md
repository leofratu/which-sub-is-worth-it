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
| Claude Max 20x | ~$2,200–2,300 | Claude Opus 5.5, Claude Sonnet 5.5 at full value. Claude Fable 5.1 at the same rate, but it can use only 50% of the weekly limits (~$1,125). |
| OpenAI Pro 20x | ~$1,300 on GPT-6 Sol, ~$1,400 on GPT-6 Astra | Limits are weighted differently per model. |

Each model is tracked at low, medium, high, xhigh and max effort. For each one the page records the AA Intelligence Index (v4.3.2), cost per task, output speed and list price.

## What the page shows

- **Quality-bar meter.** Pick a minimum Intelligence Index and see which plan finishes more tasks, and with which model and effort.
- **Your assumptions.** Sliders with exact-entry boxes for each plan's weekly value, the Fable limit cap and your task size (how many AA tasks one of your tasks is worth). Toggle models in or out and reset to defaults. Settings are remembered in your browser.
- **Intelligence vs. tasks/week scatter.** Each model's effort curve, with the Pareto frontier ringed. Click a legend entry to hide a model. Click a point to use its score as your quality bar.
- **"Does Sol's efficiency make up for it?"** The best tasks/week each plan can reach at every quality bar, with a computed summary of which plan leads where. Hover to compare, click to set the bar.
- **Build your week.** Split one shared weekly budget between a routine model and a hard-task model per plan. It respects the Fable limit cap and shows how the weekly limit is used.
- **Sortable ledger.** Every model and effort ranked by tasks/week, score, $/task, speed, or index points per dollar. Filter by plan; hover a row to find it on the scatter.

Code: `index.html` (layout and styles), `app.js` (rendering and interaction), `data.js` (all numbers).

## Headline (snapshot 2026-09-29)

- GPT-6 Sol is the volume king: Sol low finishes ~10,000 AA tasks/week on OpenAI Pro, and Sol max (index 48) ~1,226.
- Claude Max 20x wins once you need index 45 or higher. Opus 5.5 medium (index 51) finishes ~1,679 tasks/week and Opus 5.5 high (index 54) ~1,236. That beats Sol max on both intelligence and volume.
- Above index 53, only Claude has a model: Opus 5.5 xhigh/max or Sonnet 5.5 max.
- Fable 5.1 is the least efficient here. It has high per-token prices and only half the budget.

## Contributing

All numbers live in [`data.js`](data.js), with an Artificial Analysis source link per row. To fix a value, fill a gap, or add a model or plan, edit that file and open a PR with a source.

Known gaps: Sonnet 5.5 xhigh (all metrics), Fable 5.1 medium cost, GPT-6 Astra xhigh cost, and several output speeds.

## Caveats

- An AA task is a benchmark task, not your task. Compare ratios, not absolute counts.
- Weekly plan values are estimates and change when vendors change limits.
- The rankings assume one model for the whole week. Use Build your week to split the budget.

Not affiliated with Anthropic, OpenAI, or Artificial Analysis.
