// =====================================================================
//  📌 ONE-DAY EVENTS (parents): a title, who (one or more people), a date, a start and an end time. Only on that date (not every
//  week), on the calendar with a 📌, never scored. The planner keeps those people free then. When it's saved over planned activities
//  of those people: the clashes, then "Move them to another free time" (only those are planned again) or "Remove them for that day".
// =====================================================================
const oneDayOn = ds => (data.oneDay || []).filter(e => e.date === ds);
// (also ❌ a session that didn't happen: skipped, or moved to another day)
const skippedOn = (ds, actId) => oneDayOn(ds).some(e => (e.skip || []).includes(actId)) || hasOwn(data.skips || {}, `${ds}|${actId}`);
// The planned activities of those people at that time: the saved plan's (or, a date it doesn't have yet, the fixed ones by weekday)
function oneDayClashes(e) {
  const s = toMin(e.from), t = toMin(e.to), hits = it => it.start < t && s < it.end && it.people.some(p => e.who.includes(p));
  if (hasPlan() && data.plan.dates[e.date]) return planDay(e.date).items.filter(it => !it.gone && hits(it))
    .map(it => ({ actId: it.actId, name: it.name, fixed: !!it.fixed, start: it.start, end: it.end, users: it.users }));
  return data.fixed.filter(f => f.days.includes(weekdayOf(e.date))).map(f => ({ actId: f.id, name: f.name, fixed: true, start: toMin(f.start), end: toMin(f.end), users: f.users, people: peopleOf(f) }))
    .filter(hits);
}
let od = null;   // the open form: { id (null = new), title, who, date, from, to, clashes? }
function openOneDay(id) {
  if (!isParentDevice()) return;
  if (hasDraft()) return toast("💾 Save your changes first, then add the event.", 3500);
  const e = id && (data.oneDay || []).find(x => x.id === id);
  od = e ? { ...e, who: [...e.who] } : { id: null, title: "", who: kidsList().map(k => k.id).slice(0, 1), date: todayYmd(), from: "16:00", to: "17:00" };
  closeCard();
  drawOneDay();
  $("odModal").hidden = false;
  if ($("odName")) $("odName").focus();
}
function closeOneDay() { $("odModal").hidden = true; od = null; }
function drawOneDay() {
  $("odTitle").textContent = od.id ? "📌 Change the one-day event" : "📌 One-day event";
  if (od.clashes) {   // step 2: what to do with the clashes
    $("odBody").innerHTML = `<p class="print-hint">“${safe(od.title)}” on ${safe(dayLong(od.date))}, ${clock(toMin(od.from), true)}–${clock(toMin(od.to), true)} is at the same time as:</p>
      <ul class="list">${od.clashes.map(c => `<li><span class="what"><b>${safe(c.name)}</b><small>${clock(c.start, true)}–${clock(c.end, true)} · ${safe(namesOf(c.users))}${c.fixed ? " · 🔒 fixed: it can't move, only be removed" : ""}</small></span></li>`).join("")}</ul>
      <div class="btnrow"><button class="primary" data-odmove>🔀 Move them to another free time</button><button data-odremove>🗑️ Remove them for that day</button><button data-odback>⬅️ Back</button></div>`;
    return;
  }
  $("odBody").innerHTML = `
    <label class="small" for="odName">Title</label><input type="text" id="odName" maxlength="40" value="${safe(od.title)}" placeholder="Dentist, birthday party…">
    <label class="small">Who</label><div class="daypick" id="odWho">${data.users.map(u => `<label><input type="checkbox" value="${safe(u.id)}" ${od.who.includes(u.id) ? "checked" : ""}><span>${safe(u.emoji)} ${safe(u.name)}</span></label>`).join("")}</div>
    <label class="small" for="odDate">Date</label><input type="date" id="odDate" value="${safe(od.date)}">
    <div class="row"><div><label class="small" for="odFrom">Start time</label><input type="time" id="odFrom" value="${safe(od.from)}"></div>
      <div><label class="small" for="odTo">End time</label><input type="time" id="odTo" value="${safe(od.to)}"></div></div>
    <p class="hint">It's only on that date, shows with a 📌 and is never scored. Nothing is planned for those people at that time.</p>
    <div class="err" id="odErr"></div>
    <div class="btnrow"><button class="primary" data-odsave>💾 Save</button>${od.id ? `<button class="danger-text" data-oddel>🗑️ Delete</button>` : ""}<button data-odcancel>Cancel</button></div>`;
}
// 💾 Save: checked, then (clashes) step 2, or saved now
function saveOneDay() {
  const title = $("odName").value.trim().slice(0, 40), who = [...document.querySelectorAll("#odWho input:checked")].map(x => x.value);
  const date = $("odDate").value, from = $("odFrom").value, to = $("odTo").value, err = t => { $("odErr").textContent = t; };
  if (!title) return err("Please type a title.");
  if (!who.length) return err("Please pick who it's for.");
  if (!isYmd(date)) return err("Please pick the date.");
  if (!isHm(from) || !isHm(to) || toMin(to) <= toMin(from)) return err("The end time must be after the start time.");
  Object.assign(od, { title, who, date, from, to });
  const clashes = oneDayClashes(od);
  if (clashes.length) { od.clashes = clashes; return drawOneDay(); }
  finishOneDay([], false);
}
// Saves it. removed = the clashing activities taken off that day; move = plan the clashing (flexible) ones again in free time
function finishOneDay(removed, move) {
  const was = (data.oneDay || []).find(x => x.id === od.id);
  const e = { id: od.id || newId(), title: od.title, who: od.who, date: od.date, from: od.from, to: od.to, by: me,
              skip: [...new Set([...((was && was.date === od.date && was.skip) || []), ...removed])] };
  if (!e.skip.length) delete e.skip;
  data.oneDay = [...(data.oneDay || []).filter(x => x.id !== e.id), e];
  const ids = new Set((od.clashes || []).filter(c => removed.includes(c.actId) || (move && !c.fixed)).map(c => c.actId));
  if (ids.size && hasPlan() && data.plan.dates[e.date]) data.plan.dates[e.date].items = data.plan.dates[e.date].items.filter(it => !ids.has(it.actId));
  if (move && ids.size && hasPlan()) makeAndKeepPlan("fill");   // 🔀 only the ones taken off are placed again (from now, in free time)
  closeOneDay();
  writeData();
  render();
  toast(`📌 ${e.title} is on the calendar${move && ids.size ? `. ${ids.size} ${ids.size === 1 ? "activity was" : "activities were"} moved` : removed.length ? `. ${removed.length} removed for that day` : ""}.`, 3500);
}
function deleteOneDay(id) {
  const e = (data.oneDay || []).find(x => x.id === id);
  if (!e || !isParentDevice() || !confirm(`Delete “${e.title}”?`)) return;
  data.oneDay = data.oneDay.filter(x => x.id !== id);
  if (hasPlan() && e.skip && data.plan.dates[e.date]) makeAndKeepPlan("fill");   // (what it removed for that day can come back)
  closeCard();
  closeOneDay();
  writeData();
  render();
  toast("🗑️ Deleted");
}
// On the calendar: a 📌 card at its time (no tick: never scored)
function oneDayCardHtml(e, ds, opts) {
  const n = blocks.push({ oneDay: e, day: ds }) - 1, faded = (opts.fade && opts.fade !== "all" && !e.who.includes(opts.fade)) || !!opts.subj;
  return `<div class="k-block k-oneday ${faded ? "faded" : ""}" data-kblock="${n}" role="button" tabindex="0" title="${safe(`📌 ${e.title} · ${clock(toMin(e.from), true)}–${clock(toMin(e.to), true)}`)}">
    <span class="who"><span class="t-full">📌 ${safe(e.title)}</span><span class="t-short">📌 ${safe(e.title)}</span></span>
    <span class="k-sub"><span class="when">${clock(toMin(e.from))} - ${clock(toMin(e.to))}</span> <span class="what">${namesTag(e.who)}</span></span></div>`;
}
function openOneDayCard(b) {
  const e = b.oneDay;
  const rows = [["📌 What", e.title], ["🙂 Who", e.who.filter(exists).map(whoText).join(", ")], ["📅 Day", dayLong(e.date)],
                ["⏰ Time", `${clock(toMin(e.from), true)} – ${clock(toMin(e.to), true)}`], ["⭐ Points", "None: a one-day event isn't scored"]];
  $("kCard").style.cssText = "--soft:#fef3c7;--ink:#6b4f05";
  $("kCard").innerHTML = `
    <div class="k-card-top"><div class="big">📌</div><div class="nm">${safe(e.title)}</div></div>
    <div class="k-rows">${rows.map(([l, v]) => `<div><span>${safe(l)}</span><b>${safe(v)}</b></div>`).join("")}</div>
    ${isParentDevice() ? `<div class="btnrow" style="justify-content:center;margin:10px 16px 0"><button data-onedayedit="${safe(e.id)}">✏️ Change</button>
      <button class="danger-text" data-onedaydel="${safe(e.id)}">🗑️ Delete</button></div>` : ""}
    <button class="k-ok" id="kOk">OK 👍</button>`;
  $("kModal").hidden = false;
  $("kOk").focus();
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-newplan], [data-onedaynew], [data-onedayedit], [data-onedaydel]");
  if (!b) return;
  const ds = b.dataset;
  if ("newplan" in ds) return newPlanNow();
  if ("onedaynew" in ds) return openOneDay(null);
  if (ds.onedayedit) return openOneDay(ds.onedayedit);
  if (ds.onedaydel) return deleteOneDay(ds.onedaydel);
});
$("odModal").addEventListener("click", e => {
  if (e.target === $("odModal")) return closeOneDay();
  const b = e.target.closest("button");
  if (!b || !od) return;
  const ds = b.dataset;
  if ("odsave" in ds) return saveOneDay();
  if ("odcancel" in ds) return closeOneDay();
  if ("oddel" in ds) return deleteOneDay(od.id);
  if ("odback" in ds) { delete od.clashes; return drawOneDay(); }
  if ("odmove" in ds) return finishOneDay([], true);
  if ("odremove" in ds) return finishOneDay(od.clashes.map(c => c.actId), false);
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("odModal").hidden) closeOneDay(); });
// One date of the saved plan, ready to draw: { date, window, items, routines }. Each block gets its current name, owner and people.
// (Activities deleted since the plan was made are left out. No plan, or a date it doesn't have: no items, but the routines.)
function planDay(ds) {
  const wd = weekdayOf(ds), saved = hasPlan() && data.plan.dates[ds];
  const items = (saved ? saved.items : []).map(it => {
    const act = (it.fixed ? data.fixed : data.flexible).find(a => a.id === baseActId(it.actId));
    // (🗂️ a deleted activity kept as history on a day that's gone: drawn from what it remembers, look-only)
    const g = !act && it.gone, users = g ? g.users.filter(exists) : [];
    if (g) return users.length ? { ...it, name: g.name, users, people: g.people.filter(exists), helper: "", type: g.type } : null;
    return act ? { ...it, ...(isSecondId(it.actId) ? { second: true } : {}), name: act.name, users: act.users, people: peopleOf(act), helper: helperOf(act) ? act.helper : "", type: actTypeOf(act) } : null;
  }).filter(Boolean).sort((a, b) => a.start - b.start || b.fixed - a.fixed);
  // Strips (kept apart from activities: no checkbox, no points): routines, the fixed activities' get ready / break,
  // and the get ready / break around each planned flexible activity (not a deleted one's).
  const flexPads = items.filter(it => !it.fixed && !it.gone).flatMap(it => padsFor(data.flexible.find(a => a.id === baseActId(it.actId)), it.start, it.end));
  // (🏫 v180: a fixed activity changed for this date: its get ready / break move with it, or go when it didn't happen)
  const moved = data.fixed.filter(f => fixedOnOf(ds, f.id)), gone = new Set(moved.map(f => f.id));
  const rt = routinesOn(wd).filter(r => !(r.pad && [...gone].some(id => r.id.startsWith(`ready-${id}-`) || r.id.startsWith(`break-${id}-`))));
  moved.forEach(f => { const o = fixedOnOf(ds, f.id); if (!o.off) rt.push(...padsFor(f, toMin(o.start), toMin(o.end))); });
  return { date: ds, window: dayWindow(wd), items, routines: [...rt, ...flexPads].sort((a, b) => a.start - b.start) };
}
// This points week, Monday … Sunday (scores, reports, print, free time). null = no plan yet.
function planDays() { return hasPlan() ? weekDates().map(planDay) : null; }
// 🖨️ v216: paper shows the 7 days ahead (today … today + 6), the days the plan has: never past days, never a missing day
function printDays() { return hasPlan() ? aheadDates().map(planDay) : null; }
// The calendar's 12 dates: 5 days back, today, 6 days ahead (with no plan: just the routines)
const calDays = () => calDates().map(planDay);

// =====================================================================
//  THE COLORFUL WEEK (my plan, everyone's plan)
// =====================================================================
// Phone: a calendar opens on one day. Computer: on the whole week.
const isPhone = () => window.matchMedia("(max-width: 699px)").matches;
let viewDay = CAL_BACK;       // which of the calendar's 12 days is showing (0 = 5 days ago … CAL_BACK = today … 11 = today + 6)
let wholeWeek = !isPhone();   // true = show all 12 days
let weekShift = 0;             // 📅 v203 the Week view: 0 = this week (from ⚙️ its start day), -1 = last week, 1 = next week
let blocks = [];              // the blocks on screen, so we know which one was tapped

