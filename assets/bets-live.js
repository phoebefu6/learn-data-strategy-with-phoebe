/* bets-live.js - the first-three-bets bench for learn-data-strategy-with-phoebe
 *
 * Keelson Mutual is a CONSTRUCTED insurer and its 24 use cases (assets/bets-data.js) are
 * constructed. Real rows do not exist for a fictional portfolio, so the bench claims only
 * ORDERINGS: which bets rise and fall under which rule. It never predicts a return.
 *
 * Everything below is computed here, in the browser, from those rows:
 *   score     100 x (wV.v + wF.f + wR.r) / (wV + wF + wR), where
 *             v = (value - 1) / 9, f = (1 - effort / 20) x (1 - 0.15 x (reg - 1)), r = ready / 100
 *   gate      a bet with readiness under the gate (40) is not eligible: its data does not exist yet
 *   frontier  value against effort: a bet is on it when no other bet has at least its value for at
 *             most its effort, and is strictly better on one of the two
 *   exact     every set of three eligible bets (i < j < k) is tried; a set is valid when its cost
 *             fits the budget, its team-months fit the capacity, and every dependency is in the set.
 *             Best = highest score sum, then lower cost, then earlier rows
 *   greedy    walk bets by score, take one if it still fits and its dependencies are already taken
 *   stability seeded Monte Carlo (mulberry32, seed 20261029, 500 draws): each weight is multiplied
 *             by a factor from 0.8 to 1.2; how often does the exact set stay the same set?
 *   quick     ANTI-LEVER: the three lowest-effort bets that fit, readiness ignored
 *   break     BREAK BUTTON: readiness weight set to zero and the gate removed
 * The Python reference (materials/bets-reference.py) is a separate implementation of the same rules
 * and prints the same canon; materials/bets-node.js runs THIS file in node for the comparison.
 */
