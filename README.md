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

Weekly API-equivalent value at full usage. Figures are community estimates for current,
non-grandfathered plans unless the row says otherwise.

| Plan | Weekly API value (estimate) | Grandfathered? | On the page |
|---|---|---|---|
| Claude Max 20x | $1,600–$2,500 (default **$2,500**) | No | Yes, the Claude budget. Runs Claude Opus 5.5, Sonnet 5.5 and Haiku 5.5 at full value; Claude Fable 5.1 bills at the same rate but can use only 50% of the weekly limits (~$1,250). |
| Claude Max 5x | ~$1,250 | No | Reference tier only. Half the 20x limits, so halve every Claude number below. |
| ChatGPT Pro 10x ($200) | ~$600–$650 | No | Yes, as the 50% position of the limit-cut switch. |
| ChatGPT Pro legacy 20x ($200) | ~$1,262 (default **$1,200** on Sol and 6.1 Sol, $1,400 on Astra) | Yes | Yes, the OpenAI budget at 100% limits. |

A 20x tier lands at roughly twice its vendor's 5x/10x tier, which is why the limit-cut switch
defaults to 50%: it turns a legacy 20x week into a current 10x week.

Each model is tracked at low, medium, high, xhigh and max effort. For each one the page records the AA Intelligence Index (v4.3.2), cost per task, output speed and list price.

## What the page shows

- **Sticky control bar.** Section navigation that tracks where you are, a live Claude vs. OpenAI scoreboard, a quality-bar slider that works from anywhere on the page, and a light/dark toggle.
- **Scenarios.** One-click presets (Volume first, Balanced, Hard problems, Long agent runs), each showing its current winner.
- **Quality-bar meter + week at a glance.** Pick a minimum Intelligence Index and see which plan finishes more tasks. A unit chart shows a week of work as squares that animate as you change settings. Pick a minimum Intelligence Index and see which plan finishes more tasks, and with which model and effort.
- **Usage at each reasoning effort.** A grouped bar chart (log scale) of tasks/week for Haiku 5.5, Opus 5.5 and GPT-6.1 Sol at low, medium, high and xhigh, with each Claude model's lead over 6.1 Sol.
- **Before / after the OpenAI limit cut.** A switch that recomputes the whole page with full or cut OpenAI limits, a slider for the cut size, winner strips for both states, and a table of flipped scores.
- **Your assumptions.** Sliders with exact-entry boxes for each plan's weekly value, the Fable limit cap and your task size (how many AA tasks one of your tasks is worth). Toggle models in or out and reset to defaults. Settings are remembered in your browser.
- **Intelligence vs. tasks/week scatter.** Each model's effort curve, with the Pareto frontier ringed. Click a legend entry to hide a model. Points glide to new positions as you change assumptions. Click a point to pin its details, set it as your bar, or send it to the head-to-head.
- **"Does Sol's efficiency make up for it?"** The best tasks/week each plan can reach at every quality bar, with a computed summary of which plan leads where. Hover to compare, click to set the bar.
- **Build your week.** Split one shared weekly budget between a routine model and a hard-task model per plan. It respects the Fable limit cap and shows how the weekly limit is used.
- **Head to head.** Put any two options side by side (intelligence, tasks/week, cost, speed, points per dollar) with the winner marked, plus a swap button.
- **Sortable ledger.** Every model and effort ranked by tasks/week, score, $/task, speed, or index points per dollar. Filter by plan, hover a row to find it on the scatter, and use the A/B buttons to load rows into the head-to-head.

Code: `index.html` (layout and styles), `app.js` (rendering and interaction), `data.js` (all numbers).

## Headline (snapshot 2026-10-29): Claude Max 20x at ~$2,500/week vs ChatGPT Pro at ~$1,200/week (legacy 20x) or ~$600/week (current 10x)

Tasks finished per week if you run one model at one effort level all week (Artificial Analysis cost per task; AA score in brackets):

| Effort | Claude Haiku 5.5 | Claude Opus 5.5 | GPT-6.1 Sol |
|---|---|---|---|
| low | 125,000 (29) | 4,545 (42) | 9,231 (34) |
| medium | 50,000 (34) | 1,866 (51) | 5,714 (44, est.) |
| high | 31,250 (38) | 1,374 (54) | 4,138 (49, est.) |
| xhigh | 20,833 (41) | 723 (56) | 3,077 (51) |

- At a $2,500 Claude week against a $1,200 Pro week the plans split the range instead of one running the table: Claude leads from index 28 to 43 on Haiku 5.5 efficiency, OpenAI leads from 44 to 52 on GPT-6.1 Sol, and Claude takes 53 and above back with Opus 5.5.
- At equal quality (index 51), GPT-6.1 Sol xhigh finishes ~3,077 tasks/week against Opus 5.5 medium's ~1,866, so OpenAI is ~1.65× ahead at the middle of the range.
- At the low end Haiku 5.5 is untouchable: at index 36, Haiku high does ~31,250 tasks/week against Sol medium's ~5,714 (~5.5×). At the same score of 34, Haiku medium is ~5.4× Sol low.
- Claude Haiku 5.5 (released 2026-10-07, $0.10 / $0.50 per 1M tokens) costs $0.02–0.21 per AA task, so every Haiku effort level sits on the frontier.
- Dropping to Claude Max 5x (~$1,250) halves every Claude number; the current ChatGPT 10x tier (~$600) halves OpenAI's, and OpenAI then only holds index 44, 48 and 49.
- Haiku 5.5's price is 5× higher above 100K-token prompts, which these AA averages don't reflect for long-context work.
- GPT-6.1 Sol medium and high are not yet published by Artificial Analysis. They are estimated by averaging along the published curve and marked "est." on the page.

## Contributing

All numbers live in [`data.js`](data.js), with an Artificial Analysis source link per row. To fix a value, fill a gap, or add a model or plan, edit that file and open a PR with a source.

Known gaps: Sonnet 5.5 xhigh (all metrics), GPT-6.1 Sol medium and high (estimated until AA publishes them), Fable 5.1 medium cost, GPT-6 Astra xhigh cost, and several output speeds.

## Caveats

- An AA task is a benchmark task, not your task. Compare ratios, not absolute counts.
- Weekly plan values are estimates and change when vendors change limits.
- The rankings assume one model for the whole week. Use Build your week to split the budget.

Not affiliated with Anthropic, OpenAI, or Artificial Analysis.
