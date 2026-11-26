import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = []; page.on("pageerror", e => errs.push(e.message));
await page.route("**/*", r => { const u = r.request().url(); if (u.includes("gstatic.com/firebasejs") || (u.includes("googleapis.com/") && !u.includes("fonts.")) || u.includes("fonts.g")) return r.abort(); return r.continue(); });
await page.goto(pathToFileURL(join(ROOT, "index.html")).href, { waitUntil: "load" });
await page.waitForTimeout(1200);
const ev = (f, a) => page.evaluate(f, a);
await ev(() => { me = DAD; go("settings"); document.getElementById("exampleBtn").click(); });
await page.waitForTimeout(500);
const kid = await ev(() => { data.users.forEach(u => { u.toured = true; u.showPrayer = false; }); tourShown = true; return kidsList()[0].id; });
const hide = () => ev(() => { document.querySelectorAll(".tour").forEach(t => t.remove()); document.querySelectorAll("#prayAsk,#moodAsk,#kModal,#toast,#savedPop").forEach(x => x.hidden = true); });
// kid adds "Football" through the real form
await ev(k => { me = k; go("add"); addOpen.fl = true; drawAddSections(); document.querySelector('#scr-add [data-addnew="fl"]').click(); }, kid);
await page.waitForTimeout(400); await hide(); await page.fill("#flName", "Football");
await page.click("#flAdd");
await page.waitForTimeout(400);
const r1 = await ev(k => ({ asks: data.asks.length, inFlex: data.flexible.some(f => f.name === "Football"), unsaved: savedJson !== JSON.stringify(data) }), kid);
await hide(); await ev(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/5-kid-waiting.png` });
// parent: Needs you
await ev(() => { me = DAD; go("add"); });
await page.waitForTimeout(500); await hide();
await ev(() => { const n = document.getElementById("addAsks"); n && n.scrollIntoView({ block: "center" }); });
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/6-parent-asks.png` });
await ev(() => document.querySelector("[data-askyes]").click());
await page.waitForTimeout(500);
const r2 = await ev(() => ({ asks: data.asks.length, inFlex: data.flexible.some(f => f.name === "Football"), planned: (() => { const f = data.flexible.find(x => x.name === "Football"); return Object.values(data.plan.dates).some(d => d.items.some(i => baseActId(i.actId) === f.id)); })(), warn: data.plan.warnings.slice(0, 2) }));
// kid changes it, parent says no
await ev(k => { const f = data.flexible.find(x => x.name === "Football"); me = k; askParent("fl", { ...f, id: undefined, duration: 90 }, f.id, () => {}); me = DAD; answerAsk(data.asks[0].id, false); }, kid);
const r3 = await ev(() => ({ asks: data.asks.length, dur: data.flexible.find(f => f.name === "Football").duration }));
console.log(JSON.stringify({ r1, r2, r3 }), "errors:", errs.length, errs.slice(0, 3).join(" | "));
await browser.close();