(function (root) {
  "use strict";

  var SEED = 20261029, DRAWS = 500, JITTER = 0.2;
  var DEFAULT_W = { v: 0.5, f: 0.2, r: 0.3 };
  var FAULT = null; // set only inside selfTest, to prove each check can fail

  /* ---------- engine (mirrors the Python reference, rule for rule) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function parts(row) {
    return {
      v: (row.value - 1) / 9,
      f: (1 - row.effort / 20) * (1 - 0.15 * (row.reg - 1)),
      r: row.ready / 100
    };
  }
  function score(row, w) {
    var p = parts(row), s = w.v + w.f + w.r;
    if (s <= 0) return 0;
    return 100 * (w.v * p.v + w.f * p.f + w.r * p.r) / s;
  }

  // opts: { w, gate (number or null), budget, capacity }
  function scored(rows, opts) {
    return rows.map(function (row, i) {
      var elig = opts.gate === null || opts.gate === undefined || row.ready >= opts.gate;
      if (FAULT === "nogate") elig = true;
      return { i: i, row: row, s: score(row, opts.w), elig: elig };
    });
  }

  function depsOk(set) {
    if (FAULT === "nodeps") return true;
    var ids = set.map(function (x) { return x.row.id; });
    for (var a = 0; a < set.length; a++) {
      var d = set[a].row.deps;
      for (var b = 0; b < d.length; b++) if (ids.indexOf(d[b]) < 0) return false;
    }
    return true;
  }
  function fits(set, opts) {
    var c = 0, e = 0;
    for (var a = 0; a < set.length; a++) { c += set[a].row.cost; e += set[a].row.effort; }
    if (FAULT === "nobudget") return true;
    return c <= opts.budget && e <= opts.capacity;
  }

  function topN(rows, opts, n) {
    var sc = scored(rows, opts).filter(function (x) { return x.elig; });
    sc.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    return sc.slice(0, n);
  }

  function exact(rows, opts) {
    var sc = scored(rows, opts).filter(function (x) { return x.elig; });
    var best = null, bestS = -1, bestC = 0, valid = 0;
    for (var i = 0; i < sc.length; i++) for (var j = i + 1; j < sc.length; j++) for (var k = j + 1; k < sc.length; k++) {
      var set = [sc[i], sc[j], sc[k]];
      if (!fits(set, opts) || !depsOk(set)) continue;
      valid++;
      var s = sc[i].s + sc[j].s + sc[k].s;
      var c = sc[i].row.cost + sc[j].row.cost + sc[k].row.cost;
      if (best === null || s > bestS || (s === bestS && c < bestC)) { best = set; bestS = s; bestC = c; }
    }
    return { set: best, valid: valid };
  }

  function greedy(rows, opts) {
    var sc = scored(rows, opts).filter(function (x) { return x.elig; });
    sc.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    var set = [];
    for (var a = 0; a < sc.length && set.length < 3; a++) {
      var trial = set.concat([sc[a]]);
      if (!fits(trial, opts)) continue;
      var ids = set.map(function (x) { return x.row.id; }), ok = true;
      sc[a].row.deps.forEach(function (d) { if (ids.indexOf(d) < 0) ok = false; });
      if (!ok) continue;
      set = trial;
    }
    return set;
  }

  function quickWins(rows, opts) {
    var sc = scored(rows, { w: opts.w, gate: null });
    sc.sort(function (a, b) { return a.row.effort - b.row.effort || a.row.cost - b.row.cost || a.i - b.i; });
    var set = [];
    for (var a = 0; a < sc.length && set.length < 3; a++) {
      var trial = set.concat([sc[a]]);
      if (!fits(trial, opts)) continue;
      var ids = set.map(function (x) { return x.row.id; }), ok = true;
      sc[a].row.deps.forEach(function (d) { if (ids.indexOf(d) < 0) ok = false; });
      if (!ok) continue;
      set = trial;
    }
    return set;
  }

  function stability(rows, opts, base) {
    var rnd = mulberry32(SEED), same = 0, incl = {}, n = DRAWS;
    var key = base ? ids(base).join(",") : "";
    for (var d = 0; d < n; d++) {
      var w = {
        v: opts.w.v * (1 - JITTER + 2 * JITTER * rnd()),
        f: opts.w.f * (1 - JITTER + 2 * JITTER * rnd()),
        r: opts.w.r * (1 - JITTER + 2 * JITTER * rnd())
      };
      var ex = exact(rows, { w: w, gate: opts.gate, budget: opts.budget, capacity: opts.capacity }).set;
      if (!ex) continue;
      if (ids(ex).join(",") === key) same++;
      ex.forEach(function (x) { incl[x.row.id] = (incl[x.row.id] || 0) + 1; });
    }
    return { draws: n, same: same, incl: incl };
  }

  function frontier(rows) {
    return rows.filter(function (p) {
      return !rows.some(function (q) {
        return q !== p && q.value >= p.value && q.effort <= p.effort && (q.value > p.value || q.effort < p.effort);
      });
    }).sort(function (a, b) { return a.effort - b.effort || a.value - b.value; }).map(function (r) { return r.id; });
  }

  function ids(set) { return set.map(function (x) { return x.row.id; }); }
  function sum(set, f) { var t = 0; set.forEach(function (x) { t += f(x); }); return t; }
  function describe(set, opts) {
    if (!set) return null;
    return {
      ids: ids(set),
      value: sum(set, function (x) { return x.row.value; }),
      cost: sum(set, function (x) { return x.row.cost; }),
      effort: sum(set, function (x) { return x.row.effort; }),
      score: sum(set, function (x) { return x.s; }),
      offense: set.filter(function (x) { return x.row.side === "O"; }).length,
      gaps: set.filter(function (x) { return x.row.ready < opts.gateLine; }).map(function (x) { return x.row.id; }),
      missingDeps: set.filter(function (x) {
        return x.row.deps.some(function (d) { return ids(set).indexOf(d) < 0; });
      }).map(function (x) { return x.row.id; }),
      fits: sum(set, function (x) { return x.row.cost; }) <= opts.budget && sum(set, function (x) { return x.row.effort; }) <= opts.capacity
    };
  }

  // The five rungs, the anti-lever and the break, for one set of weights and limits.
  function ladder(data, w, budget, capacity) {
    var rows = data.rows, g = data.gate;
    var lim = { budget: budget, capacity: capacity, gateLine: g };
    var o1 = { w: { v: 1, f: 0, r: 0 }, gate: null, budget: budget, capacity: capacity, gateLine: g };
    var o2 = { w: { v: w.v, f: w.f, r: 0 }, gate: null, budget: budget, capacity: capacity, gateLine: g };
    var o3 = { w: w, gate: g, budget: budget, capacity: capacity, gateLine: g };
    var ex = exact(rows, o3), gr = greedy(rows, o3);
    var brk = exact(rows, o2);
    var st = stability(rows, o3, ex.set);
    var qw = quickWins(rows, o3);
    var brkTop = null;
    if (brk.set) brkTop = brk.set.slice().sort(function (a, b) { return b.s - a.s || a.i - b.i; })[0];
    return {
      value: describe(topN(rows, o1, 3), o1),
      feasibility: describe(topN(rows, o2, 3), o2),
      readiness: describe(topN(rows, o3, 3), o3),
      exact: describe(ex.set, o3), validSets: ex.valid,
      greedy: describe(gr, o3),
      stability: { draws: st.draws, same: st.same, incl: st.incl },
      quick: describe(qw, o3),
      brk: describe(brk.set, o2),
      brkTop: brkTop ? { id: brkTop.row.id, ready: brkTop.row.ready, gap: brkTop.row.gap } : null,
      frontier: frontier(rows),
      limits: lim
    };
  }

  function round3(x) { return Math.round(x * 1000) / 1000; }
  function canon(data) {
    var L = ladder(data, DEFAULT_W, data.budget, data.capacity);
    function c(d) { return d ? { ids: d.ids, value: d.value, cost: d.cost, effort: d.effort, score: round3(d.score), offense: d.offense, gaps: d.gaps, missingDeps: d.missingDeps, fits: d.fits } : null; }
    var incl = {};
    Object.keys(L.stability.incl).sort().forEach(function (k) { incl[k] = L.stability.incl[k]; });
    return {
      weights: DEFAULT_W, budget: data.budget, capacity: data.capacity, gate: data.gate,
      value: c(L.value), feasibility: c(L.feasibility), readiness: c(L.readiness),
      exact: c(L.exact), validSets: L.validSets, greedy: c(L.greedy),
      stability: { draws: L.stability.draws, same: L.stability.same, incl: incl },
      quick: c(L.quick), brk: c(L.brk), brkTop: L.brkTop, frontier: L.frontier
    };
  }

  /* ---------- self-test: properties, each proven to fail on a planted fault ---------- */
  function checks(data) {
    var out = [];
    function chk(name, ok) { out.push({ name: name, pass: !!ok }); }
    function run(w, budget, capacity) {
      var o = { w: w, gate: data.gate, budget: budget, capacity: capacity, gateLine: data.gate };
      return { ex: describe(exact(data.rows, o).set, o), gr: describe(greedy(data.rows, o), o), budget: budget, capacity: capacity };
    }
    // the default limits, a tight pair of limits, and readiness weighted at zero
    var runs = [run(DEFAULT_W, data.budget, data.capacity), run(DEFAULT_W, 700, 14), run({ v: 0.7, f: 0.3, r: 0 }, data.budget, data.capacity)];
    chk("every exact pick fits its budget and team capacity", runs.every(function (x) { return x.ex && x.ex.cost <= x.budget && x.ex.effort <= x.capacity; }));
    chk("every dependency of every exact pick is inside the pick", runs.every(function (x) { return x.ex && x.ex.missingDeps.length === 0; }));
    chk("no bet under the readiness gate is eligible, even at zero readiness weight", runs.every(function (x) { return x.ex && x.ex.gaps.length === 0; }));
    chk("exact never scores below greedy", runs.every(function (x) { return x.ex && x.gr && x.ex.score >= x.gr.score - 1e-9; }));
    return out;
  }
  function selfTest(data) {
    var base = checks(data), faults = ["nobudget", "nodeps", "nogate"], tripped = 0;
    faults.forEach(function (f) {
      var prev = FAULT; FAULT = f;
      try { if (checks(data).some(function (c) { return !c.pass; })) tripped++; } finally { FAULT = prev; }
    });
    return { checks: base, pass: base.every(function (c) { return c.pass; }), faults: faults.length, tripped: tripped };
  }

  /* ---------- widget ---------- */
  var PRESETS = [
    { id: "value", label: "1 · Rank by value alone", note: "The three biggest prizes. No effort, no data, no budget.", tag: "ordering" },
    { id: "feasibility", label: "2 · Add feasibility", note: "Value plus effort and regulatory risk. Readiness still ignored.", tag: "ordering" },
    { id: "readiness", label: "3 · Add data readiness", note: "Readiness weighted, and bets under the gate are out.", tag: "ordering" },
    { id: "exact", label: "4 · Fit budget and team", note: "Best set of three that fits, dependencies inside. Exact search beside greedy.", tag: "ordering" },
    { id: "stability", label: "5 · Test rank stability", note: "500 seeded draws, each weight moved up to 20 percent either way.", tag: "range" },
    { id: "quick", label: "Quick wins first", note: "The three lowest-effort bets that fit. What a 90-day scramble picks.", tag: "anti-lever", anti: true },
    { id: "brk", label: "Break it: drop data readiness", note: "Readiness weight to zero and the gate removed, then fit the budget.", tag: "broken on purpose", brk: true }
  ];

  var data, rootEl, els = {}, state = { preset: "value", w: { v: DEFAULT_W.v, f: DEFAULT_W.f, r: DEFAULT_W.r }, budget: 0, capacity: 0 };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function byId(id) { for (var i = 0; i < data.rows.length; i++) if (data.rows[i].id === id) return data.rows[i]; return null; }
  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function pct(a, b) { return (100 * a / b).toFixed(1) + "%"; }

  function scatter(L, pick) {
    // narrow screens get a narrower viewBox so the 12px labels stay near 12px once scaled down
    var cw = els.scatter && els.scatter.clientWidth, narrow = cw > 0 && cw < 420;
    var W = narrow ? 296 : 440, H = narrow ? 322 : 300, x0 = 40, y0 = 28, pw = W - 56, ph = 214, maxE = 18;
    var X = function (e) { return x0 + pw * e / maxE; }, Y = function (v) { return y0 + ph - ph * (v - 1) / 9; };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Value band against effort in team-months for all 24 constructed use cases, the value-effort frontier dashed, the current pick filled">';
    [0, 3, 6, 9, 12, 15, 18].forEach(function (e) {
      svg += '<line class="bt-gl" x1="' + X(e) + '" y1="' + y0 + '" x2="' + X(e) + '" y2="' + (y0 + ph) + '"/>';
      svg += '<text class="bt-tick" x="' + X(e) + '" y="' + (y0 + ph + 16) + '" text-anchor="middle">' + e + '</text>';
    });
    [1, 4, 7, 10].forEach(function (v) {
      svg += '<text class="bt-tick" x="' + (x0 - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    });
    svg += '<text class="bt-cap" x="' + (x0 + pw / 2) + '" y="' + (y0 + ph + 38) + '" text-anchor="middle">effort, team-months (constructed)</text>';
    svg += '<text class="bt-cap" x="12" y="12">value band</text>';
    var fr = L.frontier.map(byId);
    svg += '<path class="bt-front" d="' + fr.map(function (r, i) { return (i ? "L" : "M") + X(r.effort).toFixed(1) + " " + Y(r.value).toFixed(1); }).join(" ") + '"/>';
    var ids = pick ? pick.ids : [], seen = {};
    data.rows.forEach(function (r) {
      var on = ids.indexOf(r.id) >= 0, gap = r.ready < data.gate;
      // bets with the same value and effort sit side by side instead of on top of each other
      var key = r.effort + ":" + r.value, k = seen[key] || 0; seen[key] = k + 1;
      var dx = k === 0 ? 0 : (k % 2 ? 9 : -9) * Math.ceil(k / 2);
      svg += '<circle class="bt-dot' + (on ? " is-pick" : "") + (gap ? " is-gap" : "") + '" cx="' + (X(r.effort) + dx).toFixed(1) + '" cy="' + Y(r.value).toFixed(1) + '" r="' + (on ? 7 : 4.5) + '"><title>' + esc(r.id + " · " + r.name + " · value " + r.value + ", effort " + r.effort + ", readiness " + r.ready) + '</title></circle>';
    });
    // picked bets are named in the table beside the plot, not on it, so no line can cross a label
    var pickCap = 'filled = this rule\'s pick (' + esc(ids.join(", ")) + ')';
    svg += narrow
      ? '<text class="bt-cap" x="' + (x0 + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + pickCap + '</text>'
      : '<text class="bt-cap" x="' + (x0 + pw) + '" y="12" text-anchor="end">' + pickCap + '</text>';
    svg += '</svg>';
    return svg;
  }

  function table(d, note, w) {
    if (!d) return '<p class="mb-hint">No set of three fits these limits. Raise the budget or the team capacity.</p>';
    var h = '<table class="dt-table bt-picks"><thead><tr><th>Bet</th><th>Side</th><th>Value</th><th>Effort</th><th>Cost</th><th>Ready</th><th>Score</th><th>Flag</th></tr></thead><tbody>';
    d.ids.forEach(function (id) {
      var r = byId(id), flags = [];
      if (r.ready < data.gate) flags.push("data does not exist yet");
      if (r.deps.some(function (x) { return d.ids.indexOf(x) < 0; })) flags.push("needs " + r.deps.join(", ") + " first");
      h += "<tr><th>" + esc(id) + "<em>" + esc(r.name) + "</em></th><td>" + (r.side === "O" ? "offense" : "defense") + "</td><td>" + r.value + "</td><td>" + r.effort + "</td><td>" + fmt(r.cost) + "</td><td>" + r.ready + "</td><td>" + score(r, w).toFixed(1) + "</td><td" + (flags.length ? ' class="dt-na"' : "") + ">" + (flags.length ? esc(flags.join("; ")) : "none") + "</td></tr>";
    });
    return h + "</tbody></table>" + (note ? '<p class="mb-hint">' + esc(note) + "</p>" : "");
  }

  function metric(label, val, unit, kind) {
    return '<div class="mb-metric"><span class="mb-mkind ' + (kind === "anti" ? "bt-kanti" : "is-heuristic") + '">' + esc(kind === "anti" ? "worse on purpose" : "ordering") + '</span>' +
      '<span class="mb-mlabel">' + esc(label) + '</span><span class="mb-mvalue">' + esc(val) + '</span><span class="mb-munit">' + esc(unit) + '</span></div>';
  }

  function render() {
    var L = ladder(data, state.w, state.budget, state.capacity);
    var p = state.preset, d, verdict, vcls = "is-ok", note = "";
    Object.keys(els.btns).forEach(function (k) {
      els.btns[k].classList.toggle("is-on", k === p);
      els.btns[k].querySelector("input").checked = (k === p);
    });
    var ex = L.exact;
    if (p === "value") { d = L.value; verdict = "Value alone picks " + d.ids.join(", ") + ": value " + d.value + ", cost " + fmt(d.cost) + " against a budget of " + fmt(state.budget) + ", " + d.gaps.length + " of 3 with no usable data."; vcls = d.fits && !d.gaps.length ? "is-ok" : "is-bad"; }
    else if (p === "feasibility") { d = L.feasibility; verdict = "Value plus feasibility picks " + d.ids.join(", ") + ": value " + d.value + ", " + d.effort + " team-months, " + d.gaps.length + " of 3 with no usable data."; vcls = d.gaps.length ? "is-bad" : "is-ok"; }
    else if (p === "readiness") { d = L.readiness; verdict = "With readiness weighted and gated: " + d.ids.join(", ") + ". Cost " + fmt(d.cost) + " against " + fmt(state.budget) + ", " + d.effort + " team-months against " + state.capacity + (d.fits ? ", fits." : ", does not fit.") + (d.missingDeps.length ? " But " + d.missingDeps.join(" and ") + (d.missingDeps.length > 1 ? " need" : " needs") + " a bet the pick leaves out." : ""); vcls = d.fits && !d.missingDeps.length ? "is-good" : "is-bad"; }
    else if (p === "exact") {
      d = ex;
      if (!d) { verdict = "No set of three fits a budget of " + fmt(state.budget) + " and " + state.capacity + " team-months."; vcls = "is-bad"; }
      else {
        var g = L.greedy, same = g && g.ids.join() === d.ids.join();
        verdict = "Exact search over " + L.validSets + " valid sets picks " + d.ids.join(", ") + " (score " + d.score.toFixed(1) + ", value " + d.value + "). Greedy picks " + (g && g.ids.length ? g.ids.join(", ") + " (score " + g.score.toFixed(1) + ", value " + g.value + ")" : "nothing that fits") + (same ? ", the same set." : ".");
        vcls = "is-good";
        note = "Greedy takes the best-scoring bet that still fits, one at a time, and cannot take a bet before its dependency.";
      }
    }
    else if (p === "stability") {
      d = ex;
      if (!d) { verdict = "No set fits these limits, so there is nothing to test."; vcls = "is-bad"; }
      else { verdict = "The exact set " + d.ids.join(", ") + " survived " + L.stability.same + " of " + L.stability.draws + " weight draws (" + pct(L.stability.same, L.stability.draws) + "). Tell the board the range, not the point."; vcls = L.stability.same / L.stability.draws >= 0.5 ? "is-good" : "is-bad"; }
    }
    else if (p === "quick") {
      d = L.quick;
      verdict = "Quick wins first picks " + d.ids.join(", ") + ": value " + d.value + " against " + (ex ? ex.value : "n/a") + " for the exact set, " + d.offense + " offense and " + (d.ids.length - d.offense) + " defense" + (d.gaps.length ? ", and " + d.gaps.join(", ") + " has no usable data yet." : ".");
      vcls = "is-bad";
    }
    else {
      d = L.brk;
      var t = L.brkTop;
      verdict = d ? "Without readiness the best fitting set is " + d.ids.join(", ") + ". Its top bet, " + t.id + ", has readiness " + t.ready + (t.gap ? ": " + t.gap + "." : ".") : "No set fits.";
      vcls = "is-bad";
    }
    els.verdict.className = "mb-verdict " + vcls;
    els.verdict.textContent = verdict;

    var kind = (p === "quick" || p === "brk") ? "anti" : "ord";
    var m = "";
    if (d) {
      m += metric("Value captured, sum of 3 bands", String(d.value), ex ? "exact set: " + ex.value : "no exact set", kind);
      m += metric("Cost of the three", fmt(d.cost), "budget " + fmt(state.budget) + (d.cost > state.budget ? ", over" : ""), kind);
      m += metric("Team-months", String(d.effort), "capacity " + state.capacity + (d.effort > state.capacity ? ", over" : ""), kind);
      m += metric("Offense : defense", d.offense + " : " + (d.ids.length - d.offense), "DalleMule and Davenport's dial", kind);
      m += metric("Bets with no usable data", String(d.gaps.length), "readiness under " + data.gate, kind);
      if (p === "stability" && ex) m += metric("Exact set survives", pct(L.stability.same, L.stability.draws), L.stability.same + " of " + L.stability.draws + " seeded draws", "ord");
      else m += metric("Valid sets of three", String(L.validSets), "under the current limits", kind);
    }
    els.metrics.innerHTML = m;
    els.scatter.innerHTML = scatter(L, d);
    var wUsed = p === "value" ? { v: 1, f: 0, r: 0 } : (p === "feasibility" || p === "brk") ? { v: state.w.v, f: state.w.f, r: 0 } : state.w;
    els.table.innerHTML = table(d, note, wUsed);
    var bars = "";
    if (p === "stability" && ex) {
      var keys = Object.keys(L.stability.incl).sort(function (a, b) { return L.stability.incl[b] - L.stability.incl[a] || (a < b ? -1 : 1); });
      bars = '<table class="dt-table bt-stab"><thead><tr><th>Bet</th><th>In the exact set</th></tr></thead><tbody>';
      keys.forEach(function (k) {
        var n = L.stability.incl[k];
        bars += '<tr><th>' + esc(k) + '</th><td><span class="bt-bar" style="width:' + (60 * n / L.stability.draws).toFixed(1) + '%"></span> ' + n + " of " + L.stability.draws + "</td></tr>";
      });
      bars += "</tbody></table>";
    }
    els.stab.innerHTML = bars;
    els.stab.style.display = bars ? "" : "none";
    ["v", "f", "r"].forEach(function (k) { els.wout[k].textContent = state.w[k].toFixed(2); });
    els.bout.textContent = fmt(state.budget);
    els.cout.textContent = String(state.capacity);
  }

  function slider(label, id, min, max, step, val) {
    return '<label class="bt-sl" for="' + id + '"><span>' + label + '</span><input type="range" id="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"><output></output></label>';
  }

  function buildUI() {
    rootEl.innerHTML = "";
    var panel = document.createElement("div"); panel.className = "mb-presets";
    els.btns = {};
    PRESETS.forEach(function (p) {
      var l = document.createElement("label");
      l.className = "mb-preset" + (p.anti || p.brk ? " is-anti" : "");
      l.innerHTML = '<input type="radio" name="bt-step" value="' + p.id + '">' +
        '<span class="mb-pname">' + esc(p.label) + (p.anti ? ' <em class="mb-anti">anti-lever</em>' : "") + (p.brk ? ' <em class="mb-anti">break</em>' : "") + "</span>" +
        '<span class="mb-pnote">' + esc(p.note) + "</span>";
      l.querySelector("input").addEventListener("change", function () { state.preset = p.id; render(); });
      panel.appendChild(l); els.btns[p.id] = l;
    });
    rootEl.appendChild(panel);

    var ctl = document.createElement("div"); ctl.className = "bt-controls";
    ctl.innerHTML = slider("Weight: value", "bt-wv", 0, 1, 0.05, state.w.v) + slider("Weight: feasibility", "bt-wf", 0, 1, 0.05, state.w.f) +
      slider("Weight: readiness", "bt-wr", 0, 1, 0.05, state.w.r) + slider("Budget (thousands)", "bt-bud", 400, 2400, 50, state.budget) +
      slider("Team capacity (team-months)", "bt-cap", 8, 48, 1, state.capacity);
    rootEl.appendChild(ctl);
    els.wout = { v: ctl.querySelector("#bt-wv + output"), f: ctl.querySelector("#bt-wf + output"), r: ctl.querySelector("#bt-wr + output") };
    els.bout = ctl.querySelector("#bt-bud + output"); els.cout = ctl.querySelector("#bt-cap + output");
    [["bt-wv", "v"], ["bt-wf", "f"], ["bt-wr", "r"]].forEach(function (a) {
      ctl.querySelector("#" + a[0]).addEventListener("input", function (e) { state.w[a[1]] = +e.target.value; render(); });
    });
    ctl.querySelector("#bt-bud").addEventListener("input", function (e) { state.budget = +e.target.value; render(); });
    ctl.querySelector("#bt-cap").addEventListener("input", function (e) { state.capacity = +e.target.value; render(); });
    var reset = document.createElement("button"); reset.type = "button"; reset.className = "btn bt-reset"; reset.textContent = "Reset weights and limits";
    reset.addEventListener("click", function () { api.set({ w: DEFAULT_W, budget: data.budget, capacity: data.capacity }); });
    ctl.appendChild(reset);

    els.verdict = document.createElement("p"); rootEl.appendChild(els.verdict);
    els.metrics = document.createElement("div"); els.metrics.className = "mb-metrics"; rootEl.appendChild(els.metrics);
    var grid = document.createElement("div"); grid.className = "bt-grid";
    var c1 = document.createElement("div"); c1.className = "ab-card";
    c1.innerHTML = "<h4>All 24 bets: value against effort, frontier dashed, pick filled, hollow red = no usable data</h4>";
    els.scatter = document.createElement("div"); els.scatter.className = "bt-stage"; c1.appendChild(els.scatter);
    var c2 = document.createElement("div"); c2.className = "ab-card";
    c2.innerHTML = "<h4>The three bets this rule picks</h4>";
    els.table = document.createElement("div"); els.table.className = "dt-tablewrap"; c2.appendChild(els.table);
    els.stab = document.createElement("div"); els.stab.className = "dt-tablewrap"; c2.appendChild(els.stab);
    grid.appendChild(c1); grid.appendChild(c2); rootEl.appendChild(grid);

    var st = selfTest(data);
    var hint = document.createElement("p"); hint.className = "mb-hint";
    hint.textContent = "Constructed rows: 24 Keelson Mutual use cases, invented for teaching. Real rows do not exist for a fictional portfolio, so read the ORDER of bets, never a return. " +
      "Value is a band from 1 to 10, effort in team-months, cost in thousands, readiness 0 to 100, regulatory risk 1 to 3. " +
      "Self-test: " + st.checks.filter(function (c) { return c.pass; }).length + " of " + st.checks.length + " properties pass; " + st.tripped + " of " + st.faults + " planted faults are caught.";
    rootEl.appendChild(hint);
    els.selftest = st;
    render();
  }

  var api = {
    SEED: SEED, DRAWS: DRAWS, DEFAULT_W: DEFAULT_W, mulberry32: mulberry32, score: score, parts: parts,
    exact: exact, greedy: greedy, quickWins: quickWins, stability: stability, frontier: frontier,
    ladder: ladder, canon: canon, selfTest: selfTest,
    set: function (o) {
      if (o.preset) state.preset = o.preset;
      if (o.w) { state.w = { v: o.w.v, f: o.w.f, r: o.w.r }; }
      if (o.budget !== undefined) state.budget = o.budget;
      if (o.capacity !== undefined) state.capacity = o.capacity;
      if (rootEl) {
        [["bt-wv", state.w.v], ["bt-wf", state.w.f], ["bt-wr", state.w.r], ["bt-bud", state.budget], ["bt-cap", state.capacity]].forEach(function (a) {
          var el = document.getElementById(a[0]); if (el) el.value = a[1];
        });
        render();
      }
    },
    state: state
  };

  function init() {
    rootEl = document.getElementById("bets-bench");
    if (!rootEl || !root.BETS_DATA) return;
    data = root.BETS_DATA;
    state.budget = data.budget; state.capacity = data.capacity;
    var pre = rootEl.getAttribute("data-step");
    if (pre) state.preset = pre;
    buildUI();
    root.BETS_LIVE = api;
  }

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
})(typeof window !== "undefined" ? window : this);
