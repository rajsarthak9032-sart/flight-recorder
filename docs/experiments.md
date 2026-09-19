# Experiment Engine & Statistical Metrology

## Mission

The Experiment Engine coordinates repeated, controlled inference trials over specified prompts, configurations, and hardware targets, calculating Bessel-corrected sample statistics.

---

## Statistical Aggregation

For any metric sample $X = [x_1, x_2, \dots, x_n]$:

* **Sample Count ($n$)**: Total count of non-null, valid numeric observations.
* **Arithmetic Mean ($\mu$)**:
  $$\mu = \frac{1}{n}\sum_{i=1}^n x_i$$
* **Sample Standard Deviation ($\sigma$)** (with Bessel correction $n - 1$):
  $$\sigma = \sqrt{\frac{1}{n-1}\sum_{i=1}^n (x_i - \mu)^2} \quad (\text{for } n \ge 2)$$
* **Median**: Exact middle value of sorted observations.
* **Min / Max**: Extremum values.

---

## Non-Zero Exclusion Invariant

* If a trial fails or is blocked, its latency and TTFT are recorded as `null` / `UNAVAILABLE`.
* Missing values are **never** treated as `0` or filled with arbitrary averages.
* Statistical calculations strictly operate on the subset of completed, valid observations.