// The last calendar view and person, remembered on THIS device only (not in the family's data), e.g.
// { day: 2, mine: { week: true, who: { dad: "mody" } }, view: { mode: "full", who: "all" } }
const CAL_KEY = SAVE_KEY + ".calendar";
function calPrefs() { try { return JSON.parse(localStorage.getItem(CAL_KEY)) || {}; } catch (e) { return {}; } }
function saveCalPrefs() {
  const p = calPrefs();
  p.day = viewDay;
  if (screen === "mine" && exists(me)) p.mine = { week: wholeWeek, who: { ...((p.mine && p.mine.who) || {}), [me]: calWho } };
  try { localStorage.setItem(CAL_KEY, JSON.stringify(p)); } catch (e) {}
}
// 📅 A day strip always opens on TODAY (an old picked day is never brought back); a tapped day shows only until you leave the page
const savedDay = () => CAL_BACK;
// When the app comes back after a while (10+ minutes away), or at midnight while it's open: "today" is picked again everywhere
let dayAway = 0, lastToday = null;   // (set on the first check)
function backToToday() {
  viewDay = CAL_BACK; weekShift = 0; habitDay = weekIndex(); lastToday = todayYmd();
  calScrollFresh();
  if (exists(me)) render();
  scrollStripToToday();
}
// 📅 The calendar's sideways scroll (a phone's 12 days, or a narrow screen): it opens with TODAY in view, and stays where
// it was when the calendar is drawn again (a tick, a tap). id = the box the calendar is drawn in.
const calScroll = {};   // id → scrollLeft (missing = scroll to today next time)
function calScrollFresh() { Object.keys(calScroll).forEach(id => delete calScroll[id]); }
function keepCalScroll(id) { const sc = $(id) && $(id).querySelector(".k-scroll"); if (sc && hasOwn(calScroll, id)) calScroll[id] = sc.scrollLeft; }
function putCalScroll(id) {
  requestAnimationFrame(() => {
    const sc = $(id) && $(id).querySelector(".k-scroll");
    if (!sc) return;
    if (!hasOwn(calScroll, id)) {   // (today at the left, with a little of yesterday showing)
      const t = sc.querySelector(".k-day.today"), times = sc.querySelector(".k-time");
      if (t && sc.scrollWidth > sc.clientWidth)
        sc.scrollLeft += t.getBoundingClientRect().left - sc.getBoundingClientRect().left - (times ? times.offsetWidth : 0) - 24;
    } else sc.scrollLeft = calScroll[id];
    calScroll[id] = sc.scrollLeft;
  });
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { dayAway = Date.now(); if (!lastToday) lastToday = todayYmd(); return; }
  if ((lastToday && todayYmd() !== lastToday) || (dayAway && Date.now() - dayAway >= 10 * 60000)) backToToday();
});
setInterval(() => { if (!lastToday) lastToday = todayYmd(); else if (todayYmd() !== lastToday) backToToday(); }, 30000);   // (🌙 midnight: a new "today")
// The strip scrolls (when it's wider than the screen) so the picked day, or today, can be seen
function scrollStripToToday() {
  requestAnimationFrame(() => document.querySelectorAll(".k-days, .v-days").forEach(strip => {
    const t = strip.querySelector(".sel") || strip.querySelector(".istoday");
    if (t && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = t.offsetLeft - (strip.clientWidth - t.offsetWidth) / 2;
  }));
}
// Opening "My calendar": the last day, Day / Week and person (or today, and my own week)
function restoreMine() {
  const p = calPrefs(), m = p.mine || {};
  viewDay = savedDay(p); weekShift = 0;
  calScrollFresh();
  wholeWeek = typeof m.week === "boolean" ? m.week : !isPhone();
  const who = m.who && m.who[me];
  // 🧒 v212 (Broo2a): a parent coming from one kid's page or School opens THAT kid's calendar; a link to a kid's calendar
  // (📅 on the kid's card) keeps that kid; else the last one on this device
  if (calOpenKid === "all") { calOpenKid = null; calWho = "all"; return; }   // (📅 Everyone was asked for)
  const ctx = calOpenKid && exists(calOpenKid) ? calOpenKid
    : calOpenKid === "all" || !isParentDevice() ? null : screen === "school" && exists(schoolKid) ? schoolKid : screen === "kid" && exists(kidPage) ? kidPage : null;
  calOpenKid = null;
  if (ctx) { calWho = ctx; return; }
  if (calWho !== "all") calWho = who === "all" || exists(who) ? who : null;   // (a link to "Everyone" keeps "Everyone")
}
let calOpenKid = null;   // (📅 a kid's calendar was asked for: restoreMine opens it)

let navSubj = "";   // (🔍 v180: the "Find a subject" picker, in the days row of 📅 Calendar only)
// A small Day / Week switch, then ‹ Thu 23 · Fri 24 … › (the calendar's 12 dates). Phone: swiping also changes the day.
function navHtml(dates) {
  const today = todayYmd();
  return `<div class="k-nav"><div class="k-navrow">${navSubj}
      <div class="seg k-mode"><button class="${wholeWeek ? "" : "on"}" data-kmode="day">📆 Day</button>
        <button class="${wholeWeek ? "on" : ""}" data-kmode="week">📅 Week</button></div>
      <button class="pill small k-planbtn" data-dayplan="${wholeWeek ? today : calDates()[viewDay] || today}" aria-label="Day plan" title="This day's plan">📋 Plan</button></div>
    <div class="k-days"><button class="k-arrow" data-kprev aria-label="Previous ${wholeWeek ? "week" : "day"}">‹</button>${dates.map(ds => [ds, calDates().indexOf(ds)])
      // (v154: Day = only the day before, the day, the day after · Week = the 7 days shown)
      // (📱 v212 ✏️ Edit calendar: every day from today shows, so a session can be dropped on any of them)
      .filter(([ds, i]) => wholeWeek || (editMode && isParentId(me) ? ds >= today : Math.abs(i - viewDay) <= 1)).map(([ds, i]) => { const d = SHORT[weekdayOf(ds)];
      return `<button class="k-dbtn wd-${weekdayOf(ds)} ${i === viewDay && !wholeWeek ? "sel" : ""} ${ds === today ? "istoday" : ""} ${ds < today ? "past" : ""}" data-kday="${i}" data-date="${ds}"
        ${ds === today ? `aria-label="${d} (today)"` : ""}>${d}<small>${fromYmd(ds).getDate()}</small></button>`; }).join("")}<button class="k-arrow" data-knext aria-label="Next ${wholeWeek ? "week" : "day"}">›</button></div></div>`;
}

// 🧸 v159: a 3D icon for an activity, from words in its name (icons/3d, see ico3d in home.js); unknown → by its type
const ACT_ICONS = [[/break|get ready|lunch|dinner|breakfast|meal|bed|sleep|shower/i, "time"], [/quran|read|book|story|library|arabic|english|reading/i, "read"], [/math|maths|number/i, "class"], [/science|research|lab/i, "research"],
  [/music|piano|sing/i, "music"], [/art|draw|paint|craft/i, "palette"], [/homework|worksheet/i, "homework"], [/exam|test|quiz/i, "exam"], [/bus/i, "bus"], [/school|class/i, "school"],
  [/football|sport|gym|swim|karate|run|exercise|club|basket|tennis/i, "basketball"],
  [/study|revision|revise|practi[cs]e|lesson|tutor/i, "study"], [/pray|salah/i, "consistency"]];
function actIcon3d(name, type, cls = "k-ic") {
  const hit = ACT_ICONS.find(([re]) => re.test(name || "")), n = hit ? hit[1] : type === "study" || type === "schoolapp" ? "study" : type === "sport" ? "basketball" : type === "routine" ? "time" : type === "free" || type === "family" ? "rainbow" : "goal";
  return ico3d(n, cls);
}
// What a block shows: big title, colors, and a smaller line underneath.
function blockInfo(b) {
  const withDad = b.helper ? ` · ${withText(b)}` : "";   // (🤝 with the helping parent)
  const subject = findSubject(b.name), te = actTypeInfo(b.type || "activity")[1];   // (⭐ the type's emoji next to the name)
  // Fixed activities (School, Gym, Work …) and shared ones (several people): soft grey, with a small colored dot
  // for each person, so each person's own lessons stand out in their color.
  if (b.fixed || b.users.length > 1) {
    const what = `${te} ${b.fixed || !subject ? b.name : subject.name}`;
    return { title: what, titleHtml: safe(what), emoji: b.fixed ? (isSchoolName(b.name) ? "🏫" : "📌") : emojisOf(b.users),
             soft: GREY.soft, ink: GREY.ink, line: GREY.color, dots: b.users,
             what: namesOf(b.users) + withDad };
  }
  // One person's lesson: light background of their color, darker left border, dark text
  // (titleHtml: the same with a parent's 🖼️ photo instead of their emoji)
  const c = colorsOf(userById(b.users[0]));
  return { title: `${emojisOf(b.users)} ${namesOf(b.users)}`, titleHtml: `${safe(namesOf(b.users))}`, emoji: emojisOf(b.users),
           soft: c.soft, ink: c.ink, line: c.color, what: `${te} ${subject ? subject.name : b.name}` + withDad };
}
// The colors of a block, the same on screen and on paper: one person's lesson → their color; fixed or shared → grey
function blockColors(it) {
  const c = it.fixed || it.users.length > 1 ? GREY : colorsOf(userById(it.users[0]));
  return `--c:${c.color};--soft:${c.soft};--ink:${c.ink}`;
}
// The day header for a date: name and date on ONE line, the same for every day, e.g. "Thu 23 Oct" (calendar, View all plan, print)
function dayHead(ds) { const dt = fromYmd(ds); return `${SHORT[weekdayOf(ds)]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`; }
// Small colored dots, one per person (for fixed and shared activities)
function dotsHtml(ids) {
  return `<span class="k-dots">${ids.map(id => { const u = userById(id);
    return `<i style="background:${colorsOf(u).color}" title="${safe(u.name)}"></i>`; }).join("")}</span>`;
}

// Draws the days as colorful cards. days = planDay()s (📅 the calendar's 12 dates: 5 back, today, 6 ahead).
// opts.only = show only this person's blocks; opts.fade = fade blocks that aren't this person's;
// opts.readOnly = just for looking (no "done" checkboxes). Past days are always look-only (their ticks show, nothing moves).
function weekHtml(days, opts) {
  const today = todayYmd(), dates = days.map(x => x.date);
  blocks = [];
  const sessCache = {}, sessOf = id => sessCache[id] || (sessCache[id] = sessionsIn(id, dates));   // 📚 each person's study sessions on these dates
  const dayParts = [];   // each day's cards and strips, with their start time
  days.forEach(day => {
    const ds = day.date, past = ds < today;
    let items = opts.only ? day.items.filter(it => it.people.includes(opts.only)) : day.items;
    // One block per activity, with one "done" circle per person ("acts").
    // On someone's own plan, only their own circle shows (Dad helping with a lesson sees the kid's circle).
    // Two separate fixed activities with the same name and time (like School) also become one block.
    const merged = [];
    for (const it of items) {
      const who = opts.only && it.users.includes(opts.only) ? [opts.only] : it.users;
      const acts = who.map(user => ({ user, actId: it.actId }));
      const same = it.fixed && merged.find(b => b.fixed && b.name === it.name && b.start === it.start && b.end === it.end && b.helper === it.helper);
      if (same) { same.users = [...new Set([...same.users, ...it.users])]; same.acts.push(...acts); same.people = [...new Set([...same.people, ...it.people])]; }
      else merged.push({ ...it, acts });
    }
    // Everything on this day in time order: activity blocks and thin routine strips
    const parts = [];
    // Routines: a thin grey strip with only the emoji and name (no time, no checkbox). Tap it for the details.
    // On a shared view, small emojis show who it's for (none when it's everyone).
    routineStrips(day.routines, opts.only).forEach(s => {
      const faded = (opts.fade && opts.fade !== "all" && !s.users.includes(opts.fade)) || !!opts.subj;   // (📚 a subject picked: faded)
      const n = blocks.push({ ...s, day: ds, soft: "#f1f2f6", ink: "#6b7280" }) - 1;
      parts.push({ start: s.start, end: s.end, strip: true, padId: s.pad ? s.id : null, html: `<div class="k-routine ${s.pad ? "pad" : ""} ${faded ? "faded" : ""}" data-kblock="${n}" role="button" tabindex="0"
          title="${safe(s.name)} · ${clock(s.start, true)}–${clock(s.end, true)}"><span class="r-nm">${actIcon3d(s.name, "routine", "r-ic")}${safe(s.name)}</span>${
          !opts.only && !isEveryone(s.users) ? `<span class="r-who">${namesTag(s.users)}</span>` : ""}</div>` });
    });
    // 📌 School dates with a time: a strip at that time (all-day ones are under the day name). Never planned around.
    eventsOn(ds, opts.only || null).filter(e => e.time).forEach(e =>
      parts.push({ start: toMin(e.time), end: toMin(e.time) + 30, strip: true, html: eventHtml(e, opts.only || null) }));
    // 📅 A parent's own activity with a time: a card in their color with their name (✅ only that parent ticks it)
    const pacts = pactsOn(ds, opts.only || null).filter(a => a.type !== "travel" && a.from);
    pacts.forEach(a => parts.push({ start: toMin(a.from), end: toMin(a.to), html: pactCardHtml(a, ds, opts) }));
    // 📌 One-day events (only that person's on their own calendar; never a tick)
    const odays = oneDayOn(ds).filter(e => !opts.only || e.who.includes(opts.only));
    odays.forEach(e => parts.push({ start: toMin(e.from), end: toMin(e.to), html: oneDayCardHtml(e, ds, opts) }));
    if (!merged.length && !pacts.length && !odays.length) parts.push({ free: true, start: -1, html: `<div class="k-free">${past ? "Nothing planned" : "Free day! 🎉"}</div>` });
    // 🎈 v182 (Broo2a): an empty gap of 45 minutes or more on one person's calendar (today from now, and the days ahead):
    //  a "Free time" strip → 🎈 ideas, and for a parent ➕ add an activity there
    if (opts.only && !opts.drag && !opts.readOnly && ds >= today) freeGaps(ds, opts.only, day, pacts, odays).forEach(([gs, ge]) =>
      parts.push({ start: gs, ...(opts.whole || wholeWeek ? { end: ge } : { end: gs + 1, strip: true }), html: `<div class="k-gap"><span>🎈 Free ${clock(gs, true)}–${clock(ge, true)}</span>
        <button class="pill small" data-freeopen="${safe(opts.only)}">💡 Ideas</button>${isParentDevice()
          ? `<button class="pill small" data-gapadd="${ds}|${safe(opts.only)}|${gs}|${ge}">➕ Add</button>` : ""}</div>` }));
    // 🕌 Prayer times (only for people who want them): inside the activity happening then, otherwise a thin line of its own
    const prays = prayersOn(ds), inPrayer = new Set();
    const praysIn = b => prays.filter(p => b.start <= p.start && p.start < b.end);
    merged.forEach(b => praysIn(b).forEach(p => inPrayer.add(p)));
    prays.filter(p => !inPrayer.has(p)).forEach(p => parts.push({ start: p.start, end: p.start + 1, strip: true, html: prayLineHtml(p, false) }));
    // 🌙 v180 Bedtime: one thin line per bedtime (kids with the same time share it). After the day's end: shown at the end.
    const [, dayEnd] = day.window || [0, 24 * 60];
    // (a shared view: ONE line at the first bedtime, with each time's kids in it, so the lines don't squeeze side by side)
    const beds = bedGroups(ds, opts.only || null);
    if (beds.length) { const at = Math.min(beds[0].min, dayEnd - 1);
      parts.push({ start: at, end: at + 1, strip: true, html: `<div class="k-bed ${beds.some(g => g.tonight) ? "tonight" : ""}">🌙 Bedtime ${beds.map(g => bedLineHtml(g, ds, opts)).join("")}</div>` }); }
    merged.forEach(b => {
      const info = blockInfo(b);
      // 🤝 On the helping parent's own calendar: the kid's activity shows faded, as "helping"
      const helping = !!opts.only && b.helper === opts.only && !b.users.includes(opts.only);
      // (📚 the subject filter: only that subject's sessions stand out)
      // (✨ v180 Broo2a: a parent's "🤝 helping" sessions are bright on their own calendar, not faded: they're the parent's job too)
      const faded = (opts.fade && opts.fade !== "all" && !b.people.includes(opts.fade) && !(b.helper && b.helper === opts.fade)) || (!!opts.subj && !subjMatch(b, ds, opts, sessOf));
      const kidActs = b.acts.filter(a => !isParentId(a.user));   // (only the kids' parts are ticked)
      const done = kidActs.length > 0 && kidActs.every(a => isDone(ds, a.actId, a.user));
      const n = blocks.push({ ...b, ...info, day: ds }) - 1;
      // The round "done" checkbox: one per person (a shared block like School has one for each kid).
      // View only (opts.readOnly): no checkboxes, just "Done!" when it's finished.
      // (👨‍👩‍👧 a parent's own activity: no tick for points, parents aren't scored)
      const checks = opts.readOnly ? "" : b.acts.filter(a => !isParentId(a.user)).map(a => {
        const on = isDone(ds, a.actId, a.user), owner = userById(a.user), parentPast = past && parentPastTick(ds, a.user);
        const allowed = ((isParentId(me) || a.user === me) && ds === today) || parentPast;
        // ⏰ Everyone: locked (grey 🔒) until the start time; a tap says when (see tickTimeLock). Future days: locked too.
        const timeLock = !on && (ds > today || tickTimeLock(ds, b.start) != null);
        if (timeLock && (isParentId(me) || a.user === me)) return `<button class="k-check time-lock" data-check="${ds}|${safe(a.actId)}|${safe(a.user)}" style="--c:${colorsOf(owner).color}"
                  data-at="${safe(ds > today ? SHORT[weekdayOf(ds)] : clock(b.start, true))}"
                  aria-label="${safe(`Locked until ${ds > today ? dayName(ds) : clock(b.start, true)}: ${b.name}`)}" title="${safe(ds > today ? `On ${dayName(ds)}` : `At ${clock(b.start, true)}`)}">🔒</button>`;
        const label = `${on ? "Done! Tap to untick" : ds > today ? "Not yet" : "Tap when done"}: ${owner.name}, ${b.name}`;
        // 🔒 A kid's device: someone else's tick is only a picture (look-only, no button). 📅 Past days: look-only
        // (except 👨‍👩‍👧 a parent's device on an earlier day of this week: see parentPastTick)
        if (kidLockedOut(a.user) || b.gone || (past && !parentPast)) return `<span class="k-check ${on ? "on" : ""}" role="img" style="--c:${colorsOf(owner).color}"
                  aria-label="${safe(`${on ? "Done" : "Not done"}: ${owner.name}, ${b.name}`)}">${on ? "✓" : b.acts.length > 1 ? `<span class="e">${safe(owner.emoji)}</span>` : ""}</span>`;
        return `<button class="k-check ${on ? "on" : ""}" data-check="${ds}|${safe(a.actId)}|${safe(a.user)}" ${allowed ? "" : "disabled"}
                  style="--c:${colorsOf(owner).color}" aria-pressed="${on}" aria-label="${safe(label)}" title="${safe(label)}">
                  ${on ? "✓" : b.acts.length > 1 ? `<span class="e">${safe(owner.emoji)}</span>` : ""}</button>`;
      }).join("");
      // Bro2a can drag flexible activities (not fixed ones). A moved one has a 📌 (Bro2a taps it to unpin).
      // Edit mode (Bro2a): flexible activities get a ✥ handle and a dashed border and can be moved;
      // fixed ones look locked 🔒. A moved one has a 📌 (tap it in edit mode to unpin).
      // (📅 only today and the days ahead: past days never move)
      const movable = opts.drag && !b.fixed && !b.gone && !past;
      const drag = movable ? `data-drag="${ds}|${safe(b.actId)}"` : "";
      const pin = !b.pinned ? "" : movable
        ? `<button class="k-pin" data-unpin="${ds}|${safe(b.actId)}" title="Moved by hand. Tap to unpin" aria-label="Pinned. Tap to unpin">📌</button>`
        : `<span class="k-pin" title="Placed by ${safe(dadName())}">📌</span>`;
      const mark = !opts.drag ? "" : b.fixed || past ? `<span class="k-lock" title="${b.fixed ? "Fixed: can't be moved here" : "A past day: can't be moved"}">🔒</span>` : `<span class="k-handle" aria-hidden="true">✥</span>`;
      // ⇄ = something else on this day happens at the same time (tap it to see what)
      const same = sameTimeText(b, merged);
      const sameBtn = same ? `<button class="k-same" data-same="${safe(same)}" title="${safe(same)}" aria-label="${safe(same)}">⇄</button>` : "";
      // Narrow card (side by side): a short title (emoji + name) instead of the full one.
      // Fixed or shared: just the colored dots, not everyone's names (tap the card for the full details).
      const subject = findSubject(b.name), te = actTypeInfo(b.type || "activity")[1];
      // (as HTML: a parent's 🖼️ photo instead of their emoji)
      // (🫧 v160: the 3D icon is the only picture: no type emoji next to it)
      const nm = safe(b.fixed || !subject ? b.name : subject.name);
      const shortHtml = b.fixed || b.users.length > 1 ? nm : `${namesTag(b.users)} ${safe(subject ? subject.name : b.name)}`;
      // Line 2 = time, then the dots (shared) or the type + name, then 🤝 with the helping parent ("🤝 helping" on their own calendar)
      const whatHtml = [info.dots ? "" : safe(`${subject ? subject.name : b.name}`), helping ? "🤝 helping" : b.helper ? withHtml(b) : ""].filter(Boolean).join(" · ");
      // 📚 A study session: its result ("✅ 85%", "⏳ 👩 Mum rates it"), or 📖 "📚 Start session" (today only, not while moving cards)
      const sess = b.type === "study" && !opts.drag ? b.acts.map(a => sessOf(a.user).find(x => x.date === ds && x.actId === a.actId)).filter(Boolean) : [];
      const sessHtml = sess.map(x => { const tag = sessionTagText(x), who = sess.length > 1 ? userById(x.person).emoji + " " : "";
        const can = !opts.readOnly && x.mode === "sole" && ds === today && (x.person === me || isParentId(me)) && !kidLockedOut(x.person);
        // 📚 Everything about a session is HERE, and only once its time has come (v154): before the start: "🔒 Opens at 4:15 PM";
        // from the start: "Which subject today?" (several subjects allowed) → the pick starts the session, else 📚 Start session;
        // its worksheet made: 📝 My worksheet (+ ➕ More questions / 🙋 I'm done while it lasts)
        const mine = !opts.readOnly && x.mode === "sole" && (x.person === me || isParentId(me)) && !kidLockedOut(x.person);
        const ids = sessionWsIds(x.key), wsId = ids[ids.length - 1], w = wsId && aiDocs.worksheets[wsId], live = ds === today && !x.ended;
        if (mine && live && sessionNotYet(x)) return `<span class="k-sesstag">${safe(who)}🔒 Opens at ${clock(x.start, true)}</span>`;
        if (mine && live && x.needsPick && !ids.length) return `${safe(who)}${subjectPickHtml(x, true)}`;
        const picked = x.options.length > 1 && !x.needsPick ? `<span class="k-sesstag">${safe(who)}📚 ${safe(x.subject)}</span> ` : "";
        if (tag) return picked + `<span class="k-sesstag">${safe(who + tag)}</span>`;
        if (!can) return picked;
        if (!w) return picked + (live ? `<button class="k-sess" data-sessstart="${safe(x.key)}" data-aiwait="session|${safe(x.key)}">${safe(who)}📚 Start session</button>` : "");
        const more = live && (w.answers.length || w.check || w.done);
        return picked + `<button class="k-sess" data-sessstart="${safe(x.key)}">${safe(who)}📝 My worksheet</button>${
          more ? ` <button class="k-sess" data-sessmore="${safe(x.key)}" data-aiwait="more|${safe(x.key)}">➕ More questions</button>`
          : live && !w.check ? ` <button class="k-sess" data-sessdone="${safe(wsId)}">🙋 I'm done</button>` : ""}`; }).join(" ");
      parts.push({ start: b.start, end: b.end, padIds: padIdsOf(b), html: `<div class="k-block ${b.fixed ? "fixed" : ""} ${checks && b.acts.length > 1 ? "many" : ""} ${drag ? "draggable editable" : ""} ${opts.drag && (b.fixed || past) ? "locked" : ""} ${faded ? "faded" : ""} ${done ? "done" : ""}" data-kblock="${n}" role="button" tabindex="0" ${drag}
                 style="--soft:${info.soft};--ink:${info.ink};--line-c:${info.line}">
        ${mark}${pin}<span class="k-checks">${checks}${done ? `<span class="k-donetag">Done!</span>` : ""}</span>
        <span class="who">${sameBtn}${actIcon3d(b.name, b.type)}<span class="t-full">${b.fixed || b.users.length > 1 ? nm : info.titleHtml}</span><span class="t-short">${shortHtml}</span></span>
        <span class="k-sub">${b.second ? `<span class="k-2nd" title="The 2nd session today">2nd</span> ` : ""}<span class="when">${clock(b.start)} - ${clock(b.end)}</span>${info.dots ? " " + dotsHtml(info.dots) : ""}${whatHtml
          ? ` <span class="what">${whatHtml}</span>` : ""}</span>${sessHtml ? `<span class="k-sessrow">${sessHtml}</span>` : ""}${praysIn(b).map(p => prayLineHtml(p, true)).join("")}</div>` });
    });
    // 🕗 Only that day's time (Day starts at … Day ends at): anything wholly before or after it isn't drawn
    const [ws, we] = day.window || [0, 24 * 60];
    dayParts.push(parts.filter(p => p.free || (p.end > ws && p.start < we)).sort((a, b) => a.start - b.start));
  });
  // ✈️ Travel: one bar across its days (under the day names)
  const bars = travelBars(opts.only || null, dates).map(x => ({ ...x, html: travelBarHtml(x, opts) }));
  // opts.whole = always all the days, without the Day / Week switch (View all plan → "🗓️ Full week")
  return (opts.whole ? "" : navHtml(dates)) + weekRowsHtml(dayParts, d => { const ds = dates[d];
    return `<div class="k-dayname wd-${weekdayOf(ds)}" ${ds === today ? `title="Today"` : ""}><span class="k-daynum">${fromYmd(ds).getDate()}</span>${ds === today ? "Today · " : ""}${dayHead(ds)}</div>${dayHoursHtml(ds, opts)}${examTagsHtml(ds, opts.only || null)}${countdownHtml(ds, opts.only || null)}${
      eventsOn(ds, opts.only || null).filter(e => !e.time).map(e => eventHtml(e, opts.only || null)).join("")}${
      pactsOn(ds, opts.only || null).filter(a => a.type !== "travel" && !a.from).map(a => pactDayHtml(a, ds, opts)).join("")}`; }, opts.whole || wholeWeek, bars, dates);
}

// 🎈 v182 The empty gaps of one person on one date: [[from, to]] (45 minutes or more, inside the day and before bedtime)
function freeGaps(ds, who, day, pacts, odays) {
  const [ws, we0] = day.window || [0, 0], bed = bedMin(who, ds), we = bed != null ? Math.min(we0, bed) : we0;
  const from = ds === todayYmd() ? Math.max(ws, Math.ceil(dubaiMinutes() / 15) * 15) : ws;
  if (from >= we) return [];
  const busy = [...day.items.filter(it => it.people.includes(who)).map(it => [it.start, it.end]),
    ...day.routines.filter(r => (r.users || []).includes(who)).map(r => [r.start, r.end]),
    ...pacts.filter(a => a.from).map(a => [toMin(a.from), toMin(a.to)]),
    ...odays.map(e => [toMin(e.from), toMin(e.to)])];
  return cutOut([from, we], busy).filter(([a, b]) => b - a >= 45);
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-gapadd]"); if (!b || !isParentDevice()) return;
  const [ds, who, gs, ge] = b.dataset.gapadd.split("|");
  openDayFix(ds, [who], [[Number(gs), Number(ge)]]);
});
// 🌙 v180 Bedtime lines on one date: [{ min, kids: [ids] }] (one kid's calendar: only theirs; a parent's own: none)
function bedGroups(ds, only) {
  const kids = only ? (isParentId(only) ? [] : [only]) : kidsList().map(k => k.id);
  const by = {};
  kids.forEach(id => { const b = bedMin(id, ds); if (b != null) (by[b] = by[b] || []).push(id); });
  return Object.keys(by).map(Number).sort((a, b) => a - b).map(min => ({ min, kids: by[min], tonight: by[min].some(id => data.bedOn && data.bedOn[`${ds}|${id}`]) }));
}
// The line: "🌙 Bedtime 8:30 PM" (+ the kids' faces on a shared view). A parent (today and later): a time picker to change
// it for THIS night only (the usual times are in ⚙️ Settings → 🌙 Bedtimes).
function bedLineHtml(g, ds, opts) {
  const faces = opts.only ? "" : ` <span class="r-who">${namesTag(g.kids)}</span>`;
  const tonight = g.tonight;
  const can = isParentDevice() && !opts.readOnly && ds >= todayYmd();
  const hm = m => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const opt = [];
  for (let m = 18 * 60; m < 24 * 60; m += 15) opt.push(`<option value="${hm(m)}" ${m === g.min ? "selected" : ""}>${clock(m, true)}</option>`);
  const pick = can ? `<select class="bed-pick" data-bedset="${ds}|${safe(g.kids.join(","))}" aria-label="Change bedtime for this night"
      title="Change it for this night only">${opt.join("")}${tonight ? `<option value="usual">↩️ Usual time</option>` : ""}</select>`
    : `<b>${clock(g.min, true)}</b>`;
  return `<span class="bed-g" title="🌙 Bedtime${tonight ? " (this night only)" : ""}">${pick}${faces}${tonight ? ` <small>this night</small>` : ""}</span>`;
}
// A parent changed one night's bedtime: kept for that date; anything planned for those kids after it (not ticked, not 📌, not fixed)
// is taken off and placed again earlier if there's room (like a 📌 one-day event)
function setBedTonight(key, val) {
  const [ds, ids] = key.split("|"), kids = ids.split(",").filter(exists);
  if (!isParentId(me) || !kids.length) return;
  data.bedOn = data.bedOn || {};
  kids.forEach(id => { if (val === "usual" || toMin(val) === bedUsual(id, weekdayOf(ds))) delete data.bedOn[`${ds}|${id}`]; else data.bedOn[`${ds}|${id}`] = val; });
  let moved = 0;
  if (hasPlan() && data.plan.dates[ds]) {
    const items = data.plan.dates[ds].items, keep = items.filter(it => {
      if (it.fixed || it.pinned || it.gone) return true;
      const act = data.flexible.find(a => a.id === baseActId(it.actId)); if (!act) return true;
      const late = peopleOf(act).some(p => kids.includes(p) && bedMin(p, ds) != null && it.end > bedMin(p, ds));
      const ticked = Object.keys(data.points.marks).some(k => k.startsWith(`${ds}|${it.actId}|`));
      return !late || ticked;
    });
    moved = items.length - keep.length;
    data.plan.dates[ds].items = keep;
    if (moved) makeAndKeepPlan("fill");
  }
  writeData();
  render();
  toast(`🌙 Bedtime changed for ${dayName(ds)} only${moved ? `. ${moved} ${moved === 1 ? "activity was" : "activities were"} moved earlier (or off, if there was no room)` : ""}.`, 3500);
}
document.addEventListener("change", e => { const t = e.target; if (t.dataset && t.dataset.bedset) setBedTonight(t.dataset.bedset, t.value); });

// Rows by time of day: every different start time in the week (to the nearest 15 minutes) is one row,
// sorted from morning to night, so things that start at the same time line up across the week.
// A card starts in the row of its start time and spans down over every row until its end time.
// Things on the same day that overlap get their own lane (side by side), so no card hides another.
const slot15 = min => Math.round(min / 15) * 15;
// "7:30 AM"
function rowTime(min) { return `${clock(min)} ${min >= 12 * 60 ? "PM" : "AM"}`; }
// "At the same time as: Gym (Bro2a)" — the other activities this day that overlap it (empty when none)
function sameTimeText(b, list) {
  const others = list.filter(o => o !== b && o.start < b.end && b.start < o.end);
  return others.length ? "At the same time as: " + others.map(o => `${o.name} (${namesOf(o.users)})`).join(", ") : "";
}
// The ids of an activity's own "Get ready" and "Break" strips (see padsFor), so they can be glued to its card
function padIdsOf(it) {
  return (it.acts ? it.acts.map(a => a.actId) : [it.actId]).flatMap(id => [`ready-${id}-${it.start}`, `break-${id}-${it.end}`]);
}
// Works out the rows and, for each day, each thing's row, how many rows it spans, its lane and how many lanes wide it is.
// dayParts = per day a list of { start, end, html, strip, padId, padIds, free }.
// grid = 📅 v203 (Broo2a) the Week view: a real hour grid (every 15 minutes is a row, even empty ones) from the earliest
// thing to the latest one (at least the days' own time), so a longer thing is a taller card and the times never jump.
function rowLayout(dayParts, grid = false, span = null) {
  // "Get ready" / "Break" never get a lane of their own: they're glued above / below their own activity's card
  dayParts = dayParts.map(parts => {
    const cards = parts.filter(p => p.padIds);
    const rest = [];
    parts.forEach(p => {
      const card = p.padId && cards.find(c => c.padIds.includes(p.padId));
      if (!card) return rest.push(p);
      if (p.padId.startsWith("ready-")) card.above = (card.above || "") + p.html;
      else card.below = (card.below || "") + p.html;
    });
    return rest.map(p => p.above || p.below ? { ...p, html: (p.above || "") + p.html + (p.below || "") } : p);
  });
  let times = [...new Set(dayParts.flatMap(parts => parts.filter(p => !p.free).map(p => slot15(p.start))))].sort((a, b) => a - b);
  if (grid && (times.length || span)) {
    const all = dayParts.flatMap(parts => parts.filter(p => !p.free));
    let lo = Math.min(...all.map(p => p.start), ...(span ? [span[0]] : [])), hi = Math.max(...all.map(p => p.end), ...(span ? [span[1]] : []));
    if (span) { lo = Math.max(lo, span[0]); hi = Math.min(hi, span[1]); }   // (an all-day fixed thing like "Play time 12:30 AM" doesn't stretch the grid)
    lo = Math.floor(lo / 60) * 60; hi = Math.max(lo + 60, Math.ceil(hi / 60) * 60);
    times = []; for (let t = lo; t < hi; t += 15) times.push(t);
  }
  const rowOf = min => { if (!grid) return times.indexOf(slot15(min)); const i = (slot15(min) - times[0]) / 15; return Math.max(0, Math.min(times.length - 1, i)); };
  const rows = times.length ? times : [null];   // (a week with nothing: one empty row)
  const days = dayParts.map(parts => {
    let items = [];
    parts.filter(p => !p.free).sort((a, b) => a.start - b.start).forEach(p => {
      const r0 = rowOf(p.start);
      // Two things in the same row that don't really overlap (e.g. 5:00–5:20 and 5:20): one under the other, same lane
      // (a card that stretches over several columns — View all plan — always stays on its own)
      const prev = !p.solo && items.find(o => !o.solo && o.r0 === r0 && o.end <= p.start);
      if (prev) { prev.html += p.html; prev.end = Math.max(prev.end, p.end); prev.strip = prev.strip && !!p.strip; }
      else items.push({ r0, start: p.start, end: p.end, html: p.html, strip: !!p.strip, solo: !!p.solo, key: p.key, first: p.first });
    });
    // A card spans down over the rows until its end time (routine strips stay one row high) …
    items.forEach(it => it.n = it.strip ? 1 : Math.max(1, times.filter(t => t >= times[it.r0] && t < it.end).length));
    // … but stops above anything that starts after it has ended (the rows are rounded to 15 minutes)
    items.forEach(it => items.forEach(o => { if (o !== it && o.r0 > it.r0 && o.r0 < it.r0 + it.n && o.start >= it.end) it.n = o.r0 - it.r0; }));
    items.sort((a, b) => a.r0 - b.r0 || b.n - a.n);
    // Groups of things that really overlap each other. Only a group is split into lanes:
    // 2 together → halves, 3 → thirds. Anything with nothing else at its time keeps the full width.
    const groups = [];
    let group = null, groupEnd = -1;
    items.forEach(it => {
      if (!group || it.r0 > groupEnd) { group = []; groups.push(group); groupEnd = -1; }
      group.push(it);
      groupEnd = Math.max(groupEnd, it.r0 + it.n - 1);
    });
    const meets = (a, b) => a.r0 <= b.r0 + b.n - 1 && b.r0 <= a.r0 + a.n - 1;
    groups.forEach(g => {
      // Each thing goes in the first lane that's free from its first row …
      const ends = [];
      g.forEach(it => {
        let lane = ends.findIndex(e => e < it.r0);
        if (lane < 0) lane = ends.length;
        ends[lane] = it.r0 + it.n - 1;
        it.lane = lane;
      });
      // … then gets wider to the right, as long as nothing in those lanes shares its rows (so no lane is left empty)
      g.forEach(it => {
        const right = g.filter(o => o.lane > it.lane && meets(it, o)).map(o => o.lane);
        it.w = (right.length ? Math.min(...right) : ends.length) - it.lane;
        it.lanes = ends.length;
      });
    });
    // The day's columns: enough small columns for every group (e.g. halves and thirds → 6 columns)
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const L = items.reduce((l, it) => l * it.lanes / gcd(l, it.lanes), 1);
    items.forEach(it => { const k = L / it.lanes; it.lane *= k; it.w *= k; it.narrow = it.w < L; });
    return { items, L, free: parts.find(p => p.free) };
  });
  return { rows, days };
}
// bars = ✈️ travel bars, each across its days: [{ d0, d1, html }] (one row each, right under the day names)
// dates = each column's date (📅 today is highlighted; the days before it are greyed a little: look-only)
function weekRowsHtml(dayParts, headHtml, whole = wholeWeek, bars = [], dates = []) {
  const today = dates.indexOf(todayYmd());
  // (📅 v203 the Week view: an hour grid over the days' own time, "My day" in ⚙️ Settings)
  const wins = dates.filter(Boolean).map(ds => dayWindow(weekdayOf(ds)));
  const grid = whole && wins.length > 0, span = grid ? [Math.min(...wins.map(w => w[0])), Math.max(...wins.map(w => w[1]))] : null;
  const { rows, days } = rowLayout(dayParts, grid, span);
  const B = bars.length;
  const last = rows.length + 2 + B;             // the day names row + the bars + the rows + a little space at the bottom
  const cls = d => `${d === today ? "today" : ""} ${today >= 0 && d < today ? "past" : ""} ${d === viewDay ? "sel" : ""}`;
  // Columns: the time labels, then each day's lanes (one lane, or more when things overlap), with a small gap between days.
  // Computer: the 7 days share the width equally (each day = 1fr, split into its lanes), so there's no sideways scroll.
  // --cols = computer, --cols-wide = phone week (scrolls sideways), --cols-day = phone one day.
  const fluid = ["48px"], wide = ["auto"], one = ["auto"], first = [];
  let col = 2;
  days.forEach((x, d) => {
    if (d) { fluid.push("6px"); wide.push("6px"); one.push("0px"); col++; }
    first[d] = col;
    col += x.L;
    // Phone week: a day with things side by side is wider (at least 80px for each of them)
    const dayMin = Math.max(150, 80 * Math.max(1, ...x.items.map(it => it.lanes)));
    for (let i = 0; i < x.L; i++) {
      const lane = `${(dayMin / x.L).toFixed(2)}px`, fr = `${(1 / x.L).toFixed(4)}fr`;
      fluid.push(`minmax(0,${fr})`); wide.push(lane); one.push(d === viewDay ? `minmax(0,${fr})` : "0px");
    }
  });
  let html = `<div class="k-scroll ${whole ? "wide" : ""}"><div class="k-week rows ${whole ? "" : "one-day"} ${grid ? "k-grid" : ""}"
    style="--cols:${fluid.join(" ")};--cols-wide:${wide.join(" ")};--cols-day:${one.join(" ")};grid-template-rows:auto ${B ? `repeat(${B}, auto) ` : ""}repeat(${rows.length}, ${grid ? "minmax(var(--slot-h, 18px), auto)" : "auto"}) 6px">
    <div class="k-corner"></div>`;
  days.forEach((x, d) => {
    const span = `grid-column:${first[d]} / span ${x.L}`;
    // Each day's white card is drawn behind its column, from the day name to the bottom
    html += `<section class="k-day ${cls(d)}" data-day="${d}" ${dates[d] ? `data-date="${dates[d]}"` : ""} style="${span};grid-row:1 / ${last + 1}"></section>
      <div class="k-cell k-head ${cls(d)}" style="${span};grid-row:1">${headHtml(d)}${x.free ? x.free.html : ""}</div>`;
    x.items.forEach(it => {
      const pad = `padding-left:${it.lane ? 1 : 6}px;padding-right:${it.lane + it.w < x.L ? 1 : 6}px`;
      html += `<div class="k-cell ${it.strip ? "k-stripcell" : "k-span"} ${it.narrow ? "narrow" : ""} ${cls(d)}"
        style="grid-column:${first[d] + it.lane} / span ${it.w};grid-row:${it.r0 + 2 + B} / span ${it.n};${pad}">${it.html}</div>`;
    });
  });
  // ✈️ The travel bars (on the phone's one-day view: only the ones on that day)
  bars.forEach((bar, i) => html += `<div class="k-cell k-barcell ${bar.d0 <= viewDay && viewDay <= bar.d1 ? "sel" : ""}"
    style="grid-column:${first[bar.d0]} / ${first[bar.d1] + days[bar.d1].L};grid-row:${i + 2}">${bar.html}</div>`);
  // The time labels (on the phone's one-day view: only the times that day has)
  rows.forEach((t, r) => {
    const used = (days[viewDay] || { items: [] }).items.some(it => it.r0 === r);
    // (📅 the hour grid: a label on each full hour only, and a thin line across the week)
    if (grid) { if (t % 60 === 0) html += `<div class="k-time k-hour" style="grid-row:${r + 2 + B}"><span class="k-tpill">${rowTime(t)}</span></div>
      <div class="k-hline" style="grid-column:2 / -1;grid-row:${r + 2 + B}" aria-hidden="true"></div>`; return; }
    html += `<div class="k-time ${used ? "" : "not-sel"}" style="grid-row:${r + 2 + B}">${t === null ? "" : `<span class="k-tpill">${rowTime(t)}</span>`}</div>`;
  });
  return html + `</div></div>`;
}

// The big card: who, what, day, start and end
function openCard(b) {
  if (b.routine) return openRoutineCard(b);
  if (b.pact) return openPactCard(b);
  if (b.oneDay) return openOneDayCard(b);
  const flex = !b.fixed && data.flexible.find(a => b.acts.some(x => baseActId(x.actId) === a.id));
  // 🎨 v182 (Broo2a): new look. Top = icon + what it is + type; a "when" box (day, time, minutes);
  //   small tiles for who / helper / done; one ✏️ for the activity (top) and one for the time (when box)
  const subj = !b.fixed && findSubject(b.name), what = b.fixed ? b.name : subj ? subj.name : b.name;
  const [, tEmoji, tWord] = actTypeInfo(b.type || "activity");
  const kids = b.acts.filter(a => !isParentId(a.user));
  const doneHtml = kids.map(a => { const ok = isDone(b.day, a.actId, a.user);
    return `<span class="kc2-done ${ok ? "yes" : ""}">${kids.length > 1 ? safe(userById(a.user).name) + (ok ? " ✅" : " ⏳") : ok ? "✅ Done" : "⏳ Not yet"}</span>`; }).join("");
  const tiles = [
    ["🙂", "Who", safe(namesOf(b.users)), b.users.length > 2],
    helperOf(b) ? ["🤝", "Helper", safe(helperOf(b).name)] : null,
    kids.length ? ["✅", "Done", doneHtml, kids.length > 1] : null,
    flex && flex.between ? ["🕓", "Only between", safe(betweenText(flex.between))] : null
  ].filter(Boolean);
  const actId = (b.acts[0] || {}).actId, canEditAct = isParentDevice() && actId && (b.fixed ? data.fixed : data.flexible).some(a => a.id === baseActId(actId));
  const canMove = isParentDevice() && !b.fixed && actId && b.day >= todayYmd() && planItemsOn(b.day).some(x => !x.fixed && x.actId === actId);
  const mins = b.end - b.start, len = mins >= 60 ? `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ""}` : `${mins} min`;
  cardDay = b.day;
  $("kCard").style.cssText = `--soft:${b.soft};--ink:${b.ink}`;
  // 🎨 v233 (Broo2a's picture): the buddy says when it is, a white card (icon, name, day · time, chips, everyone's characters), Edit · Mark done
  const viewer = userById(me), kidOne = b.users.length === 1 && !isParentId(b.users[0]) ? userById(b.users[0]) : null;
  const bud = kidOne && (isParentDevice() || kidOne.id === me) ? kidOne : viewer, isT = b.day === todayYmd();
  const ac = actId && (b.fixed ? data.fixed : data.flexible).find(a => a.id === baseActId(actId));
  const sayTxt = `${what} ${isT ? "today" : "on " + DAYS[weekdayOf(b.day)]}! ${b.type === "free" ? "Pick something fun." : `Get ready at ${clock(b.start)}.`}`;
  const chips = [b.fixed ? "Fixed" : "Flexible", `${tEmoji} ${tWord}`, len, ac && ac.must ? "⭐ Must-do" : "", isSecondId(actId || "") ? "2nd today" : ""].filter(Boolean);
  const ppl = b.users.map(id => userById(id)).filter(Boolean);
  const mine = b.acts.find(a => a.user === me) || (isParentDevice() && kids.length === 1 ? kids[0] : null);
  const canTick = mine && isT && !b.gone && (isParentId(me) || mine.user === me);
  const tickOn = mine && isDone(b.day, mine.actId, mine.user);
  $("kCard").innerHTML = `<button class="kc3-x" aria-label="Close">✕</button>
    <div class="kc3-buddy">${charPic(bud, "jump") ? `<img src="${charPic(bud, "jump")}" alt="">` : ""}<p>${safe(sayTxt)}</p></div>
    <div class="kc3-card">
      <div class="kc3-head"><span class="kc3-ic">${b.fixed ? `<span class="e">${safe(b.emoji)}</span>` : actIcon3d(b.name, b.type, "k-bigic")}</span>
        <span class="kc3-t"><b>${subj ? `${safe(subj.emoji)} ` : ""}${safe(what)}</b><small>${safe(dayLong(b.day))} · ${safe(clock(b.start))} - ${safe(clock(b.end))}</small></span>
        ${canMove ? `<button class="k-edit kc2-pen" data-kedit="move|${safe(b.day)}|${safe(actId)}" aria-label="Change the day or time">✏️</button>` : ""}</div>
      <div class="kc3-chips">${chips.map(c => `<span>${safe(c)}</span>`).join("")}</div>
      <div class="kc3-ppl"><span class="kc3-faces">${ppl.map(u => charPic(u, "happy") ? `<img src="${charPic(u, "happy")}" alt="">` : `<i>${safe(u.emoji)}</i>`).join("")}</span><b>${safe(namesOf(b.users))}</b></div>
      ${tiles.length > 1 ? `<div class="kc2-tiles">${tiles.slice(1).map(([ic, l, v, wide]) => `<div class="kc2-tile${wide ? " wide" : ""}"><small>${ic} ${l}</small><b>${v}</b></div>`).join("")}</div>` : ""}
    </div>
    ${b.type === "free" ? `<div class="kc2-free">🎈 Free time: pick what to do!<div class="kc2-freebtns">${b.users.map(u => `<button class="pill small" data-freeopen="${safe(u)}">💡 Ideas${b.users.length > 1 ? ` for ${safe(userById(u).name)}` : ""}</button>`).join("")}</div></div>` : ""}
    ${quickEditHtml(b, actId, canEditAct, canMove)}
    ${fixedTodayHtml(b)}
    <div class="kc3-btns">${canEditAct ? `<button class="kc3-edit" data-kedit="${b.fixed ? "fixed" : "flex"}|${safe(baseActId(actId))}">✏️ Edit</button>` : ""}
      ${canTick ? `<button class="kc3-done${tickOn ? " on" : ""}" data-check="${safe(b.day)}|${safe(mine.actId)}|${safe(mine.user)}">${tickOn ? "✓ Done!" : "✓ Mark done"}</button>` : ""}
      <button class="k-ok" id="kOk">OK 👍</button></div>`;
  $("kCard").classList.toggle("qe-on", !!$("kCard").querySelector(".qe-bar"));
  $("kModal").hidden = false;
  $("kOk").focus();
}
// ⚡ v191 (Broo2a) Quick edit on the big card (parents, today and later).
// 🗜️ v213 (Broo2a): smaller: ⏰ start and ⏱️ length with − / + (15 minutes; 💾 Save shows once something changed) · 🗑️ Delete
// opens a pop-up in the middle · ⋯ More opens 🏷️ type, ⭐ Must-do and 🔢 sessions a week · ✏️ All changes
function quickEditHtml(b, actId, canEditAct, canMove) {
  if (!canEditAct || b.gone || b.day < todayYmd()) return "";
  const base = baseActId(actId), kind = b.fixed ? "fixed" : "flex", key = `${b.day}|${actId}|${kind}`;
  const act = (b.fixed ? data.fixed : data.flexible).find(a => a.id === base); if (!act) return "";
  const fixKey = `${b.day}|${[...new Set(b.acts.map(a => a.actId))].join(",")}`, hm = m => clock24(m), type = actTypeOf(act);
  const it = !b.fixed && planItemsOn(b.day).find(x => !x.fixed && x.actId === actId), len = it ? it.end - it.start : act.duration;
  const stepper = (what, label, val) => `<div class="qe-line"><span class="qe-lab">${label}</span><div class="bed-step qe-step">
      <button type="button" class="bed-pm" data-qestep="${what}|-15" aria-label="15 minutes less">−</button><span class="bed-time" data-qeshow="${what}">${val}</span>
      <button type="button" class="bed-pm" data-qestep="${what}|15" aria-label="15 minutes more">+</button></div></div>`;
  const time = b.fixed ? `<div class="qe-line"><span class="qe-lab">⏰ This day</span><div class="qe-time"><label>From <input type="time" class="qe-from" value="${hm(b.start)}"></label>
      <label>To <input type="time" class="qe-to" value="${hm(b.end)}"></label></div></div>`
    : canMove && it ? stepper("st", "⏰ Starts", clock(b.start, true)) + stepper("len", "⏱️ Length", minsText(len)) : "";
  const maxTimes = act.twiceDay ? DAYS.length * 2 : DAYS.length;
  return `<div class="qe-bar" data-qekey="${safe(key)}" data-qefix="${safe(fixKey)}" data-st="${b.start}" data-len="${len}" data-st0="${b.start}" data-len0="${len}">
    ${time}${time ? `<button type="button" class="pill primary qe-save" data-qetimesave="1" ${b.fixed ? "" : "hidden"}>💾 Save</button>` : ""}
    <div class="qe-btns"><button type="button" class="pill small" data-qemore="1" aria-expanded="false">⋯ More</button>
      <button type="button" class="pill small" data-kedit="${kind}|${safe(base)}">✏️ Edit all</button>
      <button type="button" class="pill small qe-del" data-qedel="1">🗑️ Delete</button></div>
    <div class="qe-more" hidden>
      <div class="qe-row"><span class="qe-lab">🏷️ Type</span><div class="qe-chips">${allActTypes().map(([k, e, w]) =>
        `<button type="button" class="pill small${k === type ? " on" : ""}" data-qetype="${k}">${e} ${w}</button>`).join("")}</div></div>
      ${act.users.some(u => !isParentId(u)) ? `<div class="qe-row"><span class="qe-lab">⭐ Must-do</span><div class="qe-chips">
        <button type="button" class="pill small${act.must ? "" : " on"}" data-qemust="0">Off</button><button type="button" class="pill small${act.must ? " on" : ""}" data-qemust="1">On: missing it lowers the score</button></div></div>` : ""}
      ${b.fixed ? "" : `<div class="qe-row"><span class="qe-lab">🔢 Sessions a week</span><div class="qe-num">
        <button type="button" class="pill small" data-qetimes="-1" ${act.times <= 1 ? "disabled" : ""} aria-label="One less">−</button><b>${act.times}</b>
        <button type="button" class="pill small" data-qetimes="1" ${act.times >= maxTimes ? "disabled" : ""} aria-label="One more">+</button></div></div>`}
    </div></div>`;
}
const minsText = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
// 💬 v213 A pop-up in the middle of the screen (over the card): a question and its buttons [label, onClick, cls]. The last one closes it.
function qePop(title, text, buttons) {
  qePopClose();
  const el = document.createElement("div");
  el.className = "qe-pop"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `<div class="qe-popcard"><b class="qe-poptitle">${title}</b>${text ? `<p>${text}</p>` : ""}<div class="qe-popbtns">${buttons.map(([l, , cls], i) =>
    `<button type="button" class="pill ${cls || ""}" data-qepop="${i}">${l}</button>`).join("")}</div></div>`;
  el.addEventListener("click", e => {
    const btn = e.target.closest("[data-qepop]");
    if (!btn) { if (e.target === el) qePopClose(); return; }
    const fn = buttons[Number(btn.dataset.qepop)][1]; qePopClose(); if (fn) fn();
  });
  document.body.appendChild(el);
  const first = el.querySelector("button"); if (first) first.focus();
}
function qePopClose() { document.querySelectorAll(".qe-pop").forEach(x => x.remove()); }
// 🔁 A free place for this session with its new length, when the one in the way stays: the same day (closest to the time picked), then the next days
function freeSpotFor(actId, ds, len, was) {
  const days = aheadDates(), i = Math.max(0, days.indexOf(ds));
  for (const d of [...days.slice(i), ...days.slice(0, i).reverse()]) {
    if (d !== ds && planItemsOn(d).some(x => !x.fixed && x.actId === actId)) continue;
    const [ws, we] = dayWindow(weekdayOf(d)), times = [];
    for (let t = Math.ceil(ws / SNAP) * SNAP; t < we; t += SNAP) times.push(t);
    times.sort((a, b) => Math.abs(a - was) - Math.abs(b - was));
    const t = times.find(x => moveCheck(actId, ds, d, x, len).ok);
    if (t != null) return { ds: d, start: t };
  }
  return null;
}
// ⏰ ⏱️ Put a session on a day at a start, with its length (📌 pinned; ownLen = its own length that day)
function placeSession(actId, fromDay, toDay, start, len) {
  const act = data.flexible.find(a => a.id === baseActId(actId));
  const from = data.plan.dates[fromDay], to = data.plan.dates[toDay] = data.plan.dates[toDay] || { items: [] };
  if (from) from.items = from.items.filter(it => !(!it.fixed && it.actId === actId));
  to.items.push({ actId, fixed: false, start, end: start + len, pinned: true, ...(len !== act.duration ? { ownLen: true } : {}) });
  to.items.sort((a, b) => a.start - b.start);
}
function qeSaveFlex(ds, actId, start, len, everyTime) {
  const act = data.flexible.find(a => a.id === baseActId(actId)); if (!act) return;
  const onDay = ds === todayYmd() ? "today" : dayName(ds);
  const done = msg => { editUndo = []; if (everyTime) act.duration = len; saveChanges(); hideSaved(); render(); toast(msg, 4000, "#16a34a"); };
  const check = moveCheck(actId, ds, ds, start, len);
  if (check.ok) { placeSession(actId, ds, ds, start, len); return done(`✓ ${act.name}: ${onDay} ${clock(start, true)} · ${minsText(len)}${everyTime ? " (every time)" : ""}`); }
  if (!check.room) return toast(`✗ ${check.why}`, 4000);
  // ⭐ v213 (Broo2a) Who comes first? The session(s) in the way, or this one
  const names = check.room.map(id => (data.flexible.find(a => a.id === baseActId(id)) || {}).name).filter(Boolean).join(" and ");
  const when = check.room.map(id => planItemsOn(ds).find(x => !x.fixed && x.actId === id)).filter(Boolean).map(x => clock(x.start, true)).join(", ");
  qePop(`⭐ Who comes first?`, `${safe(names)}${when ? ` (${safe(when)})` : ""} ${check.room.length > 1 ? "are" : "is"} in the way of ${safe(act.name)} at ${clock(start, true)}.`, [
    [`⭐ ${safe(act.name)} first: move ${safe(names)}`, () => {
      const moved = makeRoomMove(actId, ds, ds, start, len);
      if (!moved) return toast(`✗ There's no free place this week for ${names}. Nothing changed.`, 4000);
      done(`✓ ${act.name}: ${onDay} ${clock(start, true)} · ${moved.join(" · ")}`); }, "primary"],
    [`${safe(names)} first: put ${safe(act.name)} at another time`, () => {
      const spot = freeSpotFor(actId, ds, len, start);
      if (!spot) return toast(`✗ There's no free place this week for ${act.name}. Nothing changed.`, 4000);
      placeSession(actId, ds, spot.ds, spot.start, len);
      done(`✓ ${act.name} → ${dayName(spot.ds)} ${clock(spot.start, true)}`); }],
    ["Cancel", null]]);
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-qetimesave], [data-qetype], [data-qetimes], [data-qemust], [data-qedel], [data-qestep], [data-qemore]");
  if (!b || !isParentDevice()) return;
  const bar = b.closest(".qe-bar"), d = b.dataset; if (!bar) return;
  const [ds, actId, kind] = bar.dataset.qekey.split("|"), base = baseActId(actId), fixKey = bar.dataset.qefix;
  const act = (kind === "fixed" ? data.fixed : data.flexible).find(a => a.id === base); if (!act) return;
  const onDay = ds === todayYmd() ? "today" : dayName(ds);
  if (d.qemore) { const m = bar.querySelector(".qe-more"); m.hidden = !m.hidden; b.setAttribute("aria-expanded", String(!m.hidden)); b.textContent = m.hidden ? "⋯ More" : "⋯ Less"; return; }
  // ⏰ ⏱️ − / + (nothing is saved yet)
  if (d.qestep) {
    const [what, n] = d.qestep.split("|"), v = Number(bar.dataset[what]) + Number(n);
    if (what === "len" && (v < 15 || v > 240)) return;
    if (what === "st" && (v < 0 || v + Number(bar.dataset.len) > 24 * 60)) return;
    bar.dataset[what] = v;
    bar.querySelector(`[data-qeshow="${what}"]`).textContent = what === "st" ? clock(v, true) : minsText(v);
    bar.querySelector(".qe-save").hidden = bar.dataset.st === bar.dataset.st0 && bar.dataset.len === bar.dataset.len0;
    return;
  }
  // 🗑️ v213 (Broo2a): a pop-up in the middle of the screen
  if (d.qedel) {
    const name = act.name;
    return qePop(`🗑️ Delete “${safe(name)}”?`, "", [
      [`📅 Only ${safe(onDay)}`, () => qeDeleteOne(ds, actId, kind, fixKey, name, onDay)],
      ["🗑️ Every day", () => { deleteActivity(base, kind === "fixed", true); closeCard(); if (saveChanges()) toast(`🗑️ “${name}” deleted.`, 2500); }, "danger-text"],
      ["Cancel", null]]);
  }
  // ⏰ the time on this day only
  if (d.qetimesave) {
    if (kind === "fixed") {
      const from = (bar.querySelector(".qe-from") || {}).value || "", to = (bar.querySelector(".qe-to") || {}).value || "";
      if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to) || from >= to) return toast("Pick a start time before the end time.", 2500);
      closeCard(); return setFixedToday(fixKey, { start: from, end: to }, false, []);
    }
    const start = Number(bar.dataset.st), len = Number(bar.dataset.len);
    if (len === Number(bar.dataset.len0)) { closeCard(); return qeSaveFlex(ds, actId, start, len, false); }
    // ⏱️ a new length: this day only, or every time?
    closeCard();
    return qePop(`⏱️ ${safe(act.name)}: ${minsText(len)}`, "Change the length for:", [
      [`📅 Only ${safe(onDay)}`, () => qeSaveFlex(ds, actId, start, len, false), "primary"],
      ["🔁 Every time", () => qeSaveFlex(ds, actId, start, len, true)],
      ["Cancel", null]]);
  }
  // 🏷️ the type (📚 Study needs its subjects: that one goes to ✏️ More changes)
  if (d.qetype) {
    if (d.qetype === actTypeOf(act)) return;
    if (d.qetype === "study") { const m = bar.querySelector("[data-kedit]"); toast("📚 Pick the subjects for Study here.", 3000); return m && m.click(); }
    act.type = d.qetype; if (act.type !== "study") { delete act.studyMode; }
    closeCard(); saveChanges();
    const [, e2, w2] = actTypeInfo(act.type); return toast(`${e2} ${act.name} is now ${w2}.`, 2500);
  }
  // ⭐ Must-do on / off (from today: earlier days never count; a missed session lowers the week's score like a missed ⭐ habit)
  if (d.qemust) {
    const on = d.qemust === "1"; if (on === !!act.must) return;
    if (on) act.must = todayYmd(); else delete act.must;
    closeCard(); writeData(); render();
    return toast(on ? `⭐ ${act.name} is a Must-do from today. Missing it lowers the score.` : `${act.name} is not a Must-do any more.`, 3500);
  }
  // 🔢 sessions a week (the week is planned again)
  if (d.qetimes) {
    const max = act.twiceDay ? DAYS.length * 2 : DAYS.length, n = Math.max(1, Math.min(max, act.times + Number(d.qetimes)));
    if (n === act.times) return;
    act.times = n; closeCard();
    if (saveChanges()) toast(`🔢 ${act.name}: ${n} ${n === 1 ? "session" : "sessions"} a week. The week is planned again.`, 3000);
    return;
  }
});
// 📅 only that day: a fixed one = 🚫 didn't happen; a flexible one = off that day's plan, never planned there again
// (🗑️ v190: every day = the activity itself, as on ✏️ Add activities; gone days keep it as history)
function qeDeleteOne(ds, actId, kind, fixKey, name, onDay) {
  if (kind === "fixed") { closeCard(); return setFixedToday(fixKey, { off: true }, false, []); }
  const day = hasPlan() && data.plan.dates[ds];
  if (day) day.items = day.items.filter(it => it.fixed || it.actId !== actId);
  data.skips = { ...(data.skips || {}), [`${ds}|${actId}`]: { by: me, at: new Date().toISOString(), why: "skip" } };
  writeData(); closeCard(); render();
  toast(`🗑️ “${name}” taken off ${onDay}.`, 2500);
}
// 🏫 v180 (Broo2a): a fixed activity (School, a club …) that changed on ONE day: "🚫 Didn't happen" or "🕐 Other times that day".
// Parents, today and later. That day's plan is made again around it: what clashes moves, and free time gets the activities
// that were missing this week (then 🔍 Missed sessions and 🎈 ideas use the new free time too).
function fixedTodayHtml(b) {
  if (!b.fixed || b.gone || !isParentDevice() || b.day < todayYmd()) return "";
  const ids = [...new Set(b.acts.map(a => a.actId))].filter(id => data.fixed.some(f => f.id === id)); if (!ids.length) return "";
  const once = fixedOnOf(b.day, ids[0]), key = `${b.day}|${ids.join(",")}`, hm = m => clock24(m);
  // (📅 the same change on more days: the other dates this week that it happens on, ticked = changed too)
  const f0 = data.fixed.find(f => f.id === ids[0]), more = aheadDates().filter(ds => ds !== b.day && f0.days.includes(weekdayOf(ds)));
  const days = more.length ? `<div class="fx-days"><small>Also on:</small>${more.map(ds => `<label class="checkline"><input type="checkbox" class="fx-day" value="${ds}">${dayHead(ds)}</label>`).join("")}</div>` : "";
  return `<div class="fx-today"><b>${b.day === todayYmd() ? "Only today" : `Only on ${dayName(b.day)}`}${more.length ? ", or tick more days" : ""}:</b>
    ${once ? `<span class="fx-note">${once.off ? "🚫 Marked as didn't happen" : `🕐 Changed to ${clock(toMin(once.start), true)}–${clock(toMin(once.end), true)}`}</span>` : ""}
    ${days}
    <div class="btnrow"><button class="pill small" data-fxoff="${safe(key)}">🚫 Didn't happen</button>
      <button class="pill small" data-fxtimes="${safe(key)}">🕐 Other times</button>${once ? `<button class="pill small" data-fxusual="${safe(key)}">↩️ As usual</button>` : ""}</div>
    <div class="fx-times" hidden><label>From <input type="time" class="fx-from" value="${hm(b.start)}"></label><label>To <input type="time" class="fx-to" value="${hm(b.end)}"></label>
      <button class="pill small primary" data-fxsave="${safe(key)}">💾 Save</button></div></div>`;
}
function setFixedToday(key, val, quiet, also = []) {
  const [ds, idList] = key.split("|"), ids = idList.split(",");
  if (!isParentId(me) || ds < todayYmd()) return;
  // (the times before the change, for the "new free time" box after it)
  const wasItems = planItemsOn(ds).filter(it => it.fixed && ids.includes(it.actId));
  const was = wasItems.length ? [Math.min(...wasItems.map(it => it.start)), Math.max(...wasItems.map(it => it.end))] : null;
  data.fixedOn = data.fixedOn || {};
  ids.forEach(id => { if (val) data.fixedOn[`${ds}|${id}`] = val; else delete data.fixedOn[`${ds}|${id}`]; });
  const people = [...new Set(data.fixed.filter(f => ids.includes(f.id)).flatMap(peopleOf))];
  let moved = 0;
  if (hasPlan() && data.plan.dates[ds]) {
    const day = data.plan.dates[ds], s = val && !val.off ? toMin(val.start) : null, e = val && !val.off ? toMin(val.end) : null;
    const ticked = id => Object.keys(data.points.marks).some(k => k.startsWith(`${ds}|${id}|`));
    day.items = day.items.filter(it => {
      if (it.fixed) return !ids.includes(it.actId);   // (placed again with the new times, or left out)
      const act = data.flexible.find(a => a.id === baseActId(it.actId));
      if (s == null || !act || it.pinned || ticked(it.actId) || !(it.start < e && s < it.end) || !peopleOf(act).some(p => people.includes(p))) return true;
      moved++; return false;   // (clashes with the new times: placed again in free time)
    });
    // 🚫 Didn't happen: its ✅ ticks that day are taken off (it doesn't count)
    if (val && val.off) Object.keys(data.points.marks).forEach(k => { if (ids.some(id => k.startsWith(`${ds}|${id}|`))) delete data.points.marks[k]; });
    makeAndKeepPlan("fill");
  }
  if (quiet) return;
  also.forEach(d2 => setFixedToday(`${d2}|${idList}`, val, true));   // (📅 the same change on the other days picked)
  closeCard();
  writeData();
  render();
  const left = missedSessions().reduce((n, x) => n + x.missing, 0);
  // ✏️ v180 (Broo2a): then the parent adds or removes that day's activities themselves
  if (val && was) {
    const now = val.off ? [] : [[toMin(val.start), toMin(val.end)]];
    const freed = cutOut(was, now).filter(([a, b]) => b - a >= 15);
    if (freed.length || val.off) return openDayFix(ds, people, freed.length ? freed : [was]);
  }
  toast(`${val ? val.off ? "🚫 Marked as didn't happen" : `🕐 Changed to ${clock(toMin(val.start), true)}–${clock(toMin(val.end), true)}` : "↩️ Back to usual"} on ${[ds, ...also].map(dayName).join(", ")}.${
    moved ? ` ${moved} ${moved === 1 ? "activity was" : "activities were"} moved.` : ""} The free time was planned again${left ? `; ${left} still missing (🔍 Missed sessions)` : ""}.`, 4500);
}
// ✏️ v180 "That day's activities" box (after 🏫 a change): ➕ add an activity into the new free time (📌 pinned there),
// or ✕ remove one of that day's activities (for that day only: never planned there again)
let dayFix = null;   // { ds, people, freed: [[from, to]], adds: [] }
function openDayFix(ds, people, freed) { dayFix = { ds, people, freed }; drawDayFix(); }
function drawDayFix() {
  const { ds, people, freed } = dayFix, count = id => planItemsOn(ds).filter(it => !it.fixed && baseActId(it.actId) === id).length;
  const has = id => count(id) >= ((data.flexible.find(a => a.id === id) || {}).twiceDay ? 2 : 1);   // (2️⃣ "Can be twice a day": room for a 2nd)
  dayFix.adds = [];
  // ➕ the activities of these people that aren't on that day yet and fit inside the new free time
  data.flexible.filter(a => peopleOf(a).some(p => people.includes(p)) && !has(a.id)).forEach(a => {
    const day = missDayCtx(ds); if (!day.window) return;
    const pre = a.getReady || 0, post = a.breakAfter || 0, len = pre + a.duration + post, span = { ...a, duration: len };
    for (const [f, t] of freed) for (let st = Math.ceil(f / 5) * 5; st + len <= Math.max(t, f + len) && st < t; st += 5)
      if (fitsAt(day, st, st + len, span, "empty")) { dayFix.adds.push({ id: a.id, at: st + pre, len: a.duration, second: count(a.id) === 1 }); return; }
  });
  const items = planItemsOn(ds).filter(it => !it.fixed).map(it => ({ it, act: data.flexible.find(a => a.id === baseActId(it.actId)) }))
    .filter(x => x.act && peopleOf(x.act).some(p => people.includes(p)));
  const ticked = id => Object.keys(data.points.marks).some(k => k.startsWith(`${ds}|${id}|`));
  $("missTitle").textContent = dayFix.plan ? `➕ Add on ${dayName(ds)}` : `✏️ ${dayName(ds)}: free time ${freed.map(([a, b]) => `${clock(a, true)}–${clock(b, true)}`).join(", ")}`;
  $("missBody").innerHTML = `<p class="print-hint" style="margin:0 0 6px">➕ Add something in the free time:</p><div class="miss-fixes">${dayFix.adds.length
      ? dayFix.adds.map((x, i) => { const a = data.flexible.find(f => f.id === x.id); return `<button class="pill small" data-dfadd="${i}">➕ ${safe(a.name)} · ${namesTag(a.users)} · ${clock(x.at, true)}</button>`; }).join("")
      : `<span class="hint">Nothing else fits there. You can still use 🎈 free-time ideas.</span>`}</div>
    <p class="print-hint" style="margin:14px 0 6px">✕ Or take one off ${safe(dayName(ds))}:</p><div class="df-list">${items.length ? items.map(({ it, act }) =>
      `<div class="df-row"><span>${safe(act.name)} · ${namesTag(act.users)} <small>${clock(it.start, true)}–${clock(it.end, true)}</small></span>${ticked(it.actId) ? `<small>✅ done</small>`
        : `<button class="pill small" data-dfdel="${safe(it.actId)}">✕ Remove</button>`}</div>`).join("") : `<span class="hint">Nothing else that day.</span>`}</div>`;
  $("missHint").hidden = true;
  $("missModal").hidden = false;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-dfadd], [data-dfdel]"); if (!b || !dayFix || !isParentId(me) || !hasPlan()) return;
  const ds = dayFix.ds, day = data.plan.dates[ds] = data.plan.dates[ds] || { items: [] };
  if (b.dataset.dfadd != null) { const x = dayFix.adds[Number(b.dataset.dfadd)]; if (!x) return;
    day.items.push({ actId: x.second ? x.id + "~2" : x.id, fixed: false, start: x.at, end: x.at + x.len, pinned: true }); day.items.sort((p, q) => p.start - q.start);
    toast(`📌 Added on ${dayName(ds)} at ${clock(x.at, true)}.`, 2500); }
  else { const id = b.dataset.dfdel;
    day.items = day.items.filter(it => it.fixed || it.actId !== id);
    data.skips = { ...(data.skips || {}), [`${ds}|${id}`]: { by: me, at: new Date().toISOString(), why: "skip" } };   // (never planned on that day again)
    toast(`✕ Taken off ${dayName(ds)}.`, 2500); }
  writeData();
  render();
  if (dayFix.plan && b.dataset.dfdel != null) return openDayPlan(ds);
  drawDayFix();
});
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-fxoff], [data-fxtimes], [data-fxusual], [data-fxsave]"); if (!b) return;
  const d = b.dataset;
  const alsoDays = () => [...b.closest(".fx-today").querySelectorAll(".fx-day:checked")].map(x => x.value);
  if (d.fxoff) return setFixedToday(d.fxoff, { off: true }, false, alsoDays());
  if (d.fxusual) return setFixedToday(d.fxusual, null, false, alsoDays());
  if (d.fxtimes) { const box = b.closest(".fx-today").querySelector(".fx-times"); box.hidden = !box.hidden; return; }
  const box = b.closest(".fx-today"), from = box.querySelector(".fx-from").value, to = box.querySelector(".fx-to").value;
  if (!/^\d{2}:\d{2}$/.test(from) || !/^\d{2}:\d{2}$/.test(to) || from >= to) return toast("Pick a start time before the end time.", 2500);
  setFixedToday(d.fxsave, { start: from, end: to }, false, alsoDays());
});

