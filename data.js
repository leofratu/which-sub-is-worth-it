// Which Sub Is Worth It — source data.
// Edit this file to update numbers; index.html recomputes everything from it.
//
// Scores: Artificial Analysis Intelligence Index v4.3.2 (10 evals).
// cost  = AA "cost per Intelligence Index task" in USD at list API prices.
// speed = AA median output tokens/second. null = not published / not found.
// Snapshot taken 2026-09-29. Please open a PR with a source link if a value moves.

window.WSIWI_UPDATED = "2026-09-29";

// Weekly API-dollar value each subscription delivers at full usage.
// These are community estimates, not vendor figures. Adjustable on the page.
window.WSIWI_SUBS = {
  claude: {
    name: "Claude Max 20x",
    vendor: "Anthropic",
    weeklyValue: 2250,        // ~$2,200–2,300 / week of API value across Opus 5.5 and Sonnet 5.5
    weeklyRange: [2200, 2300],
    fableShare: 0.5,          // Fable 5.1 bills at the same rate but may only use 50% of weekly limits
  },
  openai: {
    name: "OpenAI Pro 20x",
    vendor: "OpenAI",
    // Different models draw on limits with different weights, so value differs per model.
    weeklyValueByModel: { "gpt-6-sol": 1300, "gpt-6-1-sol": 1300, "gpt-6-astra": 1400 },
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
    // AA has published low, xhigh and max; medium and high are pending.
    id: "gpt-6-1-sol", name: "GPT-6.1 Sol", short: "GPT-6.1 Sol", sub: "openai",
    shape: "diamond", price: { in: 2, out: 10 },
    variants: [
      { effort: "low",    ii: 34,   cost: 0.13, speed: 74,   src: AA + "gpt-6-1-sol-low" },
      { effort: "medium", ii: null, cost: null, speed: null, src: AA + "gpt-6-1-sol-medium" },
      { effort: "high",   ii: null, cost: null, speed: null, src: AA + "gpt-6-1-sol-high" },
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
