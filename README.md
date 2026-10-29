<!-- learn-with-phoebe hub banner -->
> ### 📚 Part of [**Learn with Phoebe**](https://phoebefu6.github.io/learn-with-phoebe/)
> The shelf of 174 free, hands-on courses on AI, data, and the craft around them. **[Browse every course ↗](https://phoebefu6.github.io/learn-with-phoebe/)**
<!-- /learn-with-phoebe hub banner -->

# Learn Data Strategy with Phoebe

Six 45-minute sessions for a new or aspiring Chief Data Officer who has to write a first data
strategy: decide what the data is for before any method. Diagnosis before ambition, offense and
defense, the first three bets, the operating model, funding and value tracking, and the strategy
on a page. The running case is constructed: a new CDO joins Keelson Mutual, an invented mid-size
insurer, and each session adds one page to its strategy document.

**Live site:** https://phoebefu6.github.io/learn-data-strategy-with-phoebe/

| # | Session | Signature thing |
|---|---|---|
| 1 | Diagnosis before ambition | Rumelt's kernel applied to data; a 30-day listening tour |
| 2 | What the data is for | DalleMule and Davenport's offense and defense; one governed source, many fit-for-purpose views |
| 3 | The first three bets | The bench: 24 constructed use cases scored, picked under budget and capacity, stress-tested |
| 4 | Operating model | Centralised, hub-and-spoke, federated; the CDO reporting line; minimum governance |
| 5 | Funding and value tracking | Central, chargeback and staged bet funding; leading and lagging value signals |
| 6 | The strategy on a page | The UK and US national data strategies read as worked material; a 100-day plan |

The bench in session 3 (`assets/bets-live.js`, data in `assets/bets-data.js`) computes a weighted
score, the value-effort frontier, the best set of three bets under a budget and team-capacity
limit (exact search over every valid set, against a greedy pick), and how often that set survives
seeded weight shifts of plus or minus 20 percent. The use cases are constructed, so the bench
claims orderings only. The Python reference (`materials/bets-reference.py`) and the browser engine
(`node materials/bets-node.js`) print identical numbers.

By Phoebe Fu.