// =====================================================================
//  ✏️ EDIT CALENDAR (Bro2a only): move flexible activities to another time or day
// =====================================================================
// Dragging is OFF until Bro2a presses "✏️ Edit calendar". In edit mode:
//  · drag a flexible activity (mouse or finger — no long press); scroll with the empty space
//  · or tap it to pick a day and start time in a small box
//  · the time snaps to 15 minutes, and the block is green (free) or red (busy)
//  · full week: drop on another day's column; one day (phone): drop on a day button at the top
// Moves are a draft until "✅ Done" (the same Save as everything else). Leaving first asks to save or discard.
const SNAP = 15;            // minutes
const PX_PER_SNAP = 14;     // how far to move the finger for 15 minutes
let editMode = false;       // is the calendar in edit mode?
let editUndo = [];          // the plan before each move (for "↩️ Undo")
let drag = null;            // the drag in progress
let suppressClick = false;  // after a drag, don't open the big card

function startEdit() {
  if (!isParentId(me)) return toast(`Ask ${dadName()} 🙂`);
  editMode = true;
  editUndo = [];
  if (screen === "all") allView = "cards";   // editing works on the cards
  render();
}
// "✅ Done": save everything (the same save function as the rest of the app), leave edit mode
function finishEdit() {
  editMode = false;
  editUndo = [];
  saveChanges();
  hideSaved();
  toast("Saved ✓ The calendar is updated.", 3000, "#16a34a");
}
function undoEdit() {
  if (!editUndo.length) return;
  data.plan = JSON.parse(editUndo.pop());
  changed();
  toast("↩️ Undone.");
}
// The bar at the top of the calendar while editing
function editBarHtml() {
  if (!editMode || !isParentId(me)) return "";
  return `<div class="edit-bar"><span>✏️ Edit mode: drag activities to change their day or time</span>
    <span class="edit-btns"><button data-editundo ${editUndo.length ? "" : "disabled"}>↩️ Undo</button>
    <button class="save-btn" data-editdone>✅ Done</button></span></div>`;
}

