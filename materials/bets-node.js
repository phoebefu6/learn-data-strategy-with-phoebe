// Node runner: loads assets/bets-data.js and assets/bets-live.js exactly as the browser does
// and prints the canon as JSON. Compare with: python3 materials/bets-reference.py --json
const fs = require("fs"), path = require("path"), vm = require("vm");
const repo = process.argv[2] || path.join(__dirname, "..");
const ctx = { window: {} }; ctx.window.window = ctx.window;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(repo, "assets/bets-data.js"), "utf8"), ctx);
const api = require(path.join(path.resolve(repo), "assets/bets-live.js"));
const data = ctx.window.BETS_DATA;
const out = api.canon(data);
out.selfTest = api.selfTest(data);
process.stdout.write(JSON.stringify(out, null, process.argv.includes("--pretty") ? 1 : 0));
