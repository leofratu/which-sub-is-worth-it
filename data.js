// Which Sub Is Worth It — source data.
// Edit this file to update numbers; index.html recomputes everything from it.
//
// Scores: Artificial Analysis Intelligence Index v5 (9 evals).
// cost  = AA "cost per Intelligence Index task" in USD at list API prices.
// speed = AA median output tokens/second. null = not published / not found.
// Snapshot taken 2026-10-28. Please open a PR with a source link if a value moves.

window.WSIWI_UPDATED = "2026-10-29";

// Every plan we track, with the weekly API-equivalent value it delivers at full usage.
// Figures are community estimates for current, non-grandfathered plans unless a row says
// otherwise. Only the `claude` and `openai` rows below feed the page; the rest are kept here
// as the reference for tier-to-tier comparisons (a 20x tier lands near 2x its 5x/10x tier).
window.WSIWI_PLANS = [
  { id: "claude-max-20x",         vendor: "Anthropic", name: "Claude Max 20x",                weekly: 2500, range: [1600, 2500], grandfathered: false, page: "claude",
    note: "Current plan. One full week on Opus 5.5, Sonnet 5.5 or Haiku 5.5." },
  { id: "claude-max-5x",          vendor: "Anthropic", name: "Claude Max 5x",                 weekly: 1250, range: [1250, 1250], grandfathered: false,
    note: "Current plan. Half the 20x limits, so halve every Claude number." },
  { id: "chatgpt-pro-10x",        vendor: "OpenAI",    name: "ChatGPT Pro 10x ($200)",        weekly: 625,  range: [600, 650],   grandfathered: false,
    note: "Current $200 tier. Same price as the legacy 20x, roughly half the value." },
  { id: "chatgpt-pro-legacy-20x", vendor: "OpenAI",    name: "ChatGPT Pro legacy 20x ($200)", weekly: 1262, range: [1262, 1262], grandfathered: true,
    note: "Grandfathered: existing subscribers keep double the 10x limits at the same price." },
];

// Weekly API-dollar value each subscription delivers at full usage.
// These are community estimates, not vendor figures. Adjustable on the page.
window.WSIWI_SUBS = {
  claude: {
    name: "Claude Max 20x",
    vendor: "Anthropic",
    weeklyValue: 2500,        // Sonnet and Haiku estimate: one full week of the plan
    opusWeeklyValue: 2500,    // Opus 5.5 estimate: same weekly plan value, higher per-token price
    weeklyRange: [1600, 2500],
    fableShare: 0.5,          // Fable 5.1 bills at the same rate but may only use 50% of weekly limits
  },
  openai: {
    name: "ChatGPT Pro 20x",
    vendor: "OpenAI",
    // Different models draw on limits with different weights, so value differs per model.
    // Modelled at the legacy 20x level (~$1,200/week), the higher of the two $200 tiers;
    // the current 10x tier is about half that (~$600-650).
    weeklyValueByModel: { "gpt-6-sol": 1200, "gpt-6-1-sol": 1200, "gpt-6-astra": 1400 },  // Editable weekly estimates
  },
};

const AA = "https://artificialanalysis.ai/models/";

window.WSIWI_MODELS = [
  {
    id: "claude-opus-5-5", name: "Claude Opus 5.5", short: "Opus 5.5", sub: "claude",
    shape: "circle", price: { in: 4, out: 20 },
    variants: [
      { effort: "low",    ii: 35, cost: 0.98, speed: 86, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: 48, cost: 2.45, speed: 83, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: 52, cost: 3.46, speed: 84, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: 57, cost: 6.05, speed: 85,   src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: 58, cost: 10.04, speed: 98, src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
  {
    id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", short: "Sonnet 5.5", sub: "claude",
    shape: "square", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: 25, cost: 0.51, speed: 116,  src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: 30, cost: 0.78, speed: 114, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: 41, cost: 1.64, speed: 119,    src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: 50, cost: 4.09, speed: 118, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: 54, cost: 10.02, speed: 138,   src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
  {
    // Released 2026-10-07. $0.10 / $0.50 per 1M tokens for prompts up to 100K tokens
    // ($0.50 / $2.50 above that), billed against Claude Max limits at the same API rate.
    id: "claude-haiku-5-5", name: "Claude Haiku 5.5", short: "Haiku 5.5", sub: "claude",
    shape: "triangle", price: { in: 0.1, out: 0.5 },
    variants: [
      { effort: "low",    ii: 19, cost: 0.04, speed: 186, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: 25, cost: 0.09, speed: 181, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: 30, cost: 0.16, speed: 191, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: 34, cost: 0.25, speed: 196, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: 36, cost: 0.41, speed: 241, src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
  {
    id: "claude-fable-5-1", name: "Claude Fable 5.1", short: "Fable 5.1", sub: "claude",
    shape: "diamond", price: { in: 10, out: 50 },
    variants: [
      { effort: "low",    ii: 38, cost: 4.49, speed: 62, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: 43, cost: 5.58, speed: 65, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: 47, cost: 7.56, speed: 62, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: 50, cost: 10.89, speed: 66,   src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: 49, cost: 13.04, speed: 66,   src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
  {
    id: "gpt-6-sol", name: "GPT-6 Sol", short: "GPT-6 Sol", sub: "openai",
    shape: "circle", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: null, cost: null, speed: null, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: null, cost: null, speed: null, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: null, cost: null, speed: null, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: null, cost: null, speed: null,   src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: null, cost: null, speed: null, src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
  {
    // Same $2/$10 pricing as GPT-6 Sol, so it shares Sol's weekly value.
    // All effort variants below are published v5 measurements.
    id: "gpt-6-1-sol", name: "GPT-6.1 Sol", short: "GPT-6.1 Sol", sub: "openai",
    shape: "diamond", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: 35, cost: 0.16, speed: 67,   src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: 46, cost: 0.36, speed: 66, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: 50, cost: 0.59, speed: 70, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: 52, cost: 0.76, speed: 71, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: 55, cost: 1.27, speed: 83, src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
  {
    id: "gpt-6-astra", name: "GPT-6 Astra", short: "GPT-6 Astra", sub: "openai",
    shape: "square", price: { in: 10, out: 50 },
    variants: [
      { effort: "low",    ii: 43, cost: 1.42, speed: 58, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "medium", ii: 51, cost: 2.73, speed: 64, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "high",   ii: 55, cost: 3.24, speed: 63, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "xhigh",  ii: 55, cost: 3.66, speed: 69, src: "https://artificialanalysis.ai/leaderboards/models" },
      { effort: "max",    ii: 57, cost: 6.24, speed: 73, src: "https://artificialanalysis.ai/leaderboards/models" },
    ],
  },
];