// Is this place free for everyone in the activity? → { ok } or { ok: false, why: "Jawad is at School then." }
// fromDay / toDay = dates. 📅 Only today (from now) … today + 6: past days never change.
function moveCheck(actId, fromDay, toDay, start, len) {   // (⏱️ v213 len = its own length that day; else its usual one)
  const act = data.flexible.find(a => a.id === baseActId(actId));
  if (!act) return { ok: false, why: "That activity doesn't exist any more." };
  const today = todayYmd(), last = addDaysYmd(today, PLAN_AHEAD);
  if (!isYmd(toDay) || toDay < today) return { ok: false, why: "Past days can't be changed." };
  if (toDay > last) return { ok: false, why: `The plan only goes up to ${dayLong(last)}.` };
  const end = start + (len || act.duration), S = start - (act.getReady || 0), E = end + (act.breakAfter || 0);
  if (toDay === today && start < dubaiMinutes()) return { ok: false, why: "That time has already passed today." };
  const [ws, we] = dayWindow(weekdayOf(toDay));
  if (S < ws || E > we) return { ok: false, why: `That's outside “My day” (${showTime(ws)}–${showTime(we)}).` };
  const only = onlyWindow(act);
  if (only && (start < only[0] || end > only[1])) return { ok: false, why: `${act.name} is only between 🕓 ${betweenText(act.between)}.` };
  // 🌙 v212 (Broo2a): never after a kid's bedtime (planning stops then)
  const late = peopleOf(act).find(p => { const b = bedMin(p, toDay); return b != null && end > b; });
  if (late) return { ok: false, why: `🌙 ${userById(late).name}'s planning stops at ${clock(bedMin(late, toDay), true)}.` };
  if (toDay !== fromDay && planItemsOn(toDay).some(it => it.actId === actId)) return { ok: false, why: `${act.name} is already on ${dayName(toDay)}.` };
  const day = planDay(toDay), people = peopleOf(act);
  const mine = x => x.actId === actId || String(x.id || "").includes(`-${actId}-`);   // the activity itself and its own strips
  const busy = [...day.items.filter(it => !mine(it)), ...day.routines.filter(r => !mine(r)).map(r => ({ ...r, people: r.users }))];
  // 🔁 v201 (Broo2a): when only other flexible sessions are in the way, say which ones ("room"): they can be moved away
  let first = null, room = [], stuck = false;
  for (const b of busy) {
    const shared = b.people.filter(p => people.includes(p));
    if (!shared.length || !(b.start < E && S < b.end)) continue;
    // Two lessons Bro2a allowed together may share his time (never a kid's fixed activity)
    if (!b.fixed && !b.routine && act.overlapWith.includes(b.actId)) continue;
    const who = userById(shared.find(p => p !== DAD) || shared[0]).name;
    const why = b.fixed && !b.routine && isSchoolName(b.name) ? `${who} is at School then.`
      : b.pad && b.before ? `${who} is getting ready for ${b.before} then.`
      : b.pad && b.after ? `${who} has a break after ${b.after} then.`
      : `${who} has ${b.name} then.`;
    if (!first) first = why;
    const other = roomItemOf(toDay, day, b);
    if (other) { if (!room.includes(other)) room.push(other); } else stuck = true;
  }
  if (!first) return { ok: true };
  return { ok: false, why: first, ...(!stuck && room.length ? { room } : {}) };
}
// 🔁 The flexible session (its actId) behind a block in the way, if it may be moved away:
// a flexible session or its own get ready / break, not ticked yet and not started. Else null.
function roomItemOf(ds, day, b) {
  let it = null;
  if (!b.routine && !b.fixed) it = b;
  else if (b.pad) {
    const m = /^(ready|break)-(.+)-(\d+)$/.exec(b.id || "");
    if (m) it = day.items.find(x => !x.fixed && baseActId(x.actId) === m[2] && (m[1] === "ready" ? x.start : x.end) === Number(m[3]));
  }
  if (!it || it.fixed || it.gone || !data.flexible.some(a => a.id === baseActId(it.actId))) return null;
  if (Object.keys(data.points.marks).some(k => k.startsWith(`${ds}|${it.actId}|`))) return null;   // ✅ ticked: it stays
  if (ds === todayYmd() && it.start <= dubaiMinutes()) return null;                                // already started
  return it.actId;
}
// 🔁 v201 (Broo2a): put actId at toDay/start and move the sessions in the way ("room") somewhere else:
// first to the place actId came from (a swap), else the first free place that day, else another day (today … +6).
// All of it is one step (one ↩️ Undo). → the list of what moved, e.g. ["Reading → Tue 5:00 pm"], or null (no place: nothing changes).
function makeRoomMove(actId, fromDay, toDay, start, len) {
  const check = moveCheck(actId, fromDay, toDay, start, len);
  if (check.ok || !check.room) return null;
  const before = JSON.stringify(data.plan), act = data.flexible.find(a => a.id === baseActId(actId));
  const fromIt = planItemsOn(fromDay).find(x => !x.fixed && x.actId === actId), origStart = fromIt ? fromIt.start : start;
  const to = data.plan.dates[toDay] = data.plan.dates[toDay] || { items: [] };
  to.items = to.items.filter(it => !(!it.fixed && check.room.includes(it.actId)));
  const undo = () => { data.plan = JSON.parse(before); return null; };
  if (!moveCheck(actId, fromDay, toDay, start, len).ok) return undo();
  const from = data.plan.dates[fromDay];
  if (from) from.items = from.items.filter(it => !(!it.fixed && it.actId === actId));
  to.items.push({ actId, fixed: false, start, end: start + (len || act.duration), pinned: true, ...(len && len !== act.duration ? { ownLen: true } : {}) });
  const moved = [];
  const oldStart = id => ((JSON.parse(before).dates[toDay] || { items: [] }).items.find(x => !x.fixed && x.actId === id) || {}).start || 0;
  for (const otherId of check.room) {
    const other = data.flexible.find(a => a.id === baseActId(otherId));
    const spot = roomSpotFor(otherId, toDay, fromDay, origStart, oldStart(otherId));
    if (!spot) return undo();
    const day = data.plan.dates[spot.ds] = data.plan.dates[spot.ds] || { items: [] };
    day.items.push({ actId: otherId, fixed: false, start: spot.start, end: spot.start + other.duration, pinned: true });
    moved.push(`${other.name} → ${dayName(spot.ds)} ${clock(spot.start, true)}`);
  }
  Object.values(data.plan.dates).forEach(d => d.items && d.items.sort((a, b) => a.start - b.start));
  editUndo.push(before);
  return moved;
}
// 🔁 A free place for a session that was taken off ds: the swap place first, then the same day (closest to where it was),
// then the next days (closest to the same time)
function roomSpotFor(actId, ds, swapDay, swapStart, was) {
  if (moveCheck(actId, ds, swapDay, swapStart).ok) return { ds: swapDay, start: swapStart };
  const days = aheadDates(), i = Math.max(0, days.indexOf(ds));
  for (const d of [...days.slice(i), ...days.slice(0, i).reverse()]) {
    const [ws, we] = dayWindow(weekdayOf(d)), times = [];
    for (let t = Math.ceil(ws / SNAP) * SNAP; t < we; t += SNAP) times.push(t);
    times.sort((a, b) => Math.abs(a - was) - Math.abs(b - was));
    const t = times.find(x => moveCheck(actId, ds, d, x).ok);
    if (t != null) return { ds: d, start: t };
  }
  return null;
}

