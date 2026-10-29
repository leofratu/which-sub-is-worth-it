# Which Sub Is Worth It?

Open `index.html` in a browser. No build step is required.

The comparison uses Artificial Analysis Intelligence Index v5 scores, cost per task, and output speed from its leaderboard on 28 October 2026: https://artificialanalysis.ai/leaderboards/models

Weekly API-equivalent value at full usage. Figures are community estimates for current, non-grandfathered plans unless a row says otherwise.

| Plan | Weekly API value (estimate) | Grandfathered? | On the page |
|---|---|---|---|
| Claude Max 20x | $1,600–$2,500 (default **$2,500**) | No | Yes, for Opus 5.5, Sonnet 5.5 and Haiku 5.5. Fable 5.1 bills at the same rate but can use only half the weekly limit (~$1,250). |
| Claude Max 5x | ~$1,250 | No | Reference tier only. Half the 20x limits, so halve every Claude number. |
| ChatGPT Pro 10x ($200) | ~$600–$650 | No | Reference tier only. Current $200 plan, about half the legacy 20x. |
| ChatGPT Pro legacy 20x ($200) | ~$1,262 (default **$1,200** on Sol and 6.1 Sol, $1,400 on Astra) | Yes | Yes, the OpenAI budget. |

A 20x tier lands at roughly twice its vendor's 5x/10x tier, which is why Max 5x and Pro 10x are recorded as halved reference rows rather than separate page defaults. These are adjustable community estimates, not official vendor limits. Fable is capped at half the Claude budget. An AA benchmark task is not necessarily representative of a real user task.

GPT-6 Sol is excluded from calculations until comparable v5 measurements are available. v5 figures should not be compared directly with the previous v4.3.2 snapshot because the benchmark suite changed. Claude measurements include the fallback configuration where specified by Artificial Analysis.

Edit `data.js` to update measurements. `app.js` implements the calculations and `index.html` contains the page and styles.
