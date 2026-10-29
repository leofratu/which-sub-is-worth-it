// Which Sub Is Worth It — source data.
// Edit this file to update numbers; index.html recomputes everything from it.
//
// Scores: Artificial Analysis Intelligence Index v4.3.2 (10 evals).
// cost  = AA "cost per Intelligence Index task" in USD at list API prices.
// speed = AA median output tokens/second. null = not published / not found.
// Snapshot taken 2026-09-29. Please open a PR with a source link if a value moves.

window.WSIWI_UPDATED = "2026-10-29";

// Every plan we track, with the weekly API-equivalent value it delivers at full usage.
// Figures are community estimates for current, non-grandfathered plans unless the row says
// otherwise. Only the `claude` and `openai` rows below feed the page; the rest are recorded
// here as the reference for tier-to-tier comparisons (a 20x tier lands near 2x its 5x/10x tier).
window.WSIWI_PLANS = [
  { id: "claude-max-20x",        vendor: "Anthropic", name: "Claude Max 20x",                 weekly: 2500, range: [1600, 2500], grandfathered: false, page: "claude",
    note: "Current plan. Whole week on Opus 5.5, Sonnet 5.5 or Haiku 5.5." },
  { id: "claude-max-5x",         vendor: "Anthropic", name: "Claude Max 5x",                  weekly: 1250, range: [1250, 1250], grandfathered: false,
    note: "Current plan. Half the 20x tiers' limits, matching ~2x scaling." },
  { id: "chatgpt-pro-10x",       vendor: "OpenAI",    name: "ChatGPT Pro 10x ($200)",         weekly: 625,  range: [600, 650],   grandfathered: false,
    note: "Current plan. Same $200 price as the legacy 20x, roughly half the value." },
  { id: "chatgpt-pro-legacy-20x", vendor: "OpenAI",   name: "ChatGPT Pro legacy 20x ($200)",  weekly: 1262, range: [1262, 1262], grandfathered: true,
    note: "Grandfathered: existing subscribers keep double the 10x limits at the same price." },
];

// Weekly API-dollar value each subscription delivers at full usage, as used by the page.
// These are community estimates, not vendor figures. Adjustable on the page.
window.WSIWI_SUBS = {
  claude: {
    name: "Claude Max 20x",
    vendor: "Anthropic",
    weeklyValue: 2500,        // ~$2,500 / week of API value across Opus 5.5, Sonnet 5.5 and Haiku 5.5 (estimate, Oct 2026)
    weeklyRange: [1600, 2500],
    fableShare: 0.5,          // Fable 5.1 bills at the same rate but may only use 50% of weekly limits
  },
  openai: {
    name: "ChatGPT Pro 20x",
    vendor: "OpenAI",
    // Different models draw on limits with different weights, so value differs per model.
    // Pro is modelled at the legacy 20x level (~$1,200 / week on Sol and 6.1 Sol), the higher of
    // the two $200 tiers; the current 10x tier lands at half that via cutScale.
    weeklyValueByModel: { "gpt-6-sol": 1200, "gpt-6-1-sol": 1200, "gpt-6-astra": 1400 },
    // Limit-cut scenario: share of the weekly limit left after the cut (0.5 = cut in half).
    // The page compares before (full limits) and after (these values × cutScale), i.e. the
    // legacy 20x week vs the current 10x week (~$600-650 on Sol).
    cutScale: 0.5,
  },
};

const AA = "https://artificialanalysis.ai/models/";