document.addEventListener("pointerdown", e => {
  const el = e.target.closest("[data-drag]");
  if (!el || !editMode || !isParentId(me) || e.button > 0 || e.target.closest(".k-pin, .k-same")) return;
  const [d, actId] = el.dataset.drag.split("|");   // (d = the date)
  const it = planItemsOn(d).find(x => !x.fixed && x.actId === actId);
  if (!it) return;
  drag = { el, actId, fromDay: d, toDay: d, orig: it.start, start: it.start, x0: e.clientX, y0: e.clientY,
           id: e.pointerId, touch: e.pointerType !== "mouse", started: false, check: { ok: true } };
});
function startDrag() {
  if (!drag) return;
  drag.started = true;
  drag.el.classList.add("dragging");
  document.body.classList.add("drag-on");
  try { drag.el.setPointerCapture(drag.id); } catch (err) {}
  if (drag.touch && navigator.vibrate) navigator.vibrate(25);
  updateDrag(drag.x0, drag.y0);
}
document.addEventListener("pointermove", e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dist = Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0);
  if (!drag.started) {
    if (dist > 6) startDrag();        // mouse or finger: it starts as soon as it moves (edit mode only)
    else return;
  }
  updateDrag(e.clientX, e.clientY);
});
// While dragging on a phone, the page must not scroll
document.addEventListener("touchmove", e => { if (drag && drag.started) e.preventDefault(); }, { passive: false });
document.addEventListener("contextmenu", e => { if (drag) e.preventDefault(); });

function updateDrag(x, y) {
  const dx = x - drag.x0, dy = y - drag.y0;
  drag.el.style.transform = `translate(${dx}px, ${dy}px)`;
  // Which day is under the finger? (another day's column, or a day button at the top on the phone)
  document.querySelectorAll(".drop-target").forEach(n => n.classList.remove("drop-target"));
  const under = document.elementsFromPoint(x, y).find(n => !drag.el.contains(n) && n.matches && n.matches(".k-dbtn, .k-day"));
  if (under && under.dataset.date) {   // (📅 each day button and column carries its date)
    drag.toDay = under.dataset.date;
    under.classList.add("drop-target");
  }
  // The new time: up/down moves it, snapped to 15 minutes.
  // Over a day button (phone) the time doesn't change: it keeps the time it had just before (same time, another day).
  const act = data.flexible.find(a => a.id === baseActId(drag.actId));
  if (under && under.matches(".k-dbtn")) drag.start = drag.keep !== undefined ? drag.keep : drag.orig;
  else drag.start = drag.keep = Math.max(0, Math.min(24 * 60 - act.duration, Math.round((drag.orig + dy / PX_PER_SNAP * SNAP) / SNAP) * SNAP));
  drag.check = moveCheck(drag.actId, drag.fromDay, drag.toDay, drag.start);
  drag.el.classList.toggle("drop-ok", drag.check.ok);
  drag.el.classList.toggle("drop-room", !drag.check.ok && !!drag.check.room);
  drag.el.classList.toggle("drop-bad", !drag.check.ok && !drag.check.room);
  const when = drag.el.querySelector(".when");
  if (when) when.textContent = `${drag.toDay !== drag.fromDay ? dayHead(drag.toDay) + " · " : ""}${clock(drag.start)} - ${clock(drag.start + act.duration)}`;
}

document.addEventListener("pointerup", e => { if (drag && e.pointerId === drag.id) endDrag(true); });
document.addEventListener("pointercancel", e => { if (drag && e.pointerId === drag.id) endDrag(false); });
function endDrag(drop) {
  const d = drag;
  drag = null;
  document.body.classList.remove("drag-on");
  document.querySelectorAll(".drop-target").forEach(n => n.classList.remove("drop-target"));
  if (!d.started) return;            // it was a tap: the big card opens as usual
  suppressClick = true;
  setTimeout(() => suppressClick = false, 400);
  const moved = d.toDay !== d.fromDay || d.start !== d.orig;
  if (!drop || !moved) return render();
  if (!d.check.ok && d.check.room) { render(); return openMoveBox(d.fromDay, d.actId, d.toDay, d.start); }   // 🔁 orange: ask to make room
  if (!d.check.ok) { render(); return toast(`↩ ${d.check.why}`, 3500); }   // red: it goes back
  moveActivity(d.actId, d.fromDay, d.toDay, d.start);
}
// After a drag, the click that follows must not open the big card
document.addEventListener("click", e => { if (suppressClick) { suppressClick = false; e.stopPropagation(); e.preventDefault(); } }, true);

// Move it and pin it 📌 (a draft until "✅ Done"). After Done, the kid's calendar, "View all plan"
// and print all read the same saved plan.
// (fromDay / toDay = dates)
function moveActivity(actId, fromDay, toDay, start) {
  const act = data.flexible.find(a => a.id === baseActId(actId));
  editUndo.push(JSON.stringify(data.plan));
  const from = data.plan.dates[fromDay], to = data.plan.dates[toDay] = data.plan.dates[toDay] || { items: [] };
  const was = from && from.items.find(it => !it.fixed && it.actId === actId), len = was && was.ownLen ? was.end - was.start : act.duration;   // (⏱️ v213 keeps its own length)
  if (from) from.items = from.items.filter(it => !(!it.fixed && it.actId === actId));
  to.items.push({ actId, fixed: false, start, end: start + len, pinned: true, ...(len !== act.duration ? { ownLen: true } : {}) });
  to.items.sort((a, b) => a.start - b.start);
  if (toDay !== fromDay && !wholeWeek && calDates().includes(toDay)) viewDay = calDates().indexOf(toDay);   // phone: follow it to its new day
  changed();
  toast(`📌 ${act.name} → ${dayName(toDay)} ${clock(start, true)} · tap ✅ Done to save`, 2500);
}
// The saved items on a date (none when the plan doesn't have it)
const planItemsOn = ds => (hasPlan() && data.plan.dates[ds] && data.plan.dates[ds].items) || [];
// Tap 📌 (edit mode): unpin it (then "Plan my week" may move it again). day = the date
function unpin(day, actId) {
  if (!isParentId(me) || !editMode || day < todayYmd()) return;
  const it = planItemsOn(day).find(x => !x.fixed && x.actId === actId);
  if (!it) return;
  editUndo.push(JSON.stringify(data.plan));
  delete it.pinned;
  changed();
  toast("📌 Unpinned. ✨ Plan my week can move it again.");
}

