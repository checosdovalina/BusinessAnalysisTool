---
name: Report penalty totals
description: How generated evaluation reports calculate and summarize event penalty deductions.
---

The report's total penalties and executive summary should reflect the points actually deducted, not configured amounts that exceed an event's score. An event score cannot fall below zero.

**Why:** When a configured penalty exceeds the score, the extra amount does not change the score and should not be described as deducted.

**How to apply:** Clamp the event's adjusted score to zero and count the penalty as at most the event's available score when aggregating or summarizing report deductions.