window.WSIWI_MODELS = [
  {
    id: "claude-opus-5-5", name: "Claude Opus 5.5", short: "Opus 5.5", sub: "claude",
    shape: "circle", price: { in: 4, out: 20 },
    variants: [
      { effort: "low",    ii: 42, cost: 0.55, speed: 80.9, src: AA + "claude-opus-5-5-low" },
      { effort: "medium", ii: 51, cost: 1.34, speed: 76.0, src: AA + "claude-opus-5-5-medium" },
      { effort: "high",   ii: 54, cost: 1.82, speed: 80.9, src: AA + "claude-opus-5-5-high" },
      { effort: "xhigh",  ii: 56, cost: 3.46, speed: 88,   src: AA + "claude-opus-5-5-xhigh" },
      { effort: "max",    ii: 58, cost: 5.98, speed: 96.6, src: AA + "claude-opus-5-5" },
    ],
  },
  {
    id: "claude-sonnet-5-5", name: "Claude Sonnet 5.5", short: "Sonnet 5.5", sub: "claude",
    shape: "square", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: 36, cost: 0.41, speed: 92.6,  src: AA + "claude-sonnet-5-5-low" },
      { effort: "medium", ii: 41, cost: 0.59, speed: 114.6, src: AA + "claude-sonnet-5-5-medium" },
      { effort: "high",   ii: 47, cost: 1.08, speed: 97,    src: AA + "claude-sonnet-5-5-high" },
      { effort: "xhigh",  ii: null, cost: null, speed: null, src: AA + "claude-sonnet-5-5-xhigh" },
      { effort: "max",    ii: 56, cost: 7.60, speed: 142,   src: AA + "claude-sonnet-5-5" },
    ],
  },
  {
    // Released 2026-10-07. $0.10 / $0.50 per 1M tokens for prompts up to 100K tokens
    // ($0.50 / $2.50 above that), billed against Claude Max limits at the same API rate.
    id: "claude-haiku-5-5", name: "Claude Haiku 5.5", short: "Haiku 5.5", sub: "claude",
    shape: "triangle", price: { in: 0.1, out: 0.5 },
    variants: [
      { effort: "low",    ii: 29, cost: 0.02, speed: null, src: AA + "claude-haiku-5-5-low" },
      { effort: "medium", ii: 34, cost: 0.05, speed: null, src: AA + "claude-haiku-5-5-medium" },
      { effort: "high",   ii: 38, cost: 0.08, speed: null, src: AA + "claude-haiku-5-5-high" },
      { effort: "xhigh",  ii: 41, cost: 0.12, speed: null, src: AA + "claude-haiku-5-5-xhigh" },
      { effort: "max",    ii: 43, cost: 0.21, speed: null, src: AA + "claude-haiku-5-5" },
    ],
  },
  {
    id: "claude-fable-5-1", name: "Claude Fable 5.1", short: "Fable 5.1", sub: "claude",
    shape: "diamond", price: { in: 10, out: 50 },
    variants: [
      { effort: "low",    ii: 47, cost: 2.37, speed: null, src: AA + "claude-fable-5-1-low" },
      { effort: "medium", ii: 50, cost: null, speed: null, src: AA + "claude-fable-5-1-medium" },
      { effort: "high",   ii: 51, cost: 3.91, speed: null, src: AA + "claude-fable-5-1-high" },
      { effort: "xhigh",  ii: 53, cost: 5.98, speed: 59,   src: AA + "claude-fable-5-1-xhigh" },
      { effort: "max",    ii: 53, cost: 7.63, speed: 70,   src: AA + "claude-fable-5-1" },
    ],
  },
  {
    id: "gpt-6-sol", name: "GPT-6 Sol", short: "GPT-6 Sol", sub: "openai",
    shape: "circle", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: 34, cost: 0.13, speed: 82.8, src: AA + "gpt-6-sol-low" },
      { effort: "medium", ii: 40, cost: 0.25, speed: null, src: AA + "gpt-6-sol-medium" },
      { effort: "high",   ii: 43, cost: 0.37, speed: 99.6, src: AA + "gpt-6-sol-high" },
      { effort: "xhigh",  ii: 44, cost: 0.53, speed: 83,   src: AA + "gpt-6-sol-xhigh" },
      { effort: "max",    ii: 48, cost: 1.06, speed: 89.8, src: AA + "gpt-6-sol" },
    ],
  },
  {
    // Same $2/$10 pricing as GPT-6 Sol, so it shares Sol's weekly value.
    // AA has published low, xhigh and max. Medium and high are estimated (est: true) by
    // averaging along the published curve, using GPT-6 Sol's effort-ladder shape:
    // medium sits 30% of the way from low to xhigh in cost and 60% in score, high 60% / 90%.
    id: "gpt-6-1-sol", name: "GPT-6.1 Sol", short: "GPT-6.1 Sol", sub: "openai",
    shape: "diamond", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: 34,   cost: 0.13, speed: 74,   src: AA + "gpt-6-1-sol-low" },
      { effort: "medium", ii: 44,   cost: 0.21, speed: null, est: true, src: AA + "gpt-6-1-sol-medium" },
      { effort: "high",   ii: 49,   cost: 0.29, speed: null, est: true, src: AA + "gpt-6-1-sol-high" },
      { effort: "xhigh",  ii: 51,   cost: 0.39, speed: null, src: AA + "gpt-6-1-sol-xhigh" },
      { effort: "max",    ii: 52,   cost: 0.72, speed: null, src: AA + "gpt-6-1-sol" },
    ],
  },
  {
    id: "gpt-6-astra", name: "GPT-6 Astra", short: "GPT-6 Astra", sub: "openai",
    shape: "square", price: { in: 10, out: 50 },
    variants: [
      { effort: "low",    ii: 46, cost: 0.82, speed: 54, src: AA + "gpt-6-astra-low" },
      { effort: "medium", ii: 50, cost: 1.54, speed: 54, src: AA + "gpt-6-astra-medium" },
      { effort: "high",   ii: 51, cost: 1.73, speed: 59, src: AA + "gpt-6-astra-high" },
      { effort: "xhigh",  ii: 52, cost: null, speed: 54, src: AA + "gpt-6-astra-xhigh" },
      { effort: "max",    ii: 53, cost: 3.26, speed: 64, src: AA + "gpt-6-astra" },
    ],
  },
];