// ---------- The small "Move" box (edit mode): tap a flexible activity, pick the day and start time ----------
let moving = null;   // { actId, fromDay, day } (dates)
// (toDay / at: open it on another day / start time, e.g. after a drop on a busy place)
function openMoveBox(fromDay, actId, toDay, at) {
  moveDirect = false;
  const act = data.flexible.find(a => a.id === baseActId(actId));
  const it = act && fromDay >= todayYmd() && planItemsOn(fromDay).find(x => !x.fixed && x.actId === actId);
  if (!it) return;
  moving = { actId, fromDay, day: toDay || fromDay };
  $("moveTitle").textContent = `${emojisOf(act.users)} ${act.name}`;
  const t0 = at != null ? at : it.start;
  $("moveTime").value = String(Math.floor(t0 / 60)).padStart(2, "0") + ":" + String(t0 % 60).padStart(2, "0");
  drawMoveBox();
  $("moveModal").hidden = false;
}
function drawMoveBox() {
  // (📅 today … today + 6)
  $("moveDays").innerHTML = aheadDates().map(ds => `<button class="${ds === moving.day ? "on" : ""}" data-moveday="${ds}">${SHORT[weekdayOf(ds)]}<small>${fromYmd(ds).getDate()}</small></button>`).join("");
  const t = $("moveTime").value, act = data.flexible.find(a => a.id === baseActId(moving.actId));
  if (!t) { $("moveCheck").className = "move-check bad"; return $("moveCheck").textContent = "Pick a start time."; }
  const start = toMin(t), check = moveCheck(moving.actId, moving.fromDay, moving.day, start);
  $("moveCheck").className = "move-check " + (check.ok ? "ok" : "bad");
  $("moveCheck").textContent = check.ok ? `✓ Free: ${dayLong(moving.day)} ${clock(start, true)} – ${clock(start + act.duration, true)}` : `✗ ${check.why}`;
  // 🔁 v201: only other sessions in the way → one button moves them somewhere else
  if (!check.ok && check.room) {
    const names = check.room.map(id => (data.flexible.find(a => a.id === baseActId(id)) || {}).name).filter(Boolean);
    $("moveCheck").insertAdjacentHTML("beforeend", `<button class="pill small primary move-room" data-moveroom>🔁 Put it here, move ${safe(names.join(" and "))} somewhere else</button>`);
  }
}
// 🔁 "Put it here": the sessions in the way go to its old place (swap) or the next free place
function roomMoveBox() {
  const t = $("moveTime").value;
  if (!moving || !t) return;
  const m = moving, start = toMin(t), act = data.flexible.find(a => a.id === baseActId(m.actId));
  const moved = makeRoomMove(m.actId, m.fromDay, m.day, start);
  if (!moved) return toast("✗ There's no free place this week for the session in the way. Nothing changed.", 4000);
  closeMoveBox();
  if (m.day !== m.fromDay && !wholeWeek && calDates().includes(m.day)) viewDay = calDates().indexOf(m.day);
  changed();
  const msg = `📌 ${act.name} → ${dayName(m.day)} ${clock(start, true)} · ${moved.join(" · ")}`;
  if (moveDirect) { moveDirect = false; editUndo = []; saveChanges(); hideSaved(); return toast(`✓ Saved: ${msg}`, 5000, "#16a34a"); }
  toast(`${msg} · tap ✅ Done to save`, 5000);
}
$("moveTime").addEventListener("input", () => moving && drawMoveBox());
function saveMoveBox() {
  const t = $("moveTime").value;
  if (!moving || !t) return;
  const start = toMin(t), check = moveCheck(moving.actId, moving.fromDay, moving.day, start);
  if (!check.ok) return drawMoveBox();   // stays open, with the reason in red
  const m = moving;
  closeMoveBox();
  const it = planItemsOn(m.fromDay).find(x => !x.fixed && x.actId === m.actId);
  if (m.day === m.fromDay && it && it.start === start) return;   // nothing changed
  moveActivity(m.actId, m.fromDay, m.day, start);
  if (moveDirect) { moveDirect = false; editUndo = []; saveChanges(); hideSaved(); toast(`✓ Saved: ${dayName(m.day)} ${clock(start, true)}`, 3000, "#16a34a"); }
}
function closeMoveBox() { $("moveModal").hidden = true; moving = null; }
// ✏️ v180: the pencils on the big card (parents)
let moveDirect = false;   // (opened from the card, not in ✏️ Edit calendar: saved straight away)
document.addEventListener("click", e => {
  const btn = e.target.closest && e.target.closest("[data-kedit]");
  if (!btn || !isParentDevice()) return;
  const [kind, a, b] = btn.dataset.kedit.split("|");
  closeCard();
  if (kind === "move") { openMoveBox(a, b); moveDirect = !editMode; return; }
  // ↩️ v182 (Broo2a): after ✏️ → change → Save, come back to this calendar and its card
  cardBack = { id: a, day: cardDay, calWho, viewDay, wholeWeek };
  go("add");
  setTimeout(() => { if (kind === "fixed") startEditFixed(a); else startEditFlex(a); }, 50);
});

let cardBack = null, cardDay = null;   // (↩️ where a ✏️ on the big card came from)
function cardReturn(id) {
  const cb = cardBack; cardBack = null;
  if (!cb || cb.id !== id || !saveChanges()) return;   // (💾 saved straight away, then back)
  go("mine"); calWho = cb.calWho; viewDay = cb.viewDay; wholeWeek = cb.wholeWeek; render();
  const blk = blocks.find(x => x.day === cb.day && x.acts && x.acts.some(t => baseActId(t.actId) === id));
  if (blk) openCard(blk);
}
// 📋 v180 Day plan (Broo2a): one day's activities as a short list (whose calendar it is, or everyone's).
// Parents: ✏️ change each one (its card: times, didn't happen, move …), ✕ take a flexible one off that day, ➕ add something.
// Kids: look only.
function openDayPlan(ds) {
  const who = calWho && calWho !== "all" ? calWho : null, parent = isParentDevice() && ds >= todayYmd();
  const day = planDay(ds), mine = it => !who || it.people.includes(who);
  const rows = [
    ...day.items.filter(mine).map(it => ({ s: it.start, e: it.end, name: it.second ? `${it.name} (2nd)` : it.name, users: it.users, it })),
    ...oneDayOn(ds).filter(e => !who || e.who.includes(who)).map(e => ({ s: toMin(e.from), e: toMin(e.to), name: `📌 ${e.title}`, users: e.who })),
    ...day.routines.filter(r => !r.pad && (!who || (r.users || []).includes(who))).map(r => ({ s: r.start, e: r.end, name: `${r.emoji || ""} ${r.name}`, users: r.users || [], soft: true }))
  ].sort((a, b) => a.s - b.s);
  const beds = bedGroups(ds, who);
  const ticked = (it) => it && Object.keys(data.points.marks).some(k => k.startsWith(`${ds}|${it.actId}|`));
  $("missTitle").textContent = `📋 ${dayName(ds)} ${fromYmd(ds).getDate()} ${MONTHS[fromYmd(ds).getMonth()]}${who ? ` · ${userById(who).name}` : ""}`;
  $("missHint").hidden = true;
  $("missBody").innerHTML = `<div class="df-list">${rows.length ? rows.map(r => `<div class="df-row ${r.soft ? "soft" : ""}"><span><b class="dp-time">${clock(r.s, true)}–${clock(r.e, true)}</b>
      ${safe(r.name)} ${who ? "" : `· ${namesTag(r.users)}`}${ticked(r.it) ? " ✅" : ""}</span>${parent && r.it && !r.it.gone ? `<span class="dp-acts">
      <button class="pill small" data-dpedit="${safe(r.it.actId)}" aria-label="Change ${safe(r.name)}">✏️</button>${!r.it.fixed && !ticked(r.it)
        ? `<button class="pill small" data-dfdel="${safe(r.it.actId)}" aria-label="Take ${safe(r.name)} off">✕</button>` : ""}</span>` : ""}</div>`).join("")
      : `<span class="hint">Nothing planned. 🎉</span>`}
    ${beds.map(g => `<div class="df-row soft"><span><b class="dp-time">${clock(g.min, true)}</b> 🌙 Bedtime ${who ? "" : `· ${namesTag(g.kids)}`}</span></div>`).join("")}</div>
    ${parent ? `<div class="btnrow" style="margin-top:10px"><button class="pill small primary" data-dpadd="${ds}">➕ Add something</button></div>`
      : isParentDevice() ? "" : `<p class="hint" style="margin-top:8px">👀 Only a parent can change the plan.</p>`}`;
  dayFix = { ds, people: who ? [who] : kidsList().map(k => k.id), freed: [day.window || [0, 24 * 60]], plan: true };
  $("missModal").hidden = false;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-dayplan], [data-dpedit], [data-dpadd]"); if (!b) return;
  const d = b.dataset;
  if (d.dayplan) return openDayPlan(d.dayplan);
  if (!dayFix || !isParentDevice()) return;
  if (d.dpadd) return drawDayFix();
  // ✏️ the activity's own card (with its ✏️ pencils, and for a fixed one "Only today: didn't happen / other times")
  const n = blocks.findIndex(x => x.day === dayFix.ds && x.acts && x.acts.some(a => a.actId === d.dpedit));
  $("missModal").hidden = true;
  if (n >= 0) openCard(blocks[n]);
});

// The card for a routine strip: no "Done" row (routines give no points)
function openRoutineCard(b) {
  const rows = [
    [b.pad ? "⏱️ Time to" : "🧺 Routine", `${b.emoji} ${b.name}`],
    b.before ? ["⏭️ Before", b.before] : null,
    b.after ? ["⏮️ After", b.after] : null,
    ["🙂 Who", isEveryone(b.users) ? "Everyone" : usersText(b.users)],
    ["📅 Day", dayLong(b.day)],
    ["⏰ Start", clock(b.start, true)],
    ["🏁 End", clock(b.end, true)]
  ].filter(Boolean);
  $("kCard").style.cssText = `--soft:${b.soft};--ink:${b.ink}`;
  $("kCard").innerHTML = `
    <div class="k-card-top"><div class="big">${safe(b.emoji)}</div><div class="nm">${safe(b.name)}</div></div>
    <div class="k-rows">${rows.map(([label, value]) => `<div><span>${safe(label)}</span><b>${safe(value)}</b></div>`).join("")}</div>
    <button class="k-ok" id="kOk">OK 👍</button>`;
  $("kModal").hidden = false;
  $("kOk").focus();
}
function closeCard() { $("kModal").hidden = true; $("kModal").classList.remove("star-pop"); }   // (🌟 star-pop = the big Shining Star message)

// ---------- 📅 Calendar: the one calendar page ----------
// Chips: "Me" · "Everyone" · one per person. Everyone (kids too) can see everyone's week. The ✅ ticks work only for
// their owner and the parents (the others are greyed out). ✏️ Edit calendar / ✨ Plan my week / ➕ My activity: parents.
let calWho = null;   // "all", a person's id, or null = the first chip (kids: "Me", parents: "Everyone")
const isParentDevice = () => isParentId(me) && !isKidDevice();
function drawMine() {
  $("calTools").innerHTML = "";   // (v154: the buttons are under the people now, see mineActions)
  scrollStripToToday();   // (after it's drawn)
  if (calWho !== "all" && calWho && !exists(calWho)) calWho = null;
  if (!calWho) calWho = isParentDevice() ? "all" : me;
  // 🧒 A kid's device: only "🙋 Me" and "👨‍👩‍👧 Everyone" (look-only for other people's items), never one other person's calendar
  if (!isParentDevice() && calWho !== "all") calWho = me;
  const all = calWho === "all", who = all ? null : calWho, u = who ? userById(who) : null, mine = who === me, parent = isParentDevice();
  // (face = HTML: a parent's 🖼️ photo or their emoji)
  const chip = (id, face, label, c) => `<button class="chip ${calWho === id ? "on" : ""}" data-calwho="${safe(id)}" style="--soft:${c.soft};--ink:${c.ink}"
    ${calWho === id ? `aria-current="true"` : ""}><span class="e">${face}</span>${safe(label)}</button>`;
  // (👨‍👩‍👧 v182 Broo2a: 👨‍👩‍👧 Everyone first, then the family in order: father, mother, kids oldest first; "Me" sits in its own place)
  // 🌈 v233 (Broo2a's picture): Everyone = the whole family's characters together in one circle · each person = their character
  const fam = familyOrder(data.users), pics = fam.filter(x => charPic(x)).slice(0, 5);
  const allFace = pics.length >= 2 ? `<span class="fam-collage n${pics.length}">${pics.map(x => `<img src="${charPic(x, "happy")}" alt="">`).join("")}</span>` : "👨‍👩‍👧";
  const pFace = x => charPic(x) ? `<img class="cw-char" src="${charPic(x, "happy")}" alt="">` : faceHtml(x);
  $("minePeople").innerHTML = chip("all", allFace, "Everyone", { soft: "#fde0e4", ink: "#9b2f3a" })
    + (parent ? fam.map(x => chip(x.id, pFace(x), x.id === me ? "Me" : x.name, colorsOf(x))).join("")
       : chip(me, charPic(userById(me)) ? pFace(userById(me)) : "🙋", "Me", colorsOf(userById(me))));
  $("mineTitle").textContent = all ? "Everyone's Week" : mine ? "My Week" : `${u.name}'s Week`;   // (🫧 the puffy banner: see puffTitles)
  $("mineSub").textContent = !mine && !parent && !all ? `Just looking 👀 Only ${u.name} or ${dadName()} can tick these.` : "";   // (v154: short)
  document.querySelector("#scr-mine .bar .cal-btn").classList.toggle("here", calWho === (parent ? "all" : me));
  // (real = this points week's plan, for the week's numbers; the calendar shows its 12 dates, routines even with no plan yet)
  const real = planDays(), days = calDays();
  const editing = editMode && isParentId(me) && !!real;
  // Buttons: ✏️ Add / edit activities (everyone: kids change only their own), and for parents ✏️ Edit calendar · ✨ Plan my week · ➕ My activity
  // v154: ONE row: ✏️ Edit calendar · ➕ Activities (add or change) · ☰ More (✨ plan, 🔄 new plan, 📌 one-day event, 👨‍👩‍👧 my own activity, 🖨️ print)
  const needPlan = isParentId(me) && (!real || planIsOld());
  $("mineActions").innerHTML = `<div class="cal-main-btns">
      ${isParentId(me) && real && !editMode ? `<button class="cal-big edit-cal-btn" data-editcal><span class="e">✏️</span>Edit calendar</button>` : ""}
      <button class="cal-big" data-go="add"><span class="e">➕</span>Activities</button>
      ${parent ? `<button class="cal-big ${calMore ? "on" : ""}" data-calmore aria-expanded="${calMore}"><span class="e">☰</span>More</button>` : ""}</div>
    ${needPlan ? `<button class="pill primary cal-plan" data-plan>✨ Plan my week</button>` : ""}
    ${parent && calMore ? `<div class="cal-more">
      ${real && !needPlan ? `<button class="pill" data-plan>✨ Plan my week</button>` : ""}
      ${real ? `<button class="pill" data-newplan>🔄 Make a new plan</button>` : ""}
      <button class="pill" data-onedaynew>📌 One-day event</button>
      <button class="pill" data-pactnew>👨‍👩‍👧 My own activity (work, travel)</button>
      ${isParentId(me) ? `<button class="pill" data-printmenu>🖨️ Schedules to tick</button>` : ""}<button class="pill" data-printcal>🖨️ Print this calendar</button></div>` : ""}`;
  // ⚠ The plan's notes (parents, on Everyone) / "not in the plan yet" (kids)
  let top = "";
  if (isParentId(me) && all && real) {
    const w = data.plan.warnings;
    if (planIsOld()) top += `<div class="msg warn"><b>⚠ Things changed since this plan was made.</b> Tap ✨ Plan my week.</div>`;
    if (w.length) top += `<details class="msg warn cal-warn"><summary><b>⚠ ${w.length} ${w.length === 1 ? "thing needs" : "things need"} your attention</b> <small>tap to see</small></summary><ul>${w.map(x => `<li>${safe(x)}</li>`).join("")}</ul></details>`;
  }
  $("calTop").innerHTML = top;
  const note = !real ? (isParentId(me) ? "🗓️ No plan yet. Add activities, then tap ✨ Plan my week." : `🗓️ No plan yet. ${dadName()} will plan the week soon.`)
    : !isParentId(me) && planIsOld() ? `🕐 Some changes aren't in the plan yet. ${dadName()} will update it soon.` : "";
  $("mineNote").hidden = !note;
  $("mineNote").textContent = note;
  // (v154: the week's numbers box is off: the kid page and 📊 Report have them)
  $("mineBrief").innerHTML = "";
  $("mineBrief").hidden = true;
  if (who) $("mineBrief").style.cssText = `--c:${colorsOf(u).color}`;
  // Ticks: always drawn; each one only works for its owner and the parents. In edit mode (Bro2a): moving, no ticking.
  // 📚 The subject filter's kid: the kid whose calendar it is; a parent on Everyone / a parent's calendar: the kid picked under it; a kid: themselves
  const sk = subjFilterKid(who), subj = sk && calSubj !== "all" ? { kid: sk, name: calSubj } : null;
  keepCalScroll("mineWeek");
  // 📅 v154: the Week view = today and the next 6 days only (no past days); the Day view still reaches back with ‹
  // 📅 v203 (Broo2a): the Week view = 7 days, from ⚙️ the week's start day (Sunday … Saturday), ‹ › = another week
  const keepDay = viewDay, wk = wholeWeek, wdays = wk ? calWeekDates(weekShift).map(planDay) : days;
  if (wk) viewDay = Math.max(0, wdays.findIndex(x => x.date === todayYmd()));
  navSubj = subjPickHtml(sk, who);
  // 🌈 v233 (Broo2a's picture): the Week view = a grid (Morning · Day · Evening × 7 days, a picture per activity), the names under it,
  //   then the chosen day's list (tap a day). ✏️ Edit calendar still uses the hour grid (dragging works there).
  const glance = wk && !editing;
  try { $("mineWeek").innerHTML = editBarHtml() + (editing ? "" : freeNowHtml(who)) + (glance ? glanceHtml(wdays, who, subj) : weekHtml(wdays, { only: who, readOnly: editing, drag: editing, subj })); }
  finally { viewDay = keepDay; navSubj = ""; wholeWeek = wk; }
  putCalScroll("mineWeek");   // (📅 opens with today in view; a tick or a tap keeps it where it was)
  $("mineSubj").innerHTML = sk ? subjFilterHtml(sk, who) : "";   // (v180: only the picked subject's summary; the picker is in the days row)
  // ⭐ v154: one big button "Good habits today · 3 of 16"; tap → the habits card
  const hb = who && !kidLockedOut(who) && habitsFor(who).length ? kidHabitsToday(who) : null;
  $("mineHabits").innerHTML = hb ? `<button class="cal-habits-btn ${calHabits ? "on" : ""}" data-calhabits aria-expanded="${calHabits}"><span class="e">⭐</span>
      <span><b>Good habits today</b><small>${hb.done} of ${hb.all} done · tap to ${calHabits ? "close" : "see them"}</small></span><span class="kc-go">${calHabits ? "⌄" : "›"}</span></button>
    ${calHabits ? habitsCardHtml(who) : ""}` : "";   // ⭐ good habits (a kid; 🔒 a kid's device: only their own; parents have none)
}

