#!/usr/bin/env python3
"""Python reference for the first-three-bets bench (session 3).

A separate implementation of the rules in assets/bets-live.js, written from the rule text, not
translated line by line. It reads the same constructed rows (assets/bets-data.js) and prints the
same canon. Compare:
    python3 materials/bets-reference.py --json > /tmp/py.json
    node materials/bets-node.js > /tmp/node.json
Agreement is required on every id list and integer, and on scores to 3 decimals.
"""
from __future__ import annotations

import json
import sys
from itertools import combinations
from pathlib import Path

SEED, DRAWS, JITTER = 20261029, 500, 0.2
DEFAULT_W = {"v": 0.5, "f": 0.2, "r": 0.3}


def load() -> dict:
    src = (Path(__file__).resolve().parent.parent / "assets" / "bets-data.js").read_text(encoding="utf-8")
    body = src[src.index("window.BETS_DATA = ") + len("window.BETS_DATA = "):].rstrip().rstrip(";")
    return json.loads(body)


def mulberry32(a: int):
    a &= 0xFFFFFFFF

    def nxt() -> float:
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t = (t ^ ((t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296

    return nxt


def score(row: dict, w: dict) -> float:
    v = (row["value"] - 1) / 9
    f = (1 - row["effort"] / 20) * (1 - 0.15 * (row["reg"] - 1))
    r = row["ready"] / 100
    s = w["v"] + w["f"] + w["r"]
    return 0.0 if s <= 0 else 100 * (w["v"] * v + w["f"] * f + w["r"] * r) / s


def pool(rows, w, gate):
    return [(i, r, score(r, w)) for i, r in enumerate(rows) if gate is None or r["ready"] >= gate]


def ok_deps(chosen_ids, row) -> bool:
    return all(d in chosen_ids for d in row["deps"])


def top3(rows, w, gate):
    return sorted(pool(rows, w, gate), key=lambda t: (-t[2], t[0]))[:3]


def exact(rows, w, gate, budget, cap):
    best, best_key, valid = None, None, 0
    for trio in combinations(pool(rows, w, gate), 3):
        ids = {t[1]["id"] for t in trio}
        if sum(t[1]["cost"] for t in trio) > budget or sum(t[1]["effort"] for t in trio) > cap:
            continue
        if not all(ok_deps(ids, t[1]) for t in trio):
            continue
        valid += 1
        s = trio[0][2] + trio[1][2] + trio[2][2]
        c = trio[0][1]["cost"] + trio[1][1]["cost"] + trio[2][1]["cost"]
        if best is None or s > best_key[0] or (s == best_key[0] and c < best_key[1]):
            best, best_key = list(trio), (s, c)
    return best, valid


def walk(order, budget, cap):
    chosen = []
    for t in order:
        if len(chosen) == 3:
            break
        trial = chosen + [t]
        if sum(x[1]["cost"] for x in trial) > budget or sum(x[1]["effort"] for x in trial) > cap:
            continue
        if not ok_deps({x[1]["id"] for x in chosen}, t[1]):
            continue
        chosen = trial
    return chosen


def describe(trio, budget, cap, gate):
    if not trio:
        return None
    ids = [t[1]["id"] for t in trio]
    cost = sum(t[1]["cost"] for t in trio)
    eff = sum(t[1]["effort"] for t in trio)
    sc = 0.0
    for t in trio:
        sc += t[2]
    return {
        "ids": ids, "value": sum(t[1]["value"] for t in trio), "cost": cost, "effort": eff,
        "score": round(sc, 3), "offense": sum(1 for t in trio if t[1]["side"] == "O"),
        "gaps": [t[1]["id"] for t in trio if t[1]["ready"] < gate],
        "missingDeps": [t[1]["id"] for t in trio if not ok_deps(set(ids), t[1])],
        "fits": cost <= budget and eff <= cap,
    }


def canon(data: dict) -> dict:
    rows, g, B, C = data["rows"], data["gate"], data["budget"], data["capacity"]
    w, w1 = DEFAULT_W, {"v": 1, "f": 0, "r": 0}
    w2 = {"v": w["v"], "f": w["f"], "r": 0}
    ex, valid = exact(rows, w, g, B, C)
    gr = walk(sorted(pool(rows, w, g), key=lambda t: (-t[2], t[0])), B, C)
    qw = walk(sorted(pool(rows, w, None), key=lambda t: (t[1]["effort"], t[1]["cost"], t[0])), B, C)
    brk, _ = exact(rows, w2, None, B, C)
    top = sorted(brk, key=lambda t: (-t[2], t[0]))[0]

    rnd, same, incl = mulberry32(SEED), 0, {}
    key = [t[1]["id"] for t in ex]
    for _ in range(DRAWS):
        wd = {k: w[k] * (1 - JITTER + 2 * JITTER * rnd()) for k in ("v", "f", "r")}
        e2, _ = exact(rows, wd, g, B, C)
        if not e2:
            continue
        ids = [t[1]["id"] for t in e2]
        same += ids == key
        for i in ids:
            incl[i] = incl.get(i, 0) + 1

    front = [r for r in rows if not any(
        q is not r and q["value"] >= r["value"] and q["effort"] <= r["effort"]
        and (q["value"] > r["value"] or q["effort"] < r["effort"]) for q in rows)]
    front.sort(key=lambda r: (r["effort"], r["value"]))

    return {
        "weights": w, "budget": B, "capacity": C, "gate": g,
        "value": describe(top3(rows, w1, None), B, C, g),
        "feasibility": describe(top3(rows, w2, None), B, C, g),
        "readiness": describe(top3(rows, w, g), B, C, g),
        "exact": describe(ex, B, C, g), "validSets": valid,
        "greedy": describe(gr, B, C, g),
        "stability": {"draws": DRAWS, "same": same, "incl": dict(sorted(incl.items()))},
        "quick": describe(qw, B, C, g), "brk": describe(brk, B, C, g),
        "brkTop": {"id": top[1]["id"], "ready": top[1]["ready"], "gap": top[1]["gap"]},
        "frontier": [r["id"] for r in front],
    }


if __name__ == "__main__":
    c = canon(load())
    if "--json" in sys.argv:
        print(json.dumps(c))
    else:
        print(json.dumps(c, indent=1))