// ---------- 🌈 v233 WEEK AT A GLANCE (Broo2a's picture) ----------
let glDay = null;   // the day picked under the grid (a date); null = today (or the week's first day)
const GL_PARTS = [["morning", "☀", "Morning"], ["day", "☁", "Day"], ["evening", "☾", "Evening"]];
// which part of the day an activity is in, by its middle: before 10:00 morning · before 16:30 day · else evening
const glPart = it => { const mid = (it.start + it.end) / 2; return mid < 600 ? "morning" : mid < 990 ? "day" : "evening"; };
function glanceHtml(wdays, who, subj) {
  const smx = document.getElementById("scr-mine"); if (smx) smx.classList.remove("gd-open");
  if (who && !isParentId(who)) return pathHtml(wdays, who, subj);   // 🛤️ one kid: the path (Broo2a's 2nd picture)
  const today = todayYmd(), dates = wdays.map(d => d.date);
  if (!glDay || !dates.includes(glDay)) glDay = dates.includes(today) ? today : dates[0];
  const itemsOf = d => d.items.filter(it => !who || it.people.includes(who));
  const names = new Map();
  wdays.forEach(d => itemsOf(d).forEach(it => { if (!names.has(it.name)) names.set(it.name, it.type); }));
  const cell = (d, part) => { const list = itemsOf(d).filter(it => glPart(it) === part), seen = new Set();
    const uniq = list.filter(it => !seen.has(it.name) && seen.add(it.name));
    return `<button class="gl-cell gl-${part} ${d.date === glDay ? "sel" : ""}" data-glday="${d.date}" aria-label="${safe(dayHead(d.date))}">${uniq.slice(0, 3).map(it =>
      `<span class="gl-act ${it.users.length === 1 ? "" : "shared"}" style="${blockColors(it)}" title="${safe(it.name)}">${actIcon3d(it.name, it.type, "gl-ic")}</span>`).join("")}${
      uniq.length > 3 ? `<small class="gl-more">+${uniq.length - 3}</small>` : ""}</button>`; };
  const nav = glNav(glDay);
  const grid = `<div class="gl-card"><div class="gl-grid">
      <div class="gl-corner"><button class="k-arrow" data-kprev aria-label="Previous week">‹</button><button class="k-arrow" data-knext aria-label="Next week">›</button></div>
      ${wdays.map(d => `<button class="gl-head ${d.date === today ? "today" : ""} ${d.date === glDay ? "sel" : ""}" data-glday="${d.date}"><span>${SHORT[weekdayOf(d.date)]}</span><b>${fromYmd(d.date).getDate()}</b></button>`).join("")}
      ${GL_PARTS.map(([part, ic, label]) => `<div class="gl-side"><i>${ic}</i>${label}</div>${wdays.map(d => cell(d, part)).join("")}`).join("")}
    </div></div>`;
  const legend = names.size ? `<div class="gl-legend">${[...names].map(([n, t]) => `<span class="gl-key">${actIcon3d(n, t, "gl-kic")}${safe(n)}</span>`).join("")}</div>` : "";
  // the chosen day, as the usual day list (ticks work there), without its own day buttons
  const keepW = wholeWeek, keepV = viewDay; let day = "";
  wholeWeek = false; viewDay = 0;
  try { day = weekHtml([planDay(glDay)], { only: who, subj }); } finally { wholeWeek = keepW; viewDay = keepV; }
  return `${nav}${grid}${legend}<h2 class="gl-dayname">${glDay === today ? "Today · " : ""}${DAYS[weekdayOf(glDay)]}</h2><div class="gl-day">${day}</div>`;
}
const glNav = ds => `<div class="k-nav"><div class="k-navrow">${navSubj}
      <div class="seg k-mode"><button data-kmode="day">📆 Day</button><button class="on" data-kmode="week">📅 Week</button></div>
      <button class="pill small k-planbtn" data-dayplan="${ds}" aria-label="Day plan" title="This day's plan">📋 Plan</button></div></div>`;

// ---------- 🛤️ v233 WEEK PATH (one kid): the days zig-zag down a dotted path, today has a big ring + the kid's character.
// Tap a day → that day's page: Morning · Day · Evening with big cards (ticks + sessions work there) + "Coming next". ----------
let glOpen = null;   // the day whose page is open (a date) · null = the path
const GL_TINTS = ["#fff1c9", "#d9f0d3", "#fde0dc", "#dbe9fb", "#ffe3cc", "#e9e0fb", "#fbe3ec"];
function pathHtml(wdays, who, subj) {
  const today = todayYmd(), u = userById(who);
  const sm = document.getElementById("scr-mine"); if (sm) sm.classList.toggle("gd-open", !!glOpen);   // (a day is open: its own buddy, not the week's)
  if (glOpen) return glDayPage(glOpen, who, subj);
  const itemsOf = d => d.items.filter(it => it.people.includes(who)).sort((a, b) => a.start - b.start);
  const rows = wdays.map((d, i) => {
    const list = itemsOf(d), seen = new Set(), uniq = list.filter(it => !seen.has(it.name) && seen.add(it.name)), wd = weekdayOf(d.date);
    const card = `<button class="gp-card" data-glopen="${d.date}" style="--t:${GL_TINTS[wd]}"><b class="gp-dn">${SHORT[wd]}</b>${uniq.length
      ? uniq.slice(0, 3).map(it => `<span class="gp-act">${actIcon3d(it.name, it.type, "gp-ic")}<span class="gp-nm">${safe(it.name)}</span><small>${clock(it.start)}</small></span>`).join("")
        + (uniq.length > 3 ? `<small class="gp-more">+${uniq.length - 3} more</small>` : "")
      : `<span class="gp-free">Free day!</span>`}</button>`;
    const isT = d.date === today, pic = isT ? charPic(u, "jump") : "";
    const dot = `<button class="gp-dot ${isT ? "today" : ""}" data-glopen="${d.date}" style="${isT ? `--c:${colorsOf(u).color}` : ""}"><b>${fromYmd(d.date).getDate()}</b><small>${SHORT[wd]}</small></button>`;
    const buddy = pic ? `<img class="gp-buddy" src="${pic}" alt="">` : "";
    return `<div class="gp-row ${i % 2 ? "r" : "l"}">${i % 2 ? `<div class="gp-side">${buddy}</div>${dot}${card}` : `${card}${dot}<div class="gp-side">${buddy}</div>`}</div>`;
  }).join("");
  return `${glNav(wdays.some(d => d.date === today) ? today : wdays[0].date)}<div class="gp-path">
      <div class="gp-weeknav"><button class="k-arrow" data-kprev aria-label="Previous week">‹</button><span>${safe(dayHead(wdays[0].date))} – ${safe(dayHead(wdays[wdays.length - 1].date))}</span><button class="k-arrow" data-knext aria-label="Next week">›</button></div>
      ${rows}</div>`;
}
function glDayPage(ds, who, subj) {
  const today = todayYmd(), u = userById(who), wd = weekdayOf(ds), num = fromYmd(ds).getDate();
  const head = ds === today ? `Today, ${DAYS[wd]} ${num}` : ds === addDaysYmd(today, 1) ? `Tomorrow, ${DAYS[wd]} ${num}` : `${DAYS[wd]} ${num}`;
  // the usual day list (so ticks, 🔒 times and 📚 sessions work as always), then its cards are sorted into Morning · Day · Evening
  const keepW = wholeWeek, keepV = viewDay; let html = "";
  wholeWeek = false; viewDay = 0;
  try { html = weekHtml([planDay(ds)], { only: who, subj }); } finally { wholeWeek = keepW; viewDay = keepV; }
  const tpl = document.createElement("template"); tpl.innerHTML = html;
  // 🎨 v233 (Broo2a's picture, choice B): one big day card: the date box, the weekday, "3 activities · all ticked!",
  // each activity its own soft colour card (icon, name, time, the tick on the right), the prayer times strip at noon, bedtime last
  const cards = [];
  tpl.content.querySelectorAll(".k-block[data-kblock]").forEach(el => {
    const b = blocks[Number(el.dataset.kblock)] || {}, st = b.start != null ? b.start : b.oneDay ? toMin(b.oneDay.from) : null;
    const tf = el.querySelector(".t-full"), sj = b.name && findSubject(b.name);   // (the activity's own name, not the kid's: it's their page)
    if (tf && b.name && !b.fixed && (b.users || []).length === 1) tf.textContent = sj ? sj.name : b.name;
    const wh = el.querySelector(".k-sub .what"); if (tf && wh && wh.textContent.trim() === tf.textContent.trim()) wh.remove();
    cards.push({ st: st == null ? -1 : st, html: el.outerHTML });
  });
  cards.sort((x, y) => x.st - y.st);
  const n = cards.length, items = planDay(ds).items.filter(it => it.people.includes(who));
  const ticked = items.filter(it => isDone(ds, it.id, who)).length;
  const pr = prayersOn(ds), noon = 12 * 60;
  const strip = pr.length ? `<div class="gd3-pray">${pr.filter(x => x.start >= noon - 60).map(x => `<span><b>${safe(x.name)}</b> ${clock(x.start)}</span>`).join("")}</div>` : "";
  let list = "", stripDone = !strip;
  cards.forEach((c, i) => { if (!stripDone && c.st >= noon) { list += strip; stripDone = true; }
    list += `<div class="gd3-item" style="--t:${GL_TINTS[(i + 2) % GL_TINTS.length]}">${c.html}</div>`; });
  if (!stripDone) list += strip;
  const bed = bedMin(who, ds);
  if (bed != null) list += `<div class="gd3-item gd3-bed"><span class="gd3-moon" aria-hidden="true">☾</span><span><b>Bedtime</b><small>${clock(bed, true)}</small></span></div>`;
  const mon = fromYmd(ds).toLocaleDateString("en-GB", { month: "short" });
  const say = !n ? "A free day! Plan something fun?" : ds === today ? (n >= 3 ? "Today is a big one. You can do it!" : "A nice easy day today!")
    : `Here is your ${DAYS[wd]}!`;
  const subTxt = !n ? "Free day" : `${n} ${n === 1 ? "activity" : "activities"}${ticked && ticked >= items.length ? " · all ticked!" : ticked ? ` · ${ticked} ticked` : ""}`;
  const pic = charPic(u, n >= 3 ? "jump" : "happy");
  // Coming next: the next day + the next free day (no activities) in the coming week
  const sumOf = d => { const l = planDay(d).items.filter(it => it.people.includes(who)).sort((a, b) => a.start - b.start); return l; };
  const nextD = addDaysYmd(ds, 1), nl = sumOf(nextD);
  let freeD = null; for (let k = 2; k <= 7 && !freeD; k++) { const c = addDaysYmd(ds, k); if (hasPlan() && data.plan.dates[c] && !sumOf(c).length) freeD = c; }
  const nextRow = (d, l, title) => `<button class="gd-next" data-glopen="${d}">${l.length ? actIcon3d(l[0].name, l[0].type, "gd-nic") : `<span class="gd-nic gd-clock">🕒</span>`}
      <span><b>${safe(title)}, ${DAYS[weekdayOf(d)]} ${fromYmd(d).getDate()}</b><small>${l.length ? safe(l.slice(0, 2).map(it => `${it.name} · ${clock(it.start)}`).join(" · ")) + (l.length > 2 ? ` +${l.length - 2}` : "") : "Free day · plan something fun?"}</small></span><span class="kc-go">›</span></button>`;
  const next = `<h2 class="gd-nexth">Coming next</h2>${nextRow(nextD, nl, nextD === addDaysYmd(today, 1) ? "Tomorrow" : "Next")}${freeD ? nextRow(freeD, [], "Free day") : ""}`;
  return `<div class="gd-top"><button class="pill small" data-glopen="">‹ My week</button>
      <button class="pill small k-planbtn" data-dayplan="${ds}" aria-label="Day plan">📋 Plan</button></div>
    <div class="gd3-buddy">${pic ? `<img src="${pic}" alt="">` : ""}<p>${safe(say)}</p></div>
    <div class="gd-card gd3"><div class="gd3-head"><div class="gd3-date"><b>${fromYmd(ds).getDate()}</b><small>${safe(mon)}</small></div>
      <div><h2 class="gd-title">${ds === today ? "Today" : ds === addDaysYmd(today, 1) ? "Tomorrow" : safe(DAYS[wd])}</h2><p class="gd-sub">${ds === today || ds === addDaysYmd(today, 1) ? `${safe(DAYS[wd])} · ` : ""}${safe(subTxt)}</p></div></div>
      ${list || `<div class="gd-none">Nothing planned. Enjoy your free day!</div>`}</div>
    ${glDayChips(ds)}${next}`;
}
// the 7 day chips under the day card (Mo 23 … Su 29): tap = that day
function glDayChips(ds) {
  const start = addDaysYmd(ds, -weekdayOf(ds));
  return `<div class="gd3-chips">${[0, 1, 2, 3, 4, 5, 6].map(k => { const d = addDaysYmd(start, k);
    return `<button class="gd3-chip${d === ds ? " on" : ""}" data-glopen="${d}">${SHORT[weekdayOf(d)].slice(0, 2)} ${fromYmd(d).getDate()}</button>`; }).join("")}</div>`;
}
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-glopen]"); if (!b) return;
  glOpen = b.dataset.glopen || null; render(); window.scrollTo({ top: glOpen ? (document.querySelector(".gd-top") || {}).offsetTop - 70 || 0 : 0, behavior: "smooth" }); });
document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-glday]"); if (!b) return;
  glDay = b.dataset.glday; render(); const t = document.querySelector(".gl-dayname"); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });

// ---------- 📚 SUBJECT FILTER (bottom of the calendar): "All" + each subject of a kid; a subject → only its study sessions this
// week stand out (the rest is faded) and a summary card. Parents switch between kids; a kid sees only themselves. ----------
let calSubj = "all", sfKid = null;   // the subject (its name) or "all" · the kid a parent picked here (when the calendar isn't one kid's)
function subjFilterKid(who) {
  if (!isParentDevice()) return exists(me) && !isParentId(me) ? me : null;
  if (who && !isParentId(who)) return who;
  if (!kidsList().some(k => k.id === sfKid)) sfKid = kidsList().length ? kidsList()[0].id : null;
  return sfKid;
}
// Does this block count for the subject? (its session's subject: the one picked, the only one, or one it may still be)
function subjMatch(b, ds, opts, sessOf) {
  const { kid, name } = opts.subj;
  return b.type === "study" && b.acts.some(a => { if (a.user !== kid) return false;
    const x = sessOf(kid).find(y => y.date === ds && y.actId === a.actId);
    return !!x && (sameSubject(x.subject, name) || (x.needsPick && x.options.some(o => sameSubject(o.name, name)))); });
}
// "📐 Math this week: 4 sessions (Mon, Tue, Thu, Sat) · 3 h · done 2 of 4 · worksheets done 3 of 5 · topics covered 6 of 14"
function subjSummaryHtml(kid, f) {
  // 📅 v212 (Broo2a): the sessions on the days the calendar shows (Week: that week; Day: today … +6), each with its day and time.
  // Tap one → that day opens (Day view), so there's no need to look through every day.
  const dates = wholeWeek ? calWeekDates(weekShift) : aheadDates(), today = todayYmd(), now = dubaiMinutes();
  const sess = sessionsIn(kid, dates).filter(x => sameSubject(x.subject, f.name) || (x.needsPick && x.options.some(o => sameSubject(o.name, f.name))));
  const mins = sess.reduce((n, x) => n + x.minutes, 0);
  const from = data.points.week, to = weekEnd(), ws = wsOf(kid, f.name).filter(w => w.date >= from && w.date < to);
  const done = ws.filter(w => w.check || w.answers.length).length, rows = topicRows(kid, schoolOf(kid), f);
  const covered = rows.filter(t => t.st === "practising" || t.st === "mastered").length;   // (🟡 / 🟢)
  const chip = x => { const i = calDates().indexOf(x.date), past = x.date < today || (x.date === today && x.end <= now);
    const tag = x.done ? " ✅" : x.needsPick ? " ❔" : past ? " ⏳" : "";
    return `<button class="pill small subj-when ${x.date === today ? "on" : ""}" ${i >= 0 ? `data-kday="${i}"` : "disabled"} title="${safe(dayLong(x.date))}">
      <b>${SHORT[weekdayOf(x.date)]} ${fromYmd(x.date).getDate()}</b> ${clock(x.start, true)}–${clock(x.end, true)}${tag}</button>`; };
  return `<div class="card subj-sum" style="--c:${subjectColors(f).color}"><b>${safe(f.emoji)} ${safe(f.name)} · ${userById(kid).name}</b>
    <small>${sess.length} ${sess.length === 1 ? "session" : "sessions"} · ${hmText(mins)} · done ${sess.filter(x => x.done).length} of ${sess.length}</small>
    <div class="subj-whens">${sess.length ? sess.map(chip).join("") : `<span class="hint">No ${safe(f.name)} sessions on these days.</span>`}</div>
    <small>📝 Worksheets this week: done ${done} of ${ws.length} · topics covered ${covered} of ${rows.length}</small></div>`;
}
// 🔍 v180 (Broo2a): "Find a subject" sits in the days row (‹ Tue · Wed · Thu › 🔍). A parent on Everyone / their own calendar
//   picks "kid · subject" (each kid's subjects in a group); a kid's calendar: that kid's subjects.
function subjPickHtml(kid, who) {
  if (!kid) return "";
  const many = isParentDevice() && (!who || isParentId(who)) && kidsList().length > 1, kids = many ? kidsList() : [userById(kid)];
  const opt = (k, f) => { const on = k.id === kid && calSubj !== "all" && sameSubject(f.name, calSubj);
    return `<option value="${safe(k.id)}|${safe(f.name)}" ${on ? "selected" : ""}>${safe(f.emoji)} ${safe(f.name)}</option>`; };
  const groups = kids.map(k => { const subs = subjectList(schoolOf(k.id)); if (!subs.length) return "";
    return many ? `<optgroup label="${safe(k.emoji)} ${safe(k.name)}">${subs.map(f => opt(k, f)).join("")}</optgroup>` : subs.map(f => opt(k, f)).join(""); }).join("");
  if (!groups) return "";
  return `<label class="sr-only" for="calSubjPick">Find a subject</label><select id="calSubjPick" class="k-subj ${calSubj !== "all" ? "on" : ""}" data-calsubjpick>
    <option value="all" ${calSubj === "all" ? "selected" : ""}>🔍 Subject</option>${groups}</select>`;
}
function subjFilterHtml(kid, who) {
  const s = schoolOf(kid), subs = subjectList(s);
  if (!subs.length) return "";
  if (calSubj !== "all" && !subs.some(x => sameSubject(x.name, calSubj))) calSubj = "all";
  // (v180: the picker moved up into the days row; here only the picked subject's week, with ✕ to clear it)
  const f = calSubj !== "all" && subs.find(x => sameSubject(x.name, calSubj));
  return f ? `<div class="subj-filter-on">${subjSummaryHtml(kid, f)}<div class="btnrow"><button class="pill" data-calsubj="all">✕ All subjects</button></div></div>` : "";
}
// v154: the calendar's ☰ More and ⭐ Good habits open / close (this device only)
let calMore = false, calHabits = false;
document.addEventListener("change", e => {
  if (!e.target.matches || !e.target.matches("[data-calsubjpick]")) return;
  const v = e.target.value || "all", [k, name] = v.includes("|") ? v.split("|") : ["", v];
  if (k && kidsList().some(x => x.id === k)) sfKid = k;
  calSubj = name || "all";
  render();
});
document.addEventListener("click", e => {
  const t = e.target.closest && e.target.closest("[data-calmore], [data-calhabits]");
  if (t) { if ("calmore" in t.dataset) calMore = !calMore; else calHabits = !calHabits; e.stopImmediatePropagation(); return render(); }
  const b = e.target.closest && e.target.closest("[data-calsubj], [data-sfkid]");
  if (!b) return;
  if (b.dataset.sfkid) { sfKid = b.dataset.sfkid; calSubj = "all"; }
  else calSubj = b.dataset.calsubj;
  render();
});

// (The old "Everyone's plan" and "View all plan" pages are now 📅 Calendar → Everyone. These are still read by older taps.)
let allFilter = "all";     // (older) "all" or one person
let allView = "cards";
let viewMode = "day";
let viewWho = "all";
// The activity's name for View all plan: "🏫 School", "🔢 Math", "Gym_kids" (no names list, no "with …")
function viewTitle(b) {
  const subject = !b.fixed && findSubject(b.name), te = actTypeInfo(b.type || "activity")[1];   // (⭐ the type's emoji next to the name)
  return `${te} ${subject ? subject.name : b.name}`;
}
// 📅 Week summary: rows = people, columns = Mon–Sun. Each cell: that person's activities as one-line chips
// ("7:30 🏫 School"), with ✓ on done ones. At the end of the row: "Done 12/20 ⭐ 60" (their own activities and points).
function weekSummaryHtml(days, paper) {
  const today = todayYmd(), pts = pointsByUser();
  const head = `<tr><th class="vs-corner"></th>${days.map(day => `<th class="${day.date === today && !paper ? "today" : ""}">${dayHead(day.date)}</th>`).join("")}<th>This week</th></tr>`;
  const body = data.users.map(u => {
    const c = colorsOf(u);
    let own = 0, done = 0;
    const cells = days.map(day => {
      const items = day.items.filter(it => it.people.includes(u.id)).sort((a, b) => a.start - b.start);
      return `<td>${items.map(it => {
        const mine = it.users.includes(u.id);
        const ok = mine ? isDone(day.date, it.actId, u.id) : it.users.every(x => isDone(day.date, it.actId, x));
        if (mine) { own++; if (ok) done++; }
        return `<div class="vs-chip ${ok ? "done" : ""}" style="${blockColors(it)}" title="${safe(it.name)} · ${clock(it.start, true)}–${clock(it.end, true)}">${
          ok ? "✓ " : ""}${clock(it.start)} ${safe(viewTitle(it))}</div>`;
      }).join("")}</td>`;
    }).join("");
    return `<tr style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}"><th class="vs-who">${safe(u.emoji)} ${safe(u.name)}</th>${cells}
      <td class="vs-total">${isParentId(u.id) ? "" : `Done ${done}/${own} ⭐ ${pts[u.id] || 0}`}</td></tr>`;   // (👨‍👩‍👧 parents: no ticks or points)
  }).join("");
  return `<div class="vs-scroll"><table class="vs-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}
// 🖨️ Print from View all plan: the Week summary on one landscape page
function summaryPage() {
  return `<section class="p-page" style="--soft:#ede9fe;--ink:#4c1d95">
    <div><div class="p-title">👨‍👩‍👧‍👦 Everyone's Week ⭐ ${weekRange()}</div>
      <div class="p-sub">Each color is one person. ✓ = done.</div></div>
    ${weekSummaryHtml(printDays(), true)}</section>`;
}




// =====================================================================
//  PRINT: paper schedules — one A4 page (sideways) per person
// =====================================================================
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayDate(d) { const dt = fromYmd(data.points.week); dt.setDate(dt.getDate() + d); return dt; }
const printDate = d => fromYmd(aheadDates()[d]);   // 🖨️ v216 the printed days: today … today + 6 (see printDays)
// "5–11 Oct", or "28 Sep – 4 Oct" when the week goes into the next month
function weekRange() {
  const a = printDate(0), b = printDate(6);
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}

// "Who should I print?" (Dad only)
function openPrintMenu() {
  if (!isParentId(me)) return;
  if (!printDays()) return toast("Press ✨ Plan my week first, then you can print it.", 3500);
  const btn = (id, emoji, name, c) => `<button class="who-btn" data-print="${safe(id)}" style="--soft:${c.soft};--ink:${c.ink}">
      <span class="face">${safe(emoji)}</span><span class="nm">${safe(name)}</span></button>`;
  $("printWho").innerHTML = familyOrder(data.users).map(u => btn(u.id, u.emoji, u.name, colorsOf(u))).join("")
    + btn("all", "👨‍👩‍👧‍👦", "Everyone", { soft: "#fef3c7", ink: "var(--text)" });
  $("printModal").hidden = false;
  $("printWho").querySelector("button").focus();
}
function closePrintMenu() { $("printModal").hidden = true; }

// On paper there's nothing to tap, so the ⇄ note is written out, short: "⇄ Gym"
function pSame(same) {
  return same ? `<div class="p-same">⇄ ${safe(same.replace("At the same time as: ", "").replace(/ \([^)]*\)/g, ""))}</div>` : "";
}
// One activity on paper: ☐, the time, the subject with its emoji (and whose it is, on someone else's page)
function paperItem(it, pageFor, same) {
  const subject = findSubject(it.name);
  const what = it.fixed ? `${isSchoolName(it.name) ? "🏫" : "📌"} ${it.name}` : subject ? `${subject.emoji} ${subject.name}` : it.name;
  const owners = it.users;
  const notes = [];
  if (pageFor === "all" || owners.some(id => id !== pageFor)) notes.push(owners.map(whoText).join(" "));
  if (helperOf(it) && pageFor !== it.helper) notes.push(`with ${helperOf(it).name}`);
  const c = colorsOf(userById(owners[0])).color;
  return `<div class="p-item ${pageFor === "all" ? "striped" : ""}" style="--c:${c}"><span class="p-box"></span>
    <div><div class="p-time">${clock(it.start)}–${clock(it.end)}</div><div class="p-what">${safe(what)}</div>
    ${notes.length ? `<div class="p-note">${safe(notes.join(" · "))}</div>` : ""}${pSame(same)}</div></div>`;
}
// The table: one column per day, and one row per start time (like the calendar on screen),
// so things that start at the same time line up across the week. item / strip = how to draw them (optional).
function paperTable(pageFor, item, strip) {
  item = item || ((it, same) => paperItem(it, pageFor, same));
  strip = strip || (r => `<div class="p-routine">${clock(r.start)} ${safe(r.emoji)} ${safe(r.name)}</div>`);
  const week = printDays();   // (📅 paper: today … today + 6, like the plan)
  const cols = week.map(day => {
    let items = pageFor === "all" ? day.items : day.items.filter(it => it.people.includes(pageFor));
    if (pageFor === "all") {  // the same fixed activity for several people (like School) is one line
      const merged = [];
      for (const it of items) {
        const same = it.fixed && merged.find(b => b.fixed && b.name === it.name && b.start === it.start && b.end === it.end);
        if (same) same.users = [...new Set([...same.users, ...it.users])]; else merged.push({ ...it });
      }
      items = merged;
    }
    // Routines: one small, light line each (no box to tick), in time order with the activities
    const lines = routineStrips(day.routines, pageFor === "all" ? null : pageFor).map(r => ({ start: r.start, end: r.end, strip: true, padId: r.pad ? r.id : null, html: strip(r) }));
    items.forEach(it => lines.push({ start: it.start, end: it.end, padIds: padIdsOf(it), html: item(it, sameTimeText(it, items)) }));
    if (!items.length) lines.push({ free: true, start: -1, html: "" });
    return lines.sort((a, b) => a.start - b.start);
  });
  // The same layout as on screen: rows by start time, each activity spans down to its end time,
  // and things at the same time sit side by side in their own lane.
  const { rows, days } = rowLayout(cols);
  const tpl = ["auto"], first = [];
  days.forEach((x, d) => { first[d] = tpl.length + 1; for (let i = 0; i < x.L; i++) tpl.push(`minmax(0,${(1 / x.L).toFixed(4)}fr)`); });
  let html = `<div class="p-table rows" style="--cols:${tpl.join(" ")}"><div class="p-corner"></div>`;
  rows.forEach((t, r) => html += `<div class="p-rowline" style="grid-row:${r + 2}"></div><div class="p-rtime" style="grid-row:${r + 2}">${t === null ? "" : rowTime(t)}</div>`);
  days.forEach((x, d) => {
    const span = `grid-column:${first[d]} / span ${x.L}`;
    html += `<div class="p-head" style="${span};grid-row:1">${dayHead(week[d].date)}${x.free ? "<small>Free day! 🎉</small>" : ""}</div>
      <div class="p-daybg" style="${span};grid-row:2 / span ${rows.length}"></div>`;
    x.items.forEach(it => html += `<div class="p-cell ${it.strip ? "strip" : ""}" style="grid-column:${first[d] + it.lane} / span ${it.w};grid-row:${it.r0 + 2} / span ${it.n}">${it.html}</div>`);
  });
  return html + `</div>`;
}// One person's page
function paperPage(id) {
  const u = userById(id), c = colorsOf(u);
  return `<section class="p-page" style="--soft:${c.soft};--ink:${c.ink}">
    <div><div class="p-title">${safe(u.emoji)} ${safe(u.name)}'s Week ⭐ ${weekRange()}</div>
      <div class="p-sub">Tick the box ☐ when you finish each activity!</div></div>
    ${paperTable(id)}
    ${habitsTableHtml(id)}
    <div class="p-foot">
      <div class="p-stars">My stars this week: ${SHORT.map(s => `<span class="s"><b>☆</b><small>${s}</small></span>`).join("")}</div>
      <div class="p-sign">Parent signature:<span class="line"></span></div>
    </div></section>`;
}
// The extra page with everyone together (each person has their color stripe)
function everyonePage() {
  return `<section class="p-page" style="--soft:#ede9fe;--ink:#4c1d95">
    <div><div class="p-title">👨‍👩‍👧‍👦 Everyone's Week ⭐ ${weekRange()}</div>
      <div class="p-sub">The whole family's plan. Each color is one person.</div></div>
    ${paperTable("all")}
    <div class="p-foot"><div class="p-legend">${data.users.map(u => `<span style="--c:${colorsOf(u).color}"><i></i>${safe(u.emoji)} ${safe(u.name)}</span>`).join("")}</div>
      <div class="p-sign">Parent signature:<span class="line"></span></div></div></section>`;
}

// Builds the pages, then makes the text on each page small enough to fit on ONE sheet.
function buildPrint(who) {
  buildPages(who === "all" ? [...data.users.map(u => paperPage(u.id)), everyonePage()] : [paperPage(who)]);
}
// Puts the pages in the print area. Pages with a time grid already fill exactly one sheet;
// the others get their text shrunk until they fit on one sheet.
function buildPages(pages) {
  const area = $("printArea");
  area.innerHTML = pages.join("");
  area.classList.add("measuring");                     // lay it out off-screen at paper size, so we can measure
  const room = 188 * 96 / 25.4;                        // a sheet's height (in screen pixels), with a little spare
  area.querySelectorAll(".p-page:not(.pg-page)").forEach(page => {
    let size = 15;                                     // start big (15pt) …
    page.style.setProperty("--fs", size + "pt");
    while (page.scrollHeight > room && size > 6) {     // … and shrink until it fits
      size -= 0.5;
      page.style.setProperty("--fs", size + "pt");
    }
  });
  area.classList.remove("measuring");
}
function printFor(who) {
  closePrintMenu();
  buildPrint(who);
  window.print();   // opens the normal print screen (you can also choose "Save as PDF" there)
}
// ---------- 🖨️ Print on "My activities": a list of the week, day by day, with a box to tick ----------
// "5 – 11 October 2026", or "28 September – 4 October 2026" across two months
function monthName(dt) { return dt.toLocaleDateString("en-GB", { month: "long" }); }
function weekRangeLong() {
  const a = printDate(0), b = printDate(6);
  if (a.getFullYear() !== b.getFullYear()) return `${a.getDate()} ${monthName(a)} ${a.getFullYear()} - ${b.getDate()} ${monthName(b)} ${b.getFullYear()}`;
  return a.getMonth() === b.getMonth() ? `${a.getDate()} - ${b.getDate()} ${monthName(b)} ${b.getFullYear()}`
    : `${a.getDate()} ${monthName(a)} - ${b.getDate()} ${monthName(b)} ${b.getFullYear()}`;
}
function listPage(who) {
  const u = userById(who), c = colorsOf(u);
  const groups = printDays().map(day => {
    const items = day.items.filter(it => it.people.includes(who));
    return `<div class="pl-day"><div class="p-head">${dayHead(day.date)}</div>
      ${items.length ? items.map(it => paperItem(it, who)).join("") : `<div class="p-free">Free day! 🎉</div>`}</div>`;
  });
  return `<section class="p-page" style="--soft:${c.soft};--ink:${c.ink}">
    <div><div class="p-title">${safe(u.emoji)} ${safe(u.name)}'s activities - Week of ${weekRangeLong()}</div>
      <div class="p-sub">Tick the box ☐ when you finish each activity!</div></div>
    <div class="pl-cols">${groups.join("")}</div>
    <div class="p-foot"><div class="p-sign">Parent signature:<span class="line"></span></div></div></section>`;
}
function printList() {
  if (hasDraft()) return toast("💾 Save your changes first, then print.", 3500);
  if (!printDays()) return toast("There's no plan yet, so there's nothing to print.", 3500);
  buildPages([listPage(me)]);
  window.print();
}

// ---------- 🖨️ Print on the calendar pages: the whole week, in rows by time of day, on one landscape page ----------
// who = one person's id, or "all" (everyone together, for "View all plan").
// Always the whole week (Monday to Sunday), even on a phone that shows one day.
function gridPage(who) {
  const all = who === "all", u = all ? null : userById(who);
  // The same rows by time as on screen; each activity keeps its colored block with ☐ boxes
  const table = paperTable(who, (it, same) => {
    const subject = findSubject(it.name);
    const what = it.fixed ? `${isSchoolName(it.name) ? "🏫" : "📌"} ${it.name}` : subject ? `${subject.emoji} ${subject.name}` : it.name;
    const who2 = all || it.users.some(id => id !== who) ? emojisOf(it.users) + " " : "";
    const withDad = helperOf(it) && who !== it.helper ? ` · with ${helperOf(it).name}` : "";
    const boxes = (all ? it.users : [who]).map(() => `<span class="p-box"></span>`).join("");
    return `<div class="pg-ev" style="${blockColors(it)}">
        <span class="pg-boxes">${boxes}</span><div><b>${clock(it.start)}–${clock(it.end)}</b> ${safe(who2 + what + withDad)}${pSame(same)}</div></div>`;
  }, r => `<div class="pg-rt">${safe(r.emoji)} ${safe(r.name)}</div>`);
  const c = all ? { soft: "#ede9fe", ink: "#4c1d95" } : colorsOf(u);
  return `<section class="p-page" style="--soft:${c.soft};--ink:${c.ink}">
    <div><div class="p-title">${all ? "👨‍👩‍👧‍👦 Everyone's Week" : `${safe(u.emoji)} ${safe(u.name)}'s Week`} ⭐ ${weekRange()}</div>
      <div class="p-sub">Tick the box ☐ when you finish each activity!${all ? " Each color is one person." : ""}</div></div>
    ${table}
    ${all ? `<div class="p-legend">${data.users.map(x => `<span style="--c:${colorsOf(x).color}"><i></i>${safe(x.emoji)} ${safe(x.name)}</span>`).join("")}</div>` : ""}
  </section>`;
}
// (🖨️ The Calendar print is ONLY the week calendar, one landscape page: this "Good habits" table isn't printed any more.)
// The "Good habits" table for a kid's printout: habits as rows, Mon–Sun as columns, empty boxes to tick.
// Split in two tables side by side so it stays small.
function habitsTableHtml(who) {
  const list = habitsFor(who);
  if (!list.length) return "";
  const boxes = h => `<span class="p-box"></span>`.repeat(h.kind === "prayers" ? PRAYERS.length : h.kind === "water" ? WATER_DROPS : 1);
  const table = rows => `<table class="hb-table"><thead><tr><th></th>${SHORT.map(s => `<th>${s}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(h => `<tr><td class="hb-tname">${safe(h.emoji)} ${safe(h.name)}${h.kind === "prayers" ? " <small>(5)</small>" : h.kind === "water" ? " <small>(6 glasses)</small>" : ""}</td>${
      SHORT.map(() => `<td>${boxes(h)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const half = Math.ceil(list.length / 2);
  return `<div class="hb-print"><div class="hb-print-title">⭐ Good habits</div>
    <div class="hb-tables">${table(list.slice(0, half))}${table(list.slice(half))}</div></div>`;
}

// The calendar that's showing: one person's, or everyone's (📅 Calendar → Everyone)
function printCalendar() {
  if (!printDays()) return toast("There's no plan yet, so there's nothing to print.", 3500);
  // Everyone: the Week summary table on one landscape page
  buildPages([calWho === "all" ? summaryPage() : gridPage(calWho || me)]);
  window.print();
}

// ---------- 🖨️ Print family week (home page): everyone, clean and professional ----------
// White page, plain text (no emojis), thin grey lines, soft colors per person, small tick boxes, legend at the bottom.
function familyPage() {
  const table = paperTable("all", (it, same) => {
    const subject = findSubject(it.name);
    const name = subject && !it.fixed ? subject.name : it.name;
    const people = namesOf(it.users) + (helperOf(it) ? ` with ${helperOf(it).name}` : "");
    return `<div class="pg-ev" style="${blockColors(it)}">
        <span class="pg-boxes">${it.users.map(() => `<span class="p-box"></span>`).join("")}</span>
        <div><b>${safe(name)}</b> <span class="pf-meta">${clock(it.start)}–${clock(it.end)} · ${safe(people)}</span>${pSame(same)}</div></div>`;
  }, r => `<div class="pg-rt">${safe(r.name)}</div>`);
  return `<section class="p-page pro">
    <div class="pf-top"><div class="p-title">${APP_NAME}</div><div class="p-sub">Week of ${weekRangeLong()}</div></div>
    ${table}
    <div class="p-legend">${data.users.map(u => `<span style="--c:${colorsOf(u).color}"><i></i>${safe(u.name)}</span>`).join("")}
      <span style="--c:${GREY.color}"><i></i>Fixed or shared (school, work …)</span></div>
  </section>`;
}function printFamilyWeek() {
  if (!printDays()) return toast("There's no plan yet, so there's nothing to print.", 3500);
  buildPages([familyPage()]);
  window.print();
}

// If someone prints from the browser's own menu instead, print their own week.
window.addEventListener("beforeprint", () => {
  if (!$("printArea").innerHTML.trim() && exists(me) && printDays()) buildPrint(me);
});

// 🕗 v203 (Broo2a): the day's own time under each day's name ("🕗 8 AM – 11 PM"). A parent taps it to change it for every
// Sunday (or that weekday) right here; nothing is planned outside it. (The same times as ⚙️ Settings → My day.)
function dayHoursHtml(ds, opts) {
  if (!wholeWeek && !opts.whole) return "";
  const [s, e] = dayWindow(weekdayOf(ds)), can = isParentDevice() && !opts.readOnly && ds >= todayYmd();
  const txt = `🕗 ${clock(s, true)} – ${clock(e, true)}`;
  return can ? `<button class="k-dayhours" data-dayhours="${ds}" title="Change this day's time">${txt}</button>` : `<div class="k-dayhours">${txt}</div>`;
}
function openDayHours(ds) {
  if (!isParentDevice()) return;
  const wd = weekdayOf(ds), [s, e] = dayWindow(wd);
  $("kCard").style.cssText = "--soft:#fef3c7;--ink:#92400e";
  $("kCard").innerHTML = `<div class="k-card-top"><div class="big">🕗</div><div class="nm">Every ${DAYS[wd]}</div></div>
    <p class="hint" style="text-align:center;margin:6px 16px">When the day starts and ends. Nothing is planned outside it.</p>
    <div class="dh-box"><label>Starts at <input type="time" id="dhStart" value="${clock24(s)}" step="900"></label>
      <label>Ends at <input type="time" id="dhEnd" value="${clock24(e)}" step="900"></label></div>
    <div class="err" id="dhErr"></div>
    <div class="btnrow" style="justify-content:center"><button class="pill primary" data-dhsave="${wd}">💾 Save and plan again</button></div>
    <button class="k-ok" id="kOk">Cancel</button>`;
  $("kModal").hidden = false;
}
function saveDayHoursOf(wd) {
  const st = $("dhStart").value, en = $("dhEnd").value;
  if (!/^\d{2}:\d{2}$/.test(st) || !/^\d{2}:\d{2}$/.test(en) || toMin(en) <= toMin(st)) return $("dhErr").textContent = "The day must end after it starts.";
  if (hasDraft()) return $("dhErr").textContent = "💾 Save your other changes first.";
  const days = DAYS.map((_, i) => { const [a, b] = dayWindow(i); return { start: clock24(a), end: clock24(b) }; });
  days[wd] = { start: st, end: en };
  data.myDay = { start: days[0].start, end: days[0].end, weekendOwn: days[5].start !== days[0].start || days[5].end !== days[0].end,
                 weekendStart: days[5].start, weekendEnd: days[5].end, days };
  closeCard();
  const w = calWho, wk = wholeWeek, sh = weekShift;
  planNow();   // (saved and planned again: the new time counts straight away)
  go("mine"); calWho = w; wholeWeek = wk; weekShift = sh; render();
  toast(`🕗 Every ${DAYS[wd]}: ${clock(toMin(st), true)} – ${clock(toMin(en), true)}. The week is planned again.`, 4000);
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-dayhours], [data-dhsave]"); if (!b) return;
  if (b.dataset.dayhours) return openDayHours(b.dataset.dayhours);
  saveDayHoursOf(Number(b.dataset.dhsave));
});

// ⏰ v231: a 🔒 opens by itself when its time comes (no refresh): every 20 seconds, if an activity of today has just started
// (and nobody is in the middle of editing), the page is drawn again.
let lockMinSeen = null;
setInterval(() => {
  try {
    if (document.hidden || typeof data === "undefined" || !data || !hasPlan() || editMode || hasDraft() || !["mine", "home", "kid"].includes(screen)) return;
    const now = dubaiMinutes(), was = lockMinSeen; lockMinSeen = now;
    if (was == null || now === was) return;
    if (planDay(todayYmd()).items.some(it => it.start > was && it.start <= now)) render();
  } catch (e) {}
}, 20000);
// (✓ Mark done on the big card: the tick is saved by the usual [data-check] tap, then the card closes)
document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".kc3-x")) $("kModal").hidden = true; });
document.addEventListener("click", e => { if (e.target.closest && e.target.closest(".kc3-done")) setTimeout(() => { $("kModal").hidden = true; }, 350); });
