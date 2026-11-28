// =====================================================================
//  🧒 KIDS' HOME = SUPER SIMPLE: day + date, hello with ✨ the Spark (+ the encouraging line in the top bar),
//   two BIG buttons (📚 STUDY → 🎒 My school · 📅 CALENDAR → my calendar, today), "📊 My week" (words next to every symbol),
//   then a small bottom bar for the rest: 🏆 Points · ⭐ Habits · 📔 My day · 🏡 Community · 👤 Me · ☰ More.
//   (⭐ Habits opens my habits and 🧹 duties right here. The 🧩 riddle still pops up when the app opens.)
// =====================================================================
let kidPanel = null;
// 🫧 v159 THE PUFFY BANNER (Broo2a's "Daily Planner" picture): a cream puffy board, the title in 3D bubble letters
//   (the last word purple, the rest pink), a soft pill under it, and (🧒 v227) your own character at the top left.
//   Every page title (h1.page-title) becomes one after each render; the home's date is one too (see drawHome).
const PUFF_PILLS = { home: "plan your day, make it happen!", mine: "plan your week, make it happen!", school: "learn, explore, grow!", points: "every star counts!",
  me: "this is me!", add: "plan something new", settings: "make it just right", family: "together is better", diary: "how was your day?", report: "look how you grow!",
  kidswork: "busy little bees!", kid: "all about them", extra: "have fun together!", setup: "make the app yours" };
const SUBJECT_PILLS = [[/math/i, "practice makes perfect!"], [/science/i, "ask, try, discover!"], [/english/i, "read, write, shine!"], [/arabic/i, "every word counts!"],
  [/islam|quran/i, "learn with your heart"], [/ssa|social|humanit/i, "explore the world!"]];
// 🧒 v227 (Broo2a): the bunny/bear/heart stickers are gone; the banner shows YOUR character (picked in 👤 Me) with the feeling of that page.
// 🎭 v233: the new feelings (wave = hello · point = tips · think = help · proud = how you grow)
const PAGE_MOODS = { home: "wave", mine: "point", school: "reading", points: "proud", me: "wave", add: "point", settings: "point", family: "wave",
  diary: "happy", report: "proud", kidswork: "think", kid: "wave", extra: "happy", setup: "point" };
// 🌈 v233 (Broo2a's colourful pictures): the banner shows the page's kid on the left and again on the right (another feeling); home: a brother/sister
const RIGHT_MOODS = { mine: "jump", school: "jump", points: "confetti", me: "proud", report: "jump", kid: "jump", diary: "wave" };
const buddyId = () => screen === "school" && typeof schoolKid !== "undefined" && exists(schoolKid) ? schoolKid : me;
const otherKids = id => data.users.filter(u => !isParentId(u.id) && u.id !== id && charPic(u));
const puffDeco = mood => { const id = buddyId(), src = charPic(userById(id), mood || PAGE_MOODS[screen] || "happy"), sib = otherKids(id)[0];
  // (Broo2a 27 Nov: a kid's pages show ONLY that kid's character, in 2 feelings; the home page may show the whole family)
  const right = screen === "home" ? (sib ? charPic(sib, "wave") : "") : charPic(userById(id), RIGHT_MOODS[screen] || "jump");
  return (src ? `<img class="pb-deco pb-l pb-char" src="${src}" alt="">` : "") + (right ? `<img class="pb-deco pb-rr pb-char" src="${right}" alt="">` : ""); };
// 💬 the buddy under the title: [mood, big line, small line] ({n} = the kid's name)
const BUDDY_LINES = { home: ["wave", "Hi {n}!", "Let's make today a great day"], mine: ["point", "Here is your week, {n}!", "Tap a day to see what is inside"],
  school: ["happy", "Pick a subject, {n}!", "Every worksheet makes you stronger"], points: ["proud", "Look at your stars, {n}!", "Beat yourself, not anyone else"],
  me: ["wave", "This is you, {n}!", "You can change your character any time"], diary: ["happy", "How was your day?", "Tell me in a few words"],
  report: ["proud", "Look how you grow!", "Every week a little better"], kidswork: ["think", "Let's see today's work", "Who needs a little help?"],
  add: ["point", "What are we planning?", "Pick a type, who it is for, and when."], settings: ["point", "Make it just right", "Change anything, any time"],
  family: ["wave", "Together is better", "Everyone in one place"], kid: ["wave", "All about {n}", "Scores, school and today"], extra: ["happy", "Have fun together!", ""],
  setup: ["point", "Make the app yours", "Turn on what your family needs"] };
// 🧒 3 characters at the end of a page: [mood, word] × 3 (me in 3 feelings; on home: me, then my brothers/sisters)
const STRIP_WORDS = { school: [["reading", "Read"], ["jump", "Learn"], ["proud", "Grow"]], mine: [["point", "Plan"], ["think", "Do"], ["confetti", "Win"]],
  points: [["think", "Try"], ["jump", "Shine"], ["confetti", "Win"]], home: [["wave", "Hello"], ["jump", "Play"], ["proud", "Learn"]] };
function drawBuddies() {
  const scr = document.querySelector(".screen:not([hidden])"); if (!scr) return;
  const id = buddyId(), u = userById(id), h = scr.querySelector("h1.page-title, .home-date");
  const old = scr.querySelector(":scope .buddy-row"); if (old) old.remove();
  const subj = screen === "school" && typeof schoolView !== "undefined" && schoolView === "subject" ? plainWords((h && h.dataset.puffed) || "") : "";
  const gapV = screen === "school" && typeof schoolView !== "undefined" && schoolView === "gaps";   // (🧭 v239: that page has its own thinking character)
  const line = gapV ? null : subj ? ["think", `Let's practise ${subj}, {n}!`, "A little every day makes it easy"] : BUDDY_LINES[screen], pic = line && charPic(u, line[0]);
  if (h && pic && screen !== "home") h.insertAdjacentHTML("afterend", `<div class="buddy-row"><img src="${pic}" alt=""><div class="buddy-bub"><b>${safe(line[1].replace("{n}", u.name))}</b>${line[2] ? `<small>${safe(line[2].replace("{n}", u.name))}</small>` : ""}</div></div>`);
  const oldS = scr.querySelector(":scope > .buddy-strip"); if (oldS) oldS.remove();
  const words = STRIP_WORDS[screen], kids = (screen === "home" ? [u, ...otherKids(id)] : [u]).filter(k => charPic(k));   // (only my character, except on home)
  if (words && kids.length && !gapV) scr.insertAdjacentHTML("beforeend", `<div class="buddy-strip" aria-hidden="true">${words.map(([m, w], i) =>
    `<figure><img src="${charPic(kids[i % kids.length], m)}" alt=""><figcaption>${w}</figcaption></figure>`).join("")}</div>`);
}
const gapsPill = () => { const k = userById(schoolKid) || {}; return [k.curriculum ? `${k.curriculum} curriculum` : "", gradeOf(schoolKid)].filter(Boolean).join(", ") || "what needs a little help"; };
const plainWords = t => String(t || "").replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u200D\uFE0F⬅️➡️›‹·]/gu, "").replace(/\s+/g, " ").trim();
function puffBannerHtml(title, pill, mood) {
  const w = plainWords(title).split(" "), last = w.pop();
  return `${puffDeco(mood)}<span class="pb-t">${w.length ? `<span class="bub bub-pink">${safe(w.join(" "))}</span> ` : ""}<span class="bub ${w.length ? "bub-lilac" : "bub-pink"}">${safe(last)}</span></span>
    ${pill ? `<span class="bub-pill">${safe(pill)}</span>` : ""}`;
}
function puffTitles() {
  const scr = document.querySelector(".screen:not([hidden])"); if (!scr) return;
  scr.querySelectorAll("h1.page-title").forEach(h => {
    const raw = h.dataset.puffed && h.querySelector(".pb-t") ? h.dataset.puffed : h.textContent, t = plainWords(raw);
    const who = `${buddyId()}|${userById(buddyId()).avatar || ""}|${screen === "school" && schoolView === "gaps" ? schoolKid : ""}`;   // (🎭 v233: draw again when someone else uses the app or picks a new character)
    if (!t || (h.dataset.puffed === raw && h.dataset.puffWho === who && h.querySelector(".pb-t"))) return;
    h.dataset.puffWho = who;
    const sub = screen === "school" && schoolView === "gaps" ? gapsPill() : screen === "school" && schoolView === "subject" ? (SUBJECT_PILLS.find(([re]) => re.test(t)) || [0, "you can do it!"])[1] : PUFF_PILLS[screen] || "";
    h.classList.add("puff-banner"); h.innerHTML = puffBannerHtml(raw, sub); h.dataset.puffed = raw;
  });
  drawBuddies();   // 🌈 v233
}
// 🧸 v159 planner style (Broo2a's "Daily Planner" picture): 3D icons (icons/3d/<name>.png, cut from their icon set),
//   ribbon titles, lined paper cards: ❤️ Top 3 (must-do habits first, then what's next) · 🕒 My schedule (+ a sticky note) · 💧 Habit tracker · a kind quote
// 🧸 v239 (Broo2a: "use all new icons"): old 3D icons swap to the new clay set wherever one fits
const CLAY_SWAP = { calendar: "c-calendar", "k-calendar": "c-calendar", heart: "c-heart", "k-habits": "c-heart", excellent: "c-trophy", achieve: "c-trophy", medal: "c-trophy", milestone: "c-trophy",
  paper: "c-shield", "k-stars": "c-star", school: "c-school", read: "c-book", study: "c-book", "k-study": "c-book", lesson: "c-book", time: "c-clock",
  homework: "c-pencil", "k-ws": "c-pencil", practice: "c-pencil", exam: "c-pencil", basketball: "c-football", goal: "c-rocket", "k-goal": "c-rocket", "k-upload": "c-plus" };
const ico3d = (n, cls = "") => `<img class="i3d ${cls} ${CLAY_SWAP[n] ? "i3d-clay" : ""}" src="icons/3d/${CLAY_SWAP[n] || n}.png" alt="">`;
const ribbon = (txt, tone) => `<span class="pl-rib pl-rib-${tone}">${txt}</span>`;
const KID_QUOTES = ["Small steps every day lead to big changes", "You are braver than you think", "Mistakes help you learn", "Try your best, that is enough", "Every day is a fresh start"];
function kidPlannerHtml(u, today, hb) {
  const d = todayYmd(), done = x => isDone(d, x.id, u.id);
  const musts = habitsFor(u.id).filter(h => h.must).map(h => ({ name: h.name, ok: habitDone(h, data.habitMarks[habitKey(d, h.id, u.id)]), attr: `data-kidpanel="habits"` }));
  const top = [...musts, ...today.filter(x => !done(x)).map(x => ({ name: x.name, ok: false, attr: "data-kidcal" }))].slice(0, 3);
  const cups = Math.min(hb.all, 10), full = hb.all ? Math.round(hb.done * cups / hb.all) : 0;
  const cup = on => `<svg class="pl-cup${on ? " on" : ""}" viewBox="0 0 30 38" aria-hidden="true"><path d="M3 3h24l-3 32H6z" class="g"/>${on ? `<path d="M5.2 13h19.6l-2.1 20H7.3z" class="w"/>` : ""}<path d="M7 6h3" class="s"/></svg>`;
  const quote = KID_QUOTES[(new Date(d + "T12:00:00Z").getUTCDate()) % KID_QUOTES.length];
  return `${top.length ? `<div class="pl-card pl-pink">${ribbon("Top 3 today", "pink")}
      ${top.map((t, i) => `<button class="pl-line${t.ok ? " done" : ""}" ${t.attr}><span class="pl-heart">${i + 1}</span><b>${safe(t.name)}</b>${t.ok ? `<span class="pl-tick">✓</span>` : ""}</button>`).join("")}</div>` : ""}
    ${today.length ? `<div class="pl-card pl-lilac">${ribbon("My schedule", "lilac")}${ico3d("time", "pl-clock")}
      <div class="pl-note">you can<br>do it!</div>
      ${today.slice(0, 7).map(x => `<button class="pl-line pl-time${done(x) ? " done" : ""}" data-kidcal><span class="pl-t">${x.start >= 0 ? clock(x.start, true) : "Any"}</span><b>${safe(x.name)}</b><span class="pl-box">${done(x) ? "✓" : ""}</span></button>`).join("")}
      ${today.length > 7 ? `<button class="pl-more" data-kidcal>See all ${today.length}</button>` : ""}</div>` : ""}
    ${hb.all ? `<button class="pl-card pl-blue pl-track" data-kidpanel="habits">${ribbon("Habit tracker", "blue")}
      <span class="pl-cups">${Array.from({ length: cups }, (_, i) => cup(i < full)).join("")}</span><small>${hb.all <= 10 ? `${hb.done} of ${hb.all} good habits today` : `${Math.round(hb.done / hb.all * 100)}% of today's habits done`}</small></button>` : ""}
    <div class="pl-quote">${ico3d("idea", "pl-qi")}<p>${quote}</p></div>`;
}   // the part opened from the bottom bar on the home: "habits" | null
// 🧸 v239 the clay icons (Broo2a's set, icons/3d/c-*.png) on a soft coloured square, by what the activity is
const CLAY_ACT = [[/read|book|quran|story/i, "book", "g"], [/sheet|math|study|homework|revis|spell|english|science|arabic|lesson|tutor/i, "pencil", "b"],
  [/foot|ball|swim|sport|gym|run|karate|tennis|bike|play/i, "football", "p"], [/school/i, "backpack", "y"], [/bed|sleep|prayer|pray/i, "clock", "l"], [/fun|game|free|party|gift/i, "star", "y"]];
function clayAct(name, type) {
  const hit = CLAY_ACT.find(([re]) => re.test(name || "")) || (type === "study" ? CLAY_ACT[1] : type === "sport" ? CLAY_ACT[2] : type === "free" || type === "family" ? CLAY_ACT[5] : null);
  return hit ? `<span class="kh6-ic sq-${hit[2]}">${ico3d("c-" + hit[1], "kh6-i3")}</span>` : `<span class="kh6-ic">${actIcon3d(name, type, "kh6-i3")}</span>`;
}
const KID_BAR_CLAY = { Points: "c-trophy", Habits: "c-heart", "My day": "c-book", Community: "c-gift", Me: "c-starbox", More: "c-plus" };   // 🧸 v239 clay icons in the kid's menu
function drawKidHome(u) {
  const p = lifetimePoints(u.id), L = levelOf(p), pct = levelPct(p), from = data.points.week, to = weekEnd();
  const today = todayItems(u.id), doneToday = today.filter(x => isDone(todayYmd(), x.id, u.id)).length;
  const free = freeStudy(u.id), study = homeworkPoints(u.id, from, to) + studyPoints(u.id, from, to) + free.points;   // (⭐ free study in 📚 Study too)
  $("homeNote").hidden = true;
  $("homeBig").hidden = false;
  $("homeBig").className = "kid-big";
  // 🧸 v158 clay home: a peach hello card · 4 big puffy tiles (Study · Calendar · Habits · Score) · Today's list
  const left = today.length - doneToday, hb = kidHabitsToday(u.id), hr = Number(new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", hour: "2-digit", hour12: false }));
  const hi = hr < 12 ? "Good morning!" : hr < 17 ? "Good afternoon!" : "Good evening!";
  const next = today.find(x => !isDone(todayYmd(), x.id, u.id));
  const tile = (cls, attr, icon, label, big, sub) => `<button class="kt ${cls}" ${attr}><span class="kt-ico" aria-hidden="true">${icon}</span><span class="kt-label">${label}</span><b class="kt-big">${big}</b><small>${sub}</small></button>`;
  // 🧒 v227 the hero: my character, happy · 👍 when today is all done · 😴 after my bedtime · no character yet → my emoji + "Choose your character"
  const nowMin = hr * 60 + new Date().getMinutes(), bed = bedUsual(u.id, todayIndex()), heroMood = bed != null && nowMin >= bed - 30 ? "sleepy" : today.length && !left ? "jump" : "wave";   // (🎭 v233: all done = jump, else wave)
  // 🌈 v233 (Broo2a's picture): Hi Bana! + the date · my character + a bubble + my score bar · 4 soft tiles · Today's list
  const sc = scoreOf(u.id), c = colorsOf(u), dz = o => new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", ...o });
  const head = !today.length ? "Nothing planned today. Enjoy!" : !left ? "All finished today, superstar!" : left === 1 ? "Just 1 thing left today!" : `${left} things left today. You can do it!`;
  const sub = !today.length ? hi : !left ? (hb.all && hb.done < hb.all ? `Good habits are next. Tick them to keep your ${sc.overall}!` : "Time to relax. See you tomorrow!") : next ? `Next: ${next.name}${next.start >= 0 ? ` at ${clock(next.start, true)}` : ""}.` : hi;
  const tile3 = (cls, attr, icon, title, sub2) => `<button class="kt3 ${cls}" ${attr}><span class="kt3-ic">${icon}</span><b>${title}</b><small>${sub2}</small></button>`;
  const d0 = todayYmd(), bedM = bedUsual(u.id, todayIndex());
  const row = x => { const ok = isDone(d0, x.id, u.id), isNext = next && x.id === next.id;
    return `<button class="kd3-row ${ok ? "done" : ""}" data-kidcal>${actIcon3d(x.name, x.type, "kd3-ic")}<span class="kd3-t"><b>${safe(x.name)}</b><small>${x.start >= 0 ? `${clock(x.start)} - ${clock(x.end)}` : "Any time"}</small></span>${
      ok ? `<span class="kd3-ok" aria-label="Done">✓</span>` : isNext && x.start >= 0 ? `<span class="kd3-at">${clock(x.start, true).toUpperCase()}</span>` : `<span class="kd3-todo"></span>`}</button>`; };
  // 🌈 v239 (Broo2a's kid-home design, 28 Nov): hero (standing me · date pill · Hi Name! · today's line · 🔥 days · ★ +N this week · ✨ Lv) ·
  //   MY SCORE + TODAY cards · My day list · 3 tiles (My Stars · School · Calendar). ⭐ points and 🎯 score stay apart (two different numbers).
  const streak = dayStreak(u.id), pts = pointsByUser()[u.id] || 0, scored = scoredUsers().some(x => x.id === u.id);
  const stand = faceAvatar(u) ? charPic(u, heroMood === "sleepy" ? "sleepy" : "happy") || avatarSrc(u.avatar) : "";   // v239 (Broo2a): just the face, small
  const row6 = x => { const ok = isDone(d0, x.id, u.id), isNext = next && x.id === next.id, len = x.start >= 0 && x.end > x.start ? x.end - x.start : 0;
    const when = x.start >= 0 ? (isNext && !ok ? `Next up · ${clock(x.start)}` : `${clock(x.start)}${len ? ` · ${len} min` : ""}`) : isNext && !ok ? "Next up · any time" : "Any time";
    return `<button class="kh6-row ${ok ? "done" : ""}" data-kidcal>${clayAct(x.name, x.type)}<span class="kh6-t"><b>${safe(x.name)}</b><small>${when}</small></span><span class="kh6-box ${ok ? "ok" : ""}" aria-label="${ok ? "Done" : "Not done yet"}">${ok ? ico3d("c-check", "kh6-ck") : ""}</span></button>`; };
  const tile6 = (cls, attr, icon, title, sub2) => `<button class="kh6-tile ${cls}" ${attr}><span class="kh6-ti">${icon}</span><b>${title}</b><small>${sub2}</small></button>`;
  $("homeBig").innerHTML = `${homeLogoHtml()}<div class="kh6-hero" style="--soft:${c.soft};--c:${c.color}">${SPARKLES}${calTileHtml()}
      ${stand ? `<img class="kh6-pic" src="${stand}" alt="">` : `<button class="kh6-pic k-pickchar" data-pickchar aria-label="Choose your character">${safe(u.emoji)}<small>Choose your character</small></button>`}
      <div class="kh6-mid">
        <h1 class="kh6-hi">Hi <em>${safe(u.name)}!</em></h1><p class="kh6-sub">${safe(head)}</p>
        <div class="kh6-chips">${streak ? `<span class="kh6-chip fire">${ico3d("c-flame", "kh6-ci")}${streak} ${streak === 1 ? "day" : "days"}</span>` : ""}<button class="kh6-chip pts" data-go="points">${ico3d("c-star", "kh6-ci")}+${pts} this week</button>${
          feat("buddy") && hasSpark(u.id) ? `<button class="kh6-chip spark" data-buhist="${safe(u.id)}" aria-label="Spark level ${L}, ${pct}% to level ${L + 1}">✨ Lv ${L} · ${pct}%</button>` : ""}</div></div></div>
    <div class="kh6-two">${scored ? `<button class="kh6-stat sc" data-sdpop="${safe(u.id)}"><small>My score</small><b>${sc.overall}</b><i><em style="width:${Math.min(100, Math.round(sc.overall / (sc.max || 100) * 100))}%"></em></i></button>` : ""}
      <button class="kh6-stat td" data-kidcal><small>Today</small><b>${doneToday}<span> of ${today.length}</span></b><i><em style="width:${today.length ? Math.round(doneToday / today.length * 100) : 0}%"></em></i></button></div>
    ${comingCardHtml(comingUp(u.id), false)}
    ${today.length || bedM != null ? `<div class="kh6-card"><div class="kh6-h"><b>My day</b><small>${today.length} ${today.length === 1 ? "thing" : "things"}</small></div>${today.slice(0, 8).map(row6).join("")}${today.length > 8 ? `<button class="pl-more" data-kidcal>See all ${today.length}</button>` : ""}
      ${bedM != null ? `<div class="kh6-bed"><span class="kh6-ic sq-l">${ico3d("c-clock", "kh6-i3")}</span><b>Bedtime</b><span>${clock(bedM, true)}</span></div>` : ""}</div>` : `<div class="kh6-card"><p class="kh6-sub">${safe(sub)}</p></div>`}
    <div class="kh6-tiles">${tile6("y", `data-go="points"`, ico3d("c-star"), "My Stars", `${pts} this week`)}
      ${tile6("b", `data-school="${safe(u.id)}"`, ico3d("c-backpack"), "School", "My subjects")}
      ${tile6("p", "data-kidcal", ico3d("c-calendar"), "Calendar", "This week")}</div>
    <div class="kh6-more"><button class="kh6-row" data-kidpanel="habits"><span class="kh6-ic sq-r">${ico3d("c-heart", "kh6-i3")}</span><span class="kh6-t"><b>Good habits</b><small>${hb.all ? `${hb.done} of ${hb.all} done today` : "None today"}</small></span><span class="kh6-go">${ico3d("c-chevron", "kh6-gi")}</span></button></div>
    <div class="kh3-say">${sayBoxHtml(u)}</div>
    ${familySaysHtml(u.id)}
    ${wishCardHtml(u)}`;
  $("homeMenu").hidden = true;
  const bar = [["data-go=\"points\"", "🏆", "Points"], ["data-kidpanel=\"habits\"", "⭐", "Habits"], ...(feat("diary") ? [["data-go=\"diary\"", "📔", "My day"]] : []),
               ...(feat("meeting") ? [[`data-extra="meeting"`, "🏡", "Community"]] : []), ["data-profile", "👤", "Me"], ["data-homemore", "☰", "More"]];
  $("homeHabits").innerHTML = (u.buddy || !feat("buddy") ? "" : buddyCardHtml(me))
    + `${free.count ? `<div class="card kid-week" style="--c:${colorsOf(u).color}">${free.count ? `<p class="kid-free">${freeLine(free)}</p>` : ""}</div>` : ""}
    <nav class="kid-bar" aria-label="More">${bar.map(([attr, e, label]) => `<button ${attr} class="${(attr.includes("habits") && kidPanel === "habits") || (attr === "data-homemore" && homeMore) ? "on" : ""}"><span class="e">${KID_BAR_CLAY[label] ? ico3d(KID_BAR_CLAY[label], "kb-clay") : e}</span><small>${label}</small></button>`).join("")}</nav>
    ${kidPanel === "habits" ? habitsCardHtml(me) + (feat("chores") ? choresTodayHtml(me) : "") || `<div class="card"><p class="sc-empty">No habits today.</p></div>` : ""}
    ${homeMore ? `<div class="menu kid-more">${moreTilesHtml()}</div>` : ""}`;
  $("homeCal").innerHTML = "";
  maybeMakeRiddles();
  maybeShowTour();
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("#scr-home [data-kidpanel], #scr-home [data-kidcal]");
  if (!b) return;
  if ("kidcal" in b.dataset) { go("mine"); calWho = me; return render(); }   // 📅 my own calendar, today
  kidPanel = kidPanel === b.dataset.kidpanel ? null : b.dataset.kidpanel;
  homeMore = false;
  render();
});
// ☰ More: everything that isn't on the Today screen
// (☰ More is only 👤 My profile · 🔒 Your privacy · 👋 Show the tour; a parent's other pages are in their Family tiles and 👨‍👩‍👧 Family settings)
let homeMore = false;
const tileHtml = t => `<button class="tile ${t.cls || ""}" ${t.attr ? t.attr : t.plan ? "data-plan" : t.extra ? `data-extra="${t.extra}"`
  : t.tour ? "data-tour" : t.privacy ? "data-privacy" : t.profile ? "data-profile" : t.signout ? "data-signout" : `data-go="${t.go}"`}>
    <span class="t-emoji">${t.emoji}</span><span class="t-label">${t.label}</span><span class="t-sub">${t.sub}</span></button>`;
const TOUR_TILE = { tour: true, emoji: "👋", label: "Show the tour", sub: "How the app works" };
const PRIVACY_TILE = { privacy: true, emoji: "🔒", label: "Your privacy", sub: "Who can see your data" };
const PROFILE_TILE = { profile: true, emoji: "👤", label: "My profile", sub: "My Spark, birthday, things I love" };
// =====================================================================
//  👨‍👩‍👧 THE PARENT'S HOME (see drawHome): 🔔 Needs you · a card per kid → 👧 the Kid page · the Family row · ✏️ Add / Plan · ☰ More
// =====================================================================
let homeAddPlan = false, needsOpen = null;   // the ✏️ Add / Plan menu is open · "Needs you": null | "list" | one thing's key
// What needs a parent now: ⭐ sessions to rate (and ❌ sessions without a worksheet), 🧒 a kid's setup, 🗓️ the plan, 📰 newsletters
function needsItems() {
  const out = [], rate = rateCardsHtml(), nRate = (rate.match(/class="card rate-card"/g) || []).length;
  if (nRate) out.push({ key: "rate", text: `⭐ ${nRate} ${nRate === 1 ? "session" : "sessions"} to rate`, html: rate });
  // 🙋 v231: a kid asks to add or change an activity
  const asks = isParentId(me) ? data.asks || [] : [];
  if (asks.length) out.push({ key: "asks", text: asks.length === 1 ? `🙋 ${kidNameOf(asks[0].by)} asks: ${asks[0].act.name}` : `🙋 ${asks.length} activities the kids ask for`, html: asksCardHtml() });
  const setup = kidSetupHtml();
  if (setup) out.push({ key: "setup", text: "🧒 Finish a kid's setup", html: setup });
  if (isParentId(me) && (!hasPlan() || planIsOld())) out.push({ key: "plan", text: !hasPlan() ? "🗓️ No plan yet" : "🗓️ Things changed: plan again",
    html: `<div class="card"><p>${!hasPlan() ? "🗓️ No plan yet. Add activities, then press ✨ Plan my week." : "⚠ Things changed since your last plan. Press ✨ Plan my week to update it."}</p>
      <div class="btnrow"><button class="primary" data-plan>✨ Plan my week</button><button data-go="add">✏️ Add activities</button></div></div>` });
  // 🙋 a kid asked a parent to check an answer
  const asked = isParentId(me) && !isKidDevice() ? askedWs() : [];
  if (asked.length) out.push({ key: "ask", text: asked.length === 1 ? `🙋 ${kidNameOf(asked[0].w.kid)} asks you to check ${asked[0].nums.map(n => "Q" + n).join(", ")} in ${asked[0].w.subject}` : `🙋 ${asked.length} answers to check`,
    html: `<div class="card">${asked.map(x => `<p>🙋 <b>${safe(kidNameOf(x.w.kid))}</b> asks you to check ${x.nums.map(n => "Q" + n).join(", ")} in ${safe(x.w.subject)} (${safe(x.w.title)})</p>
      <div class="btnrow"><button class="primary" data-wsaskopen="${safe(x.id)}">Check it</button><button data-wsaskx="${safe(x.id)}" aria-label="Remove this alert">✕ Remove</button></div>`).join("")}
      ${asked.length > 1 ? `<div class="btnrow"><button data-wsaskx="all">✕ Clear all</button></div>` : ""}</div>` });
  // 😟 v179: a kid is stuck on a topic (5 worksheets in a row under 60 %)
  const stuck = stuckList();
  if (stuck.length) out.push({ key: "stuck", text: stuck.length === 1 ? `😟 ${kidNameOf(stuck[0].kid)} is stuck on ${topicShort(stuck[0].t.title)}` : `😟 ${stuck.length} topics the kids are stuck on`,
    html: stuck.map(stuckCardHtml).join("") });
  // 📋 v191: missing topics of the school week that just ended
  const gaps = gapNotes();
  if (gaps.length) out.push({ key: "gaps", text: `📋 Missing topics for ${[...new Set(gaps.map(x => kidNameOf(x.kid)))].join(", ")}`, html: gapCardsHtml() });
  // 📌 v193: school dates of today / tomorrow (+ tests in 3 days), with their notes and ✏️ practice tests
  const cu = isParentId(me) ? kidsList().flatMap(k => comingUp(k.id)) : [];
  if (cu.length) out.push({ key: "coming", text: `📌 Coming up: ${cu.slice(0, 2).map(e => `${whenWord(e.days).toLowerCase()} ${e.title} (${kidNameOf(e.kid)})`).join(", ")}${cu.length > 2 ? ` +${cu.length - 2}` : ""}`,
    html: comingCardHtml(cu, true) });
  // 🌙 v212 (Broo2a): a kid with no bedtime: ask for the time planning stops (nothing is planned or moved after it)
  const noBed = isParentId(me) && !data.calSetup && kidsList().length ? kidsList() : [];   // (📅 v213 until the Calendar setup box is saved once)
  if (noBed.length) out.push({ key: "calsetup", text: "📅 Set up the calendar: weekend, day start and end, school",
    html: `<div class="card bed-set"><p><b>📅 Calendar setup</b></p><p class="hint">Fill this once. The planner uses it for every week. You can change it later in ⚙️ Settings.</p>${calBoxHtml()}</div>` });
  // 🏫 v218 (Broo2a): a kid with no school set: school dates from a brother's or sister's newsletter may land on the wrong calendars
  const noSchool = kidsList().filter(k => !k.school);
  if (noSchool.length) out.push({ key: "noschool", text: `🏫 Add ${noSchool.map(k => k.name).join(", ")}'s school`,
    html: `<div class="card"><p class="hint">${safe(noSchool.map(k => k.name).join(" and "))} ${noSchool.length === 1 ? "has" : "have"} no school set yet. Add it, so school dates from a newsletter go on the right kids' calendars.</p>
      <div class="btnrow"><button class="primary" data-schoolset="${safe(noSchool[0].id)}">🏫 Add ${safe(noSchool[0].name)}'s school</button></div></div>` });
  const nl = newsletterDue();
  if (nl.length) out.push({ key: "nl", text: `📰 Newsletter for ${nl.map(k => k.name).join(", ")}`, html: newsletterNudgeHtml() });
  return out;
}
// ✕ v212 (Broo2a): a "Needs you" line can be closed (this device only). It comes back when its text changes (something new).
const NEEDS_HIDE_KEY = SAVE_KEY + ".needsHidden";
function needsHidden() { try { return JSON.parse(localStorage.getItem(NEEDS_HIDE_KEY)) || {}; } catch (e) { return {}; } }
const needsSig = x => x.key + "|" + x.text;
function hideNeed(sig) {
  const h = needsHidden(), old = addDaysYmd(todayYmd(), -30);
  Object.keys(h).forEach(k => { if (h[k] < old) delete h[k]; });   // (old ones are forgotten after a month)
  h[sig] = todayYmd();
  try { localStorage.setItem(NEEDS_HIDE_KEY, JSON.stringify(h)); } catch (e) {}
}
function needsLineHtml() {
  const hid = needsHidden(), list = needsItems().filter(x => !hid[needsSig(x)]);
  if (needsOpen && needsOpen !== "list" && !list.some(x => x.key === needsOpen)) needsOpen = null;
  if (!list.length) return "";
  const one = list.length === 1, open = needsOpen === "list" || (one && needsOpen === list[0].key) || list.some(x => x.key === needsOpen);
  const x1 = x => `<button class="needs-x" data-needsx="${safe(needsSig(x))}" aria-label="Close: ${safe(x.text)}" title="Close">✕</button>`;
  const head = `<div class="needs-row"><button class="needs-line ${open ? "on" : ""}" data-needs="${one ? list[0].key : "list"}" aria-expanded="${open}">
    ${one ? safe(list[0].text) : `🔔 ${list.length} things need you`}<span aria-hidden="true">${open ? "▲" : "›"}</span></button>${one ? x1(list[0]) : ""}</div>`;
  const shown = list.find(x => x.key === needsOpen);
  return `<div class="needs">${head}${needsOpen === "list" && !one ? `<div class="needs-list">${list.map(x => `<div class="needs-row"><button data-needs="${x.key}">${safe(x.text)} ›</button>${x1(x)}</div>`).join("")}</div>` : ""}
    ${shown ? `<div class="needs-panel nd3">${(u => `<b class="nd3-title">Needs you, ${safe(u.name)}!</b><div class="nd3-buddy">${charPic(u, "point") ? `<img src="${charPic(u, "point")}" alt="">` : ""}<p>${safe(shown.text.replace(/^\S+\s/, ""))}</p></div>`)(userById(me))}${shown.html}</div>` : ""}</div>`;
}
// 🎯 The score ring (0–100) in the kid's colour
function scoreRingHtml(n, color, target) {
  // 🎯 Beat yourself: a small circle on the ring at last week's score (gold once passed)
  const C = 2 * Math.PI * 44, t = typeof target === "number" && target > 0 ? Math.min(100, target) : null;
  return `<span class="kc-ring${t != null && n >= t ? " beat" : ""}" role="img" aria-label="Score ${n} this week${t != null ? `, last week ${t}` : ""}" style="--c:${color}"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" class="bu-trk"/>
    <circle cx="50" cy="50" r="44" class="kc-bar" style="stroke-dasharray:${(C * Math.min(n, 100) / 100).toFixed(1)} ${C.toFixed(1)}"/>${t != null
      ? `<circle cx="${(50 + 44 * Math.cos(t / 100 * 2 * Math.PI)).toFixed(1)}" cy="${(50 + 44 * Math.sin(t / 100 * 2 * Math.PI)).toFixed(1)}" r="7" class="kc-goal"/>` : ""}</svg><b>${n}</b></span>`;
}
// 🎯 Beat yourself: last week's final score (kept in points.reach) and the best week ever (before this week)
function lastWeekScore(id) { const r = data.points.reach[`${addDaysYmd(data.points.week, -7)}|${id}`]; return r && typeof r.s === "number" && r.s > 0 ? r.s : null; }
// "Today 3 of 5 done · next Math 4:00" · "All finished ✅" · "Nothing today"
function kidTodayLine(kid) {
  const date = todayYmd(), now = dubaiMinutes(), items = todayItems(kid), done = items.filter(x => isDone(date, x.id, kid)).length;
  if (!items.length) return "Nothing today";
  if (done === items.length) return "All finished ✅";
  const next = items.find(x => !isDone(date, x.id, kid) && x.end > now && x.start >= 0);
  return `Today ${done} of ${items.length} done${next ? ` · next ${next.name} ${clock(next.start)}` : ""}`;
}
// 💬 v187 A short kind line per kid (parent's kid cards + the kid's own home), from the real numbers, never mean:
//   1st: how close the next one is · close behind (≤ 5): "Only 3 behind Taha" · far behind: never the rank, only what wins
//   points back (missed must-dos, today's ▲, the next thing to tick). Different words each day.
function kidCheerShort(id) {
  const fair = fairScores(), order = fairOrder(fair), rank = order.findIndex(u => u.id === id), mine = fair[id] || 0;
  const pick = list => list[(Number(todayYmd().slice(-2)) + id.length) % list.length];
  if (starDecided()) return stars().includes(id) ? "🌟 Shining Star this week! Amazing work." : "🌱 A new week starts soon: a fresh chance for everyone!";
  if (order.length < 2 || !mine) return "🌱 Every tick lifts your score. Let's go!";
  if (rank === 0) {
    const gap = mine - (fair[order[1].id] || 0);
    if (!gap) return `🔥 Tied for first with ${order[1].name}! The next tick decides.`;
    return gap <= 3 ? pick([`🔥 In the lead, but ${order[1].name} is only ${gap} behind. Keep going!`, `🔥 First place! ${order[1].name} is close (${gap}), don't stop now.`])
      : pick([`🔥 In the lead by ${gap}! Keep it up till Friday ⭐`, `🔥 First place by ${gap}. Great week, keep the habit!`]);
  }
  const above = order[rank - 1], gap = fair[above.id] - mine;
  if (!gap) return `💪 Tied with ${above.name}! One more tick puts you ahead.`;
  if (gap <= 5) return pick([`💪 Only ${gap} behind ${above.name}. One good worksheet can do it!`, `💪 So close: ${gap} to catch ${above.name}. You can do it!`]);
  const sc = scoreOf(id), lost = sc.base - sc.overall, d = todayTrend(id);
  if (lost >= 3) return `⭐ Missed must-dos cost you ${lost} points. Tick them every day to keep your points!`;
  if (d > 0) return pick([`🌱 ▲ ${d} today. Keep climbing!`, `🌱 Up ${d} today. Every step counts!`]);
  const next = todayItems(id).find(x => !isDone(todayYmd(), x.id, id));
  return next ? pick([`▶ Next: ${next.name}. Every tick lifts your score!`, `🌱 Tick ${next.name} today and watch your score grow.`]) : "🌱 A good worksheet today can lift your score a lot!";
}
// 🌟 Star = last week's Shining Star (until the next announcement) · 🔥 Leading = the best score this week right now
const kidCardTags = id => (stars().includes(id) ? ` <span class="kc-tag kc-star">🌟 Star</span>` : "") +
  (leaders().includes(id) ? ` <span class="kc-tag kc-lead">🔥 Leading</span>` : "");
// ONE CARD PER KID: the score ring, name + today's mood, today's line, 🎒 School · 📅 Calendar · 📊 Report. The card itself → the Kid page
// 🎨 v237 (Broo2a): two kids whose colours look alike (yellow + orange, pink + red …) get clearly different cards on the parent home:
// a kid keeps their own colour unless it is close to a card above; then the first ADROS colour that isn't close to any of them.
const CARD_ORDER = ["blue", "pink", "yellow", "green", "purple", "teal", "orange", "red"];
function kidCardColors() {
  const hue = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
    if (!d) return 0; const x = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (x * 60 + 360) % 360; };
  const near = (a, b) => { const d = Math.abs(hue(a) - hue(b)); return Math.min(d, 360 - d) < 30; };   // (by the strong colour's hue)
  const used = [], out = {};
  kidsList().forEach(k => { const own = colorsOf(k);
    const c = !used.some(u => near(u.color, own.color)) ? own : (CARD_ORDER.map(n => PALETTE[n]).find(p => !used.some(u => near(u.color, p.color))) || own);
    used.push(c); out[k.id] = c; });
  return out;
}
// 🌈 v238 PARENT HOME (Broo2a's own design, 28 Nov): hero card · one row per kid with the STANDING character · This week chart · Needs you list.
// ✨ little sparkles on the cards (Broo2a: "don't forget sparkles").
const SPARKLES = `<span class="sp5" aria-hidden="true"><i></i><i></i><i></i></span>`;
// 📅 v239 (Broo2a's picture): today as a little desk-calendar page (NOV · 28 · SAT)
function calTileHtml() {
  const dz = o => new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dubai", ...o });
  return `<span class="cal-tile" aria-label="${safe(dz({ weekday: "long", day: "numeric", month: "long" }))}"><b>${dz({ month: "short" }).toUpperCase()}</b><strong>${dz({ day: "numeric" })}</strong><small>${dz({ weekday: "short" }).toUpperCase()}</small></span>`;
}
// 🌈 v239 the ADROS logo, big, at the top of Home
const homeLogoHtml = () => `<div class="home-logo"><img src="icons/logo-adros.webp" alt="ADROS"></div>`;
function homeHeroHtml(u) {
  const pic = charPic(u, "happy") || charPic(u, "wave");   // v239: just the face
  return homeLogoHtml() + `<div class="ph5-hero ph6">${SPARKLES}${pic ? `<img class="ph6-pic" src="${pic}" alt="">` : `<span class="ph6-pic ph6-emo">${safe(u.emoji || "🙂")}</span>`}
    <div class="ph5-r">${calTileHtml()}<h1 class="ph5-hi">Hi <em>${safe(u.name)}</em>!</h1><p class="ph5-sub">${kidsList().length ? "The kids are waiting for you" : "Let's set up your family"}</p>
      <div class="ph5-say">${sayBoxHtml(u)}</div></div></div>`;
}
// One row per kid (Broo2a's design): standing character · name + emoji · today's bar · done / next dots · ⭐ this week · SCORE · 🔥 streak · today's line
function kidRowHtml(k) {
  const c = kidCardColors()[k.id] || colorsOf(k), sc = scoreOf(k.id), date = todayYmd(), now = dubaiMinutes(), items = todayItems(k.id);
  const isD = x => isDone(date, x.id, k.id), done = items.filter(isD), pct = items.length ? Math.round(done.length / items.length * 100) : 0;
  const all = items.length && done.length === items.length, pic = charPic(k, "stand") || charPic(k, all ? "proud" : "happy");
  const next = items.find(x => !isD(x) && x.end > now), last = done[done.length - 1];
  const nm = x => String(x.name).replace(/^\S+\s(?=\S)/u, m => /\p{Extended_Pictographic}/u.test(m) ? "" : m);
  const dots = [last ? `<span class="kr5-dot ok">${safe(nm(last))} done</span>` : "", next ? `<span class="kr5-dot nx">${safe(nm(next))} ${next.start >= 0 && !last ? clock(next.start) : "next"}</span>` : ""].join("");
  const streak = typeof dayStreak === "function" ? dayStreak(k.id) : 0, pts = pointsByUser()[k.id] || 0;
  const L = hasSpark(k.id) ? levelOf(lifetimePoints(k.id)) : 0;
  const line = !items.length ? "Nothing today" : all ? `All ${items.length} done today ✓` : `${done.length} of ${items.length} today${next ? ` · Next: ${nm(next)}${next.start >= 0 ? ` ${clock(next.start)}` : ""}` : ""}`;
  return `<button class="kr5" data-kidpage="${safe(k.id)}" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}" aria-label="${safe(k.name)}: score ${sc.overall}. ${safe(line)}">${SPARKLES}
    <span class="kr5-pic">${pic ? `<img src="${pic}" alt="">` : `<span class="kr5-face">${faceHtml(k)}</span>`}</span>
    <span class="kr5-mid"><span class="kr5-name"><b>${safe(k.name)}</b><span class="kr5-emo">${safe(k.emoji || "")}</span>${stars().includes(k.id) ? `<span class="kr5-star">🌟 Star</span>` : ""}</span>
      <span class="kr5-bar"><i style="width:${pct}%"></i></span>
      <span class="kr5-info">${dots}<span class="kr5-wk">★ +${pts} this week</span></span>
      <span class="kr5-foot">${streak ? `<span class="kr5-chip">🔥 ${streak} ${streak === 1 ? "day" : "days"}</span>` : ""}${L ? `<span class="kr5-chip kr5-spark">✨ Lv ${L}</span>` : ""}<small>${safe(line)}</small></span></span>
    <span class="kr5-sc"><small>Score</small><b>${sc.overall}</b></span></button>`;
}
// 📊 This week (family activity): ticks done by all the kids each day of this points week
function homeWeekHtml() {
  const kids = kidsList(); if (!kids.length) return "";
  const cols = ["#8fb0c8", "#f5bd55", "#7fad9c", "#f78a63", "#b39bd6", "#e9776a", "#d9c3a5"], today = todayYmd();
  const days = weekDates().map(d => ({ d, n: kids.reduce((t, k) => t + planDay(d).items.filter(it => it.people.includes(k.id) && !it.gone && isDone(d, it.actId, k.id)).length, 0) }));
  const max = Math.max(1, ...days.map(x => x.n));
  return `<div class="ph5-card ph5-week">${SPARKLES}<div class="ph5-h"><b>This week</b><small>Family activity</small></div>
    <div class="ph5-bars">${days.map((x, i) => `<span class="ph5-col${x.d === today ? " today" : ""}${x.d > today ? " later" : ""}"><em>${x.n || ""}</em><i style="height:${Math.max(6, Math.round(x.n / max * 100))}%;--b:${cols[i % 7]}"></i><small>${DAYS[weekdayOf(x.d)][0]}</small></span>`).join("")}</div></div>`;
}
// 🔔 Needs you as a list card (a tap opens it, same as before)
function homeNeedsHtml() {
  if (needsOpen) return needsLineHtml();
  const hid = needsHidden(), list = needsItems().filter(x => !hid[needsSig(x)]);
  if (!list.length) return "";
  const needClay = e => ({ ...CLAY_EMOJI, "🏫": "c-school", "📰": "c-news", "📌": "c-day", "🗞️": "c-news", "🧒": "c-starbox", "👦": "c-starbox", "👧": "c-starbox", "📚": "c-book", "🎯": "c-rocket", "💌": "c-gift", "🔥": "c-flame", "🕐": "c-clock", "⏰": "c-clock", "🌙": "c-clock" })[String(e).replace(/\uFE0F$/, "")] || CLAY_EMOJI[e];
  const icoCols = ["#8fb0c8", "#f78a63", "#f5bd55", "#7fad9c", "#b39bd6"];
  return `<div class="ph5-card ph5-needs"><div class="ph5-h"><b>${list.length} ${list.length === 1 ? "thing needs" : "things need"} you</b><small>Today</small></div>
    ${list.map((x, i) => { const m = String(x.text).match(/^(\S+)\s+(.*)$/u), emo = m && /\p{Extended_Pictographic}/u.test(m[1]) ? m[1] : "🔔", txt = m && emo === m[1] ? m[2] : x.text;
      return `<button class="ph5-need" data-needs="${safe(x.key)}">${needClay(emo) ? `<span class="ph5-ni ph5-ni-clay">${ico3d(needClay(emo))}</span>` : `<span class="ph5-ni" style="--b:${icoCols[i % icoCols.length]}">${safe(emo)}</span>`}<b>${safe(txt)}</b><span class="ph5-go" aria-hidden="true">›</span></button>`; }).join("")}</div>`;
}
function kidCardHtml(k) {
  const c = kidCardColors()[k.id] || colorsOf(k), sc = scoreOf(k.id), e = feat("diary") ? diaryOf(k.id, todayYmd()) : null, line = kidTodayLine(k.id);
  const [main, rest] = line.split(" · "), allDone = /^All finished/.test(line);
  const pic = charPic(k, allDone ? "proud" : "point");
  return `<div class="card kid-card kc3" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}">
    <div class="kc-head"><button class="kc-name" data-kidpage="${safe(k.id)}" aria-label="${safe(k.name)}: all about ${safe(k.name)}">${faceHtml(k)}<b>${safe(k.name)}</b>${e && moodFace(e.mood) ? `<span class="kc-mood" title="Today's mood">${moodFace(e.mood)}</span>` : ""}${kidCardTags(k.id)}</button>
      <button class="kc-pts" data-sdpop="${safe(k.id)}" aria-label="${safe(k.name)}'s score this week: ${sc.overall}"><b>${sc.overall}</b><small>score</small></button></div>
    <div class="kc-mid">${pic ? `<img class="kc-big" src="${pic}" alt="">` : `<span class="kc-big kc-bigface">${faceHtml(k)}</span>`}
      <div class="kc-bub"><button class="kc-bubtxt" data-kidpage="${safe(k.id)}"><b>${safe(main)}</b><small>${safe(rest ? `Next: ${rest.replace(/^next /, "")}` : kidCheerShort(k.id))}</small></button>${sayLineHtml(k)}</div></div>
    <div class="kc-btns"><button data-school="${safe(k.id)}">School</button><button data-viewcal="${safe(k.id)}">Calendar</button><button data-kidreport="${safe(k.id)}">Report</button></div></div>`;
}
// ---------- 💬 v233 SPEECH LINES (Broo2a): everyone writes a short line next to their name; the family sees it on the home screen.
// You change your own · a parent can delete a kid's line (not nice). Stored as u.say {t, at, by}; the newer one wins when phones meet. ----------
let sayEditing = null;   // whose line is being typed now (a person id)
const sayOf = id => { const u = userById(id); return u && u.say && u.say.t ? u.say.t : ""; };
const canClearSay = id => id === me || (isParentId(me) && isParentDevice());
function setSay(id, text) {
  const u = userById(id); if (!u) return;
  u.say = { t: String(text || "").replace(/\s+/g, " ").trim().slice(0, SAY_MAX), at: new Date().toISOString(), by: me || "" };
  keepNow();
}
// a kid's line on a card (look only; a parent gets ✕ to delete it)
const sayLineHtml = u => sayOf(u.id) ? `<span class="say-line">“${safe(sayOf(u.id))}”${canClearSay(u.id) ? `<button class="say-x" data-sayclear="${safe(u.id)}" aria-label="Delete ${safe(u.name)}'s line" title="Delete">✕</button>` : ""}</span>` : "";
// MY line, in the hello: a dashed box with ✏️ (tap → type it)
function sayBoxHtml(u) {
  if (sayEditing === u.id) return `<div class="say-box editing"><input id="sayInput" maxlength="${SAY_MAX}" value="${safe(sayOf(u.id))}" placeholder="Say something to your family…" aria-label="Your line">
    <button class="say-ok" data-saysave="${safe(u.id)}" aria-label="Save">✓</button>${sayOf(u.id) ? `<button class="say-x" data-sayclear="${safe(u.id)}" aria-label="Delete my line">✕</button>` : ""}</div>`;
  const t = sayOf(u.id);
  return `<button class="say-box ${t ? "" : "empty"}" data-sayedit="${safe(u.id)}"><span>${t ? safe(t) : "Say something to your family…"}</span><i aria-hidden="true">✏️</i></button>`;
}
// 🧒 a kid's home: what everyone else in the family says
function familySaysHtml(meId) {
  const list = data.users.filter(u => u.id !== meId && sayOf(u.id));
  if (!list.length) return "";
  return `<div class="card fam-says"><h3>💬 What my family says</h3>${list.map(u => `<div class="fs-row" style="--c:${colorsOf(u).color};--soft:${colorsOf(u).soft}">
      ${charPic(u) ? `<img class="fs-pic" src="${charPic(u, "wave")}" alt="">` : `<span class="fs-pic">${faceHtml(u)}</span>`}<div class="fs-bub"><b>${safe(u.name)}</b>${sayLineHtml(u)}</div></div>`).join("")}</div>`;
}
document.addEventListener("click", e => {
  const ed = e.target.closest && e.target.closest("[data-sayedit]"), sv = e.target.closest && e.target.closest("[data-saysave]"), cl = e.target.closest && e.target.closest("[data-sayclear]");
  if (ed && ed.dataset.sayedit === me) { sayEditing = me; render(); const i = $("sayInput"); if (i) { i.focus(); i.select(); } return; }
  if (sv && sv.dataset.saysave === me) { const i = $("sayInput"); sayEditing = null; setSay(me, i ? i.value : ""); toast("💬 Your family can see it now", 2000); return; }
  if (cl && canClearSay(cl.dataset.sayclear)) { e.stopPropagation(); sayEditing = null; setSay(cl.dataset.sayclear, ""); }
});
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "sayInput") { e.preventDefault(); sayEditing = null; setSay(me, e.target.value); }
  if (e.key === "Escape" && e.target && e.target.id === "sayInput") { sayEditing = null; render(); } });
// v155: the parent's home ends with ONE clear list in 4 groups (no hidden menus): Plan the week · The kids · Family · Settings.
//   Each row = a title + one short line + ›. No pictures (Broo2a: simpler and more professional).
const hubAttr = t => t.attr ? t.attr : t.plan ? "data-plan" : t.extra ? `data-extra="${t.extra}"` : t.tour ? "data-tour"
  : t.privacy ? "data-privacy" : t.profile ? "data-profile" : `data-go="${t.go}"`;
// (🗂️ v213 Broo2a: a line with its own options = small buttons under its name)
const hubRowHtml = t => t.opts ? `<div class="hub-row hub-opts"><span class="hub-t"><b>${t.label}${t.badge ? ` <i class="hub-new">${t.badge}</i>` : ""}</b><small>${t.sub}</small></span>
  <span class="hub-chips">${t.opts.map(([attr, l]) => `<button type="button" class="pill small" ${attr}>${l}</button>`).join("")}</span></div>` : `<button class="hub-row${t.cls ? " " + t.cls : ""}" ${hubAttr(t)}><span class="hub-t"><b>${t.label}${t.badge ? ` <i class="hub-new">${t.badge}</i>` : ""}</b>
  <small>${t.sub}</small></span><span class="hub-go" aria-hidden="true">›</span></button>`;
function familyRowHtml() {
  const n = feat("meeting") ? cmNewCount() : 0, dad = isParentId(me);
  const groups = [
    ["Plan the week", [{ label: "📅 Family calendar", sub: "Everyone's week in one place", cls: "hub-main", opts: [["data-calall", "👀 Show"], ...(hasPlan() ? [["data-printfamily", "🖨️ Print"]] : [])] },
      ...(dad ? [{ attr: "data-calsetopen", label: "⚙️ Calendar settings", sub: safe(calSetupSummary()) }] : []),
      // 🔍 v180: the sessions the plan couldn't fit, with fixes to tap
      ...(dad && hasPlan() ? (m => [{ attr: "data-missed", label: "Missed sessions", sub: m ? "Didn't fit this week: see how to fit them" : "Everything fit this week 🎉", badge: m ? `${m} missing` : "" }])(missedSessions().reduce((n, x) => n + x.missing, 0)) : []),
      { label: "➕ Add activities", sub: "School, clubs, work, sports", opts: [['data-addopen="fx"', "📌 Fixed"], ['data-addopen="fl"', "🔄 Flexible"],
        ...(dad ? [['data-addopen="rt"', "🧺 Routines"], ['data-addopen="ty"', "🏷️ Types"]] : [])] },
      ...(dad ? [{ plan: true, label: "Plan my week", sub: "Fit all the activities together" }] : []),
      { attr: "data-onedaynew", label: "One-day event", sub: "Something on one date only" }]],   // (🔄 Make a new plan: on top of the calendar)
    ["The kids", [...(dad ? [{ attr: "data-schoolset", label: "🏫 School settings", sub: "School, curriculum, year, worksheets a day" }] : []), { attr: "data-report", label: "How are my kids doing?", sub: "Scores, study and habits" },
      { attr: 'data-go="kidswork"', label: "Kids' work today", sub: "Live, as they do it" },
      { attr: 'data-go="points"', label: "Points and leaderboard", sub: "This week's scores" },
      { attr: 'data-fsweek="this"', label: "Family summary: this week", sub: "A PDF to read or print" },
      { attr: 'data-fsweek="last"', label: "Family summary: last week", sub: "A PDF to read or print" }]],
    ["Family", [...(dad ? [{ go: "family", label: "👨‍👩‍👧 Family members", sub: "Add a kid or a parent · names · sign-in codes" }] : []),
      { profile: true, label: "👥 Family profiles", sub: "Everyone's picture, birthday, Spark and week" }, ...(feat("meeting") ? [{ extra: "meeting", label: "Our Community", sub: "Family notes and requests", badge: n ? `${n} new` : "" }] : []),
      ...(feat("chores") ? [{ extra: "chores", label: "Home duties", sub: "Jobs at home" }] : []),
      ...(feat("diary") ? [{ attr: 'data-dyopen=""', label: "My day", sub: "How do you feel today?" }] : [])]],
    // (👤 v213 Broo2a: My profile is in Family → 👥 Family profiles now)
    ["Settings", [...(dad ? [{ attr: "data-backup", label: "Backup", sub: "Keep a safe copy of the family's data" }] : []),
      { attr: "data-setupopen", label: "Edit my home", sub: "Turn features on or off" },
      { ...PRIVACY_TILE, sub: "Who can see your data" }, { ...TOUR_TILE, sub: "How the app works" },
      { attr: "data-askus", label: "💬 Ask us", sub: "A question or an idea? Send us an email" },
      { attr: "data-signout", label: "🚪 Sign out", sub: "Leave the app on this device" }]]];
  // v159 (Broo2a): each group = ONE big button; tap it and its rows open under it (only one open at a time)
  const look = { "Plan the week": [ico3d("calendar"), "sage", "Calendar, activities, plan"], "The kids": [ico3d("excellent"), "peach", "Reports, scores, work today"],
    "Family": [ico3d("heart"), "butter", "Members, community, home duties"], "Settings": [ico3d("paper"), "dusty", "Backup, privacy, help, sign out"] };
  return `<div class="hub-groups">` + groups.filter(g => g[1].length).map(([title, rows]) => {
    const [icon, tone, sub] = look[title] || ["•", "sage", ""], badge = rows.some(r => r.badge);
    return `<details class="hub-group hub-${tone}" name="hubg" data-hubg="${title}"${hubOpen === title ? " open" : ""}>
    <summary class="hub-big"><span class="hub-ic" aria-hidden="true">${icon}</span><span class="hub-t"><b>${title}${badge ? ` <i class="hub-new">new</i>` : ""}</b><small>${sub}</small></span><span class="hub-go" aria-hidden="true">›</span></summary>
    <div class="hub-list">${rows.map(hubRowHtml).join("")}</div></details>`; }).join("") + `</div>`;
}
// ⚙️ v213 Calendar settings on the home: its answers in one line, and the setup box in a pop-up
function calSetupSummary() {
  const work = DAYS.findIndex((_, i) => !weekendDaysOf().includes(i)), st = dayWindow(work < 0 ? 0 : work)[0];   // (a school day's start)
  const sc = data.fixed.find(f => isSchoolName(f.name) && !f.id.endsWith("-short")), bed = data.bedAll;
  return `Week starts ${SHORT[calWeekStartOf()]} · Day ${clock(st, true)}${bed ? `–${clock(toMin(bed.wd), true)}` : ""}${sc ? ` · School ${clock(toMin(sc.start), true)}–${clock(toMin(sc.end), true)}` : ""}`;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-calsetopen], [data-addopen]"); if (!b || !isParentId(me)) return;
  if ("calsetopen" in b.dataset) {
    bedDraft = null;
    qePop("⚙️ Calendar settings", "", [["Close", null]]);
    const card = document.querySelector(".qe-pop .qe-popcard"); card.classList.add("cal-popcard");
    card.querySelector(".qe-popbtns").insertAdjacentHTML("beforebegin", calBoxHtml());
    return;
  }
  const k = b.dataset.addopen;
  go("add"); addOpen = { fx: false, fl: false, rt: false, ty: false, [k]: true }; addWho = null; drawAddSections();
  const btn = $({ fx: "secFxBtn", fl: "secFlBtn", rt: "secRtBtn", ty: "secTyBtn" }[k]); if (btn) setTimeout(() => btn.scrollIntoView({ block: "start" }), 50);
});
// 💬 v213 Ask us: an email to the app's support address (the phone's email app opens)
document.addEventListener("click", e => {
  if (!(e.target.closest && e.target.closest("[data-askus]"))) return;
  location.href = `mailto:${CONTACT}?subject=${encodeURIComponent(`${APP_NAME}: a question`)}`;
});
let hubOpen = "";   // which big button is open (kept when the home redraws)
document.addEventListener("toggle", e => { const d = e.target; if (d && d.dataset && d.dataset.hubg) { if (d.open) hubOpen = d.dataset.hubg; else if (hubOpen === d.dataset.hubg) hubOpen = ""; } }, true);
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-needsx], [data-needs], [data-homeaddplan], [data-kidpage], [data-kidreport]");
  if (!b) return;
  const ds = b.dataset;
  if (ds.needsx) { hideNeed(ds.needsx); if (needsOpen !== "list") needsOpen = null; toast("✕ Closed. It comes back if something new happens.", 2500); return render(); }
  if (ds.needs) { needsOpen = needsOpen === ds.needs || (ds.needs === "list" && needsOpen) ? null : ds.needs; return render(); }
  if ("homeaddplan" in ds) { homeAddPlan = !homeAddPlan; homeMore = false; return render(); }
  if (ds.kidpage) return openKidPage(ds.kidpage);
  if (ds.kidreport) { rpKid = ds.kidreport; return openReport(); }
});

// =====================================================================
//  👧 THE KID PAGE (a parent's device): everything about one kid — this week's score (📚 Study · ⚽ Activity · 🌱 Habit), today's list
//  (parents tick; earlier days of this week on 📅 Calendar), 👀 their work today (live), ⭐ habits, ✅ duties, 💌 wishes, 🌟 prize,
//  📔 moods and the 📊 report. ⬅️ Back → home.
// =====================================================================
let kidPage = null;
function openKidPage(id) {
  if (!isParentDevice() || !exists(id) || isParentId(id)) return;
  kidPage = id; kidSec = null; homeMore = homeAddPlan = false;
  go("kid");
}
// Today's list for one kid, with ✅ ticks (a parent ticks for the kid; ⏰ not before the start)
function kidTodayHtml(k) {
  const d = todayYmd(), all = todayItems(k.id), c = colorsOf(k);
  return `<div class="card td-card" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}"><div class="sc-head"><h2>📋 Today</h2>
    <span class="td-count">${all.filter(x => isDone(d, x.id, k.id)).length} / ${all.length} ✓</span></div>
    ${all.length ? all.map(x => { const on = isDone(d, x.id, k.id), lock = !on && tickTimeLock(d, x.start) != null;
      return `<div class="td-row ${on ? "done" : ""}"><button class="k-check td-check ${on ? "on" : ""} ${lock ? "time-lock" : ""}" data-check="${d}|${safe(x.id)}|${safe(k.id)}" style="--c:${c.color}"
        aria-pressed="${on}" aria-label="${safe(`${on ? "Done" : lock ? `Locked until ${clock(x.start, true)}` : "Tap when done"}: ${x.name}`)}">${on ? "✓" : lock ? "🔒" : ""}</button>
        <span class="td-what"><b>${safe(x.name)}</b><small>${x.start >= 0 ? `${clock(x.start)} – ${clock(x.end)}` : "All day"}</small></span></div>`; }).join("")
      : `<p class="sc-empty">Nothing today. 🎈</p>`}
    <div class="td-more"><button class="linkbtn" data-viewcal="${safe(k.id)}">📅 The week (tick earlier days) ›</button></div></div>`;
}
// 👧 The kid page is a MENU of big buttons (each with a one-line status); a tap opens ONLY that part (kidSec).
//    ⬅️ Back (or "All about …") → the menu again. Sections: today · habits · star · score · study · points (💪 strong / 🎯 weak per subject)
//    · tasks · school · work · moods (📔 moods, ✅ duties, 💌 wishes) · report (the full 📊 report, as before).
// 📈 The score through one day (v187: small and clean). Kid page 🏆 Score, 👤 profile, 📊 report, 🏆 leaderboard button,
// and a pop-up from every score (the ring on the parent's kid cards, the kid page ring, the kid's 🏆 Score tile).
// Day chips (this week, up to today) · a thin step line with a soft fill · "What changed" folded under it.
let scoreDay = null, sdOpen = null, sdPop = null;   // (🏆 leaderboard: whose graph is open · the pop-up: whose)
function dayGraphHtml(k, color, pop) {
  const today = todayYmd(), days = weekDates().filter(d => d <= today), yest = addDaysYmd(today, -1);
  const day = days.includes(scoreDay) ? scoreDay : pop ? today : days.includes(yest) ? yest : today;
  const pts = dayScorePoints(k.id, day), t0 = fromYmd(day).getTime(), DAY = 864e5, vals = pts.map(p => p.score);
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 3) / 5) * 5), hi = Math.min(100, Math.ceil((Math.max(...vals) + 3) / 5) * 5);
  const W = 320, H = 96, L = 24, R = 6, T = 6, B = 16, gid = "sdg-" + k.id.replace(/\W/g, "");
  const x = at => L + (W - L - R) * Math.min(1, Math.max(0, (at - t0) / DAY)), y = v => T + (H - T - B) * (1 - (v - lo) / Math.max(1, hi - lo));
  let line = `M${x(pts[0].at).toFixed(1)},${y(pts[0].score).toFixed(1)}`;
  pts.slice(1).forEach(p => { line += ` H${x(p.at).toFixed(1)} V${y(p.score).toFixed(1)}`; });
  const lastX = x(pts[pts.length - 1].at), area = `${line} H${lastX.toFixed(1)} V${H - B} H${x(pts[0].at).toFixed(1)} Z`;
  const hourTxt = h => h === 0 || h === 24 ? "12a" : h === 12 ? "12p" : h < 12 ? h + "a" : (h - 12) + "p";
  const svg = `<svg class="sd-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${safe(k.name)}'s score on ${safe(dayLong(day))}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${[lo, hi].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="sd-grid"/><text x="${L - 4}" y="${y(v) + 3}" text-anchor="end" class="sd-lab">${v}</text>`).join("")}
    ${[0, 6, 12, 18, 24].map(h => `<text x="${x(t0 + h * 36e5)}" y="${H - 3}" text-anchor="${h === 0 ? "start" : h === 24 ? "end" : "middle"}" class="sd-lab">${hourTxt(h)}</text>`).join("")}
    <path d="${area}" fill="url(#${gid})"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => i && p.score !== pts[i - 1].score ? `<circle cx="${x(p.at)}" cy="${y(p.score)}" r="2.6" fill="#fff" stroke="${color}" stroke-width="1.6"/>` : "").join("")}</svg>`;
  const time = p => p.kind === "start" || p.kind === "midnight" ? "12:00 AM" : p.kind === "habits" ? "Day's end" : new Date(p.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const moves = pts.map((p, i) => ({ ...p, ch: i ? p.score - pts[i - 1].score : 0 })).filter(p => p.ch);
  const first = vals[0], last = vals[vals.length - 1], d = last - first;
  return `<div class="${pop ? "sd-pop" : "card"} sd-card" style="--c:${color}">
    <div class="sd-head"><b>Score through the day</b>${trendChipHtml(d)}</div>
    <div class="sd-days" role="tablist">${days.map(dd => `<button class="sd-day${dd === day ? " on" : ""}" data-sdday="${dd}">${dd === today ? "Today" : dd === yest ? "Yesterday" : DAYS[weekdayOf(dd)].slice(0, 3)}</button>`).join("")}</div>
    <p class="sd-sum">${safe(dayLong(day))} · <b>${first}</b> → <b>${last}</b></p>${svg}
    ${pop && moves.length ? sdWhyHtml(moves, time) : moves.length ? `<details class="sd-more"><summary>What changed (${moves.length})</summary><ul class="sd-list">${moves.map(p =>
      `<li><span class="sd-t">${time(p)}</span><span class="sd-w">${safe(p.text)}</span>${trendChipHtml(p.ch)}</li>`).join("")}</ul>
      <p class="sd-note">The score is for the whole week. Habit ticks have no time, so they show at the day's end.</p></details>` : `<p class="sd-note">No change on this day.</p>`}</div>`;
}
// 💬 v191 the pop-up (tap a score): WHY it went up and WHY it went down that day, open, in two lists
function sdWhyHtml(moves, time) {
  const list = (arr, cls, head) => arr.length ? `<div class="sd-why ${cls}"><b>${head}</b><ul class="sd-list">${arr.map(p =>
    `<li><span class="sd-t">${time(p)}</span><span class="sd-w">${safe(p.text)}</span>${trendChipHtml(p.ch)}</li>`).join("")}</ul></div>` : "";
  const up = moves.filter(p => p.ch > 0), down = moves.filter(p => p.ch < 0);
  return list(up, "up", "▲ Why it went up") + list(down, "down", "▼ Why it went down") +
    `<p class="sd-note">The score is for the whole week. Habit ticks have no time, so they show at the day's end.</p>`;
}
// ▲ 3 / ▼ 2 / – : a small change sign (green up, red down, grey none)
const trendChipHtml = d => `<span class="sd-chip ${d > 0 ? "up" : d < 0 ? "down" : "flat"}">${d > 0 ? "▲ " + d : d < 0 ? "▼ " + -d : "–"}</span>`;
// (on a ring / tile: only when it moved today)
const ringTrendHtml = id => { const d = todayTrend(id); return d ? trendChipHtml(d) : ""; };
// Today's change for a kid: the score now − at 12 AM today (the same as Today's graph)
function todayTrend(id) {
  try { return scoreOf(id).overall - scoreAt(id, todayYmd(), fromYmd(todayYmd()).getTime()); } catch (e) { return 0; }
}
// The pop-up: from any score ring / tile with data-sdpop="<kid id>"
function openScorePop(id) {
  if (!exists(id) || isParentId(id)) return;
  sdPop = id; scoreDay = null; drawScorePop();
  $("sdModal").hidden = false;
}
function drawScorePop() {
  const k = userById(sdPop), sc = scoreOf(k.id);
  $("sdBody").innerHTML = `<div class="sd-pophead">${scoreRingHtml(sc.overall, colorsOf(k).color, lastWeekScore(k.id))}<div><b>${safe(k.name)}</b><small>Score this week · ${sc.overall} of ${sc.max}</small></div></div>
    ${dayGraphHtml(k, colorsOf(k).color, true)}<div class="btnrow"><button class="pill" data-sdclose data-go="points">🏆 Leaderboard</button><button class="primary" data-sdclose>OK</button></div>`;
}
document.addEventListener("click", e => {
  const pop = e.target.closest && e.target.closest("[data-sdpop]");
  if (pop) { e.preventDefault(); e.stopImmediatePropagation(); return openScorePop(pop.dataset.sdpop); }
  if (e.target.closest && e.target.closest("[data-sdclose]")) { $("sdModal").hidden = true; sdPop = null; if (!e.target.closest("[data-go]")) e.stopImmediatePropagation(); return; }
  if (e.target.id === "sdModal") { $("sdModal").hidden = true; sdPop = null; return; }
  const b = e.target.closest && e.target.closest("[data-sdday], [data-sdopen]");
  if (!b) return;
  e.stopImmediatePropagation();
  if ("sdopen" in b.dataset) sdOpen = sdOpen === b.dataset.sdopen ? null : b.dataset.sdopen; else scoreDay = b.dataset.sdday;
  if (b.closest("#sdModal")) return drawScorePop();
  const y = window.scrollY; render(); window.scrollTo(0, y);
}, true);
let kidSec = null;
const starAnnounceText = () => { const t = starTime(); return `every ${DAYS[t.day]} at ${clock(toMin(t.time), true)}`; };
// ⭐ Today's habits: done / all (prayers and water: done only when all parts are done)
function kidHabitsToday(id) {
  const list = habitsFor(id), d = todayYmd();
  return { all: list.length, done: list.filter(h => habitDone(h, data.habitMarks[habitKey(d, h.id, id)])).length };
}
// 🌟 Where the kid stands this week: Star (last week's winner) · 🔥 Leading · "2nd of 3"
function kidStarLine(id) {
  const fair = fairScores(), order = fairOrder(fair).filter(u => fair[u.id] > 0), pos = order.findIndex(u => u.id === id) + 1, nth = n => n + (["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10] || "th");
  return [stars().includes(id) ? "🌟 Last week's Shining Star" : "", leaders().includes(id) ? "🔥 Leading this week" : pos ? `${nth(pos)} of ${order.length} this week` : ""].filter(Boolean).join(" · ");
}
// 🎯 One subject in a few words: 💪 good at · 😕 weak at · 🎯 practise (from the checked worksheets and the 🧠 learning profile)
function kidSubjectSummary(kid, f) {
  const L = learnRead(kid, f.name), rows = L ? learnTopicRows(kid, f) : [], all = checkedOf(kid, f.name), last = all[0];
  const uniq = list => [...new Set(list.filter(Boolean))].slice(0, 3);
  const good = uniq([...rows.filter(r => r.pct >= 85).sort((a, b) => b.pct - a.pct).map(r => r.title), ...(L ? strongSkills(L).map(x => x.skill) : []),
    ...(last ? last.check.strong_points || [] : [])]);
  const weak = uniq([...rows.filter(r => r.pct < 60).sort((a, b) => a.pct - b.pct).map(r => r.title), ...(last ? last.check.weak_points || [] : [])]);
  const practise = uniq([...rows.filter(r => r.st === "needs" || r.pct < 70).flatMap(r => r.weak.length ? r.weak : [r.title]), ...(L ? weakSkills(L).map(x => x.skill) : [])]);
  return { f, avg: avgPct(all), count: all.length, level: L ? L.level : 0, good, weak, practise, has: !!(all.length || rows.length) };
}
// Good at · Weak at · Practise: a small coloured word (no pictures), then the list
const sumLinesHtml = x => [["sum-good", "Good at", x.good], ["sum-weak", "Weak at", x.weak], ["sum-prac", "Practise", x.practise]]
  .filter(r => r[2].length).map(([c, label, xs]) => `<p class="sum-line"><span class="sum-tag ${c}">${label}</span>${safe(xs.join(", "))}</p>`).join("");
function kidSubjectsHtml(kid) {
  const s = schoolOf(kid), list = subjectList(s).map(f => kidSubjectSummary(kid, f));
  if (!list.length) return `<div class="card"><p class="sc-empty">No subjects yet. Add them in 🎒 School.</p></div>`;
  return list.map(x => `<div class="card ks-card"><div class="ks-head"><h2>${safe(x.f.name)}</h2>
      <span class="ks-avg">${x.avg != null ? `${x.avg}%` : "–"}<small>${x.count} ${x.count === 1 ? "worksheet" : "worksheets"}${x.level ? ` · Level ${x.level}/10` : ""}</small></span></div>
      ${x.has ? sumLinesHtml(x)
        + (!x.good.length && !x.weak.length && !x.practise.length ? `<p class="sc-empty">Not enough checked work yet to tell.</p>` : "")
        : `<p class="sc-empty">No checked worksheets in this subject yet.</p>`}
      ${(schoolOf(kid).learn || {})[x.f.id] ? `<details class="ks-more"><summary>All the details</summary>${learnCardHtml(kid, x.f)}</details>` : ""}</div>`).join("");
}
// The part that's open (kidSec), with its big title
function kidSectionHtml(k, sec) {
  const c = colorsOf(k), sc = scoreOf(k.id), items = kidsWorkItems(), mine = items.filter(x => x.kid === k.id), want = wantItem(k.id), st = weekStats(k.id);
  const keep = rpRange; rpRange = "week";
  const x = reportData(k.id, reportRange()), lines = reportLines(x, reportRange(), k.name);
  rpRange = keep;
  const big = (n, label) => `<div class="rp-num"><b>${n}</b><small>${label}</small></div>`;
  const S = {
    today: () => kidTodayHtml(k),
    habits: () => (habitsCardHtml(k.id) || `<div class="card"><p class="sc-empty">No habits are on for ${safe(k.name)}.</p></div>`) + `<div class="btnrow"><button class="pill" data-kidhabits>✏️ Edit the kids' habits</button></div>`,
    star: () => `<div class="card"><h2>🌟 Shining Star this week</h2><p class="ks-big">${safe(kidStarLine(k.id) || "No scores yet this week")}</p>
        <p class="hint">The star is chosen ${safe(starAnnounceText())}: the best score wins.</p>
        ${stars().includes(k.id) ? `<p>${want && want.text ? `🎁 Gift: <b>${safe(want.text)}</b>${want.ok ? " ✅" : ""}` : "🎁 No gift picked yet."}</p>` : ""}
        <div class="btnrow"><button class="pill" data-go="points">🏆 Points and leaderboard</button></div></div>`,
    score: () => `<div class="card"><h2>🏆 Score this week</h2>${scoreBlockHtml(sc)}${sc.free && sc.free.count ? `<p class="kid-free">${freeLine(sc.free)}</p>` : ""}</div>${dayGraphHtml(k, c.color)}`,
    study: () => `<div class="card rp-card"><h2>📚 Study per subject</h2><p class="rp-free">📚 Sessions: ${sc.sp ? sc.sp.study + "%" : "–"} · 📝 Worksheet marks: ${sc.wsCount ? sc.marks + "%" : "–"} · 🏫 School marks: ${typedMarksText(x.typed)}${
        sc.free.count ? ` <small>(${sc.free.count} ${sc.free.count === 1 ? "worksheet" : "worksheets"}, ${sc.free.points} points)</small>` : ""}</p>${studyTableHtml(k.id, null)}</div>
      <div class="card rp-card"><h2>🎒 Topics</h2>${topicsSummaryHtml(k.id)}</div>`,
    points: () => `<p class="hint ks-intro">Each subject in a few words, from ${safe(k.name)}'s checked worksheets.</p>${kidSubjectsHtml(k.id)}`,
    tasks: () => `<div class="card rp-card"><h2>✅ Tasks this week</h2><div class="rp-nums">${x.tasksPct != null ? big(x.tasksPct + "%", `of planned activities done (${x.done} of ${x.planned})`) : big("–", "no planned activities this week")}</div>
        <div class="btnrow"><button class="pill" data-viewcal="${safe(k.id)}">📅 The week</button></div></div>${dutyRowsCardHtml([k], `✅ Did ${safe(k.name)} do the duties on time today?`)}`,
    school: () => `<div class="card rp-card"><h2>🎒 School this week</h2><div class="rp-nums">${big(x.files, "files uploaded")}${big(x.sheets, "worksheets done")}${big(x.avg != null ? x.avg + "%" : "–", "worksheets average")}${big(x.typed.length ? avgOf(x.typed) + "%" : "–", `school marks${x.typed.length ? ` (${x.typed.length})` : ""}`)}</div>
        <div class="btnrow"><button class="primary" data-school="${safe(k.id)}">🎒 Open ${safe(k.name)}'s School</button></div></div>`,
    work: () => `${kwCardHtml(k, items).replace("data-kwdetail", "data-kwsame").replace("<small>Details ›</small>", "")}
      <div class="card"><h2>📋 Everything ${safe(k.name)} did today (${mine.length})</h2>
      ${mine.length ? `<ul class="kw-list">${mine.map(x => { const inner = `<span class="kw-time">${x.cat === "school" || x.cat === "act" ? kwTime(x.at) : ""}</span><span class="kw-what">${safe(x.text)}</span>`;
        return `<li>${x.open ? `<button class="kw-item" data-kwopen="${safe(x.kid)}|${safe(x.open)}">${inner}</button>` : `<div class="kw-item">${inner}</div>`}</li>`; }).join("")}</ul>` : `<p class="sc-empty">No work yet today 🙂</p>`}</div>`,
    moods: () => `${feat("diary") ? `<div class="card"><h2>📔 Moods this week</h2><div class="me-moods">${st.moods.map(x => `<span><b>${x.face || "·"}</b><small>${x.day}</small></span>`).join("")}</div>
      <div class="btnrow"><button class="pill" data-dyopen="${safe(k.id)}">📔 ${safe(k.name)}'s day</button></div></div>` : ""}${wishesListHtml(k.id)}`,
    tools: () => worksheetToolsHtml(k),
    report: () => `${lines.best || lines.help ? `<div class="card rp-card rp-lines">${lines.best ? `<p>🌟 <b>Best this week:</b> ${safe(lines.best)}</p>` : ""}${lines.help ? `<p>👀 <b>Needs help:</b> ${safe(lines.help)}</p>` : ""}</div>` : ""}
      <div class="btnrow"><button class="primary" data-kidreport="${safe(k.id)}">📊 Open the full report (PDF, this month)</button></div>`
  };
  const t = KID_SECS.find(s => s.id === sec);
  return `<div class="ks-top" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}"><button class="pill" data-kidsec="">⬅️ All about ${safe(k.name)}</button>
    <h1 class="ks-title">${safe(k.name)}'s ${t.label.toLowerCase()}</h1></div>${S[sec]()}`;
}
// 🛠️ v180 Worksheet tools (parents, on the Kid page): one 🎯 worksheet button per subject (the app picks the weak topics),
//    a small 🧪 placement test, and 📅 See week topics (this week's newsletter topics and when the week review comes)
let wtWeek = false;
function worksheetToolsHtml(k) {
  const s = schoolOf(k.id), subs = subjectList(s), c = colorsOf(k);
  const rows = subs.map(f0 => { const f = { id: f0.id, ...f0 }, n = weakTopicsOf(k.id, f).length;
    return `<li class="wt-row"><button class="primary wt-main" data-weakws="${safe(k.id)}|${safe(f.id)}" data-aiwait="weakws|${safe(k.id)}|${safe(f.id)}">🎯 ${safe(f.name)}
        <small>Weak points worksheet${n ? ` · ${n} ${n === 1 ? "topic" : "topics"}` : ""}</small></button>
      <button class="wt-side" data-placews="${safe(k.id)}|${safe(f.id)}" data-aiwait="placement|${safe(k.id)}|${safe(f.id)}" aria-label="${safe(f.name)} placement test">🧪 Test</button></li>`; }).join("");
  const wk = s.week, due = (s.reviewDue || [])[0];
  const week = !wtWeek ? "" : wk ? `<div class="card wt-week"><h3>📰 ${safe(wk.label || "This week")} <small>${dayMon(wk.start)} – ${dayMon(wk.end)}</small></h3>
      ${wk.subjects.map(x => `<p><b>${safe(x.subject)}:</b> ${safe(x.topics.join(", "))}</p>`).join("") || `<p class="sc-empty">No topics in this newsletter.</p>`}
      ${due ? `<p class="hint">📰 The week review comes on Friday ${dayMon(due.fri)} after school.</p>` : ""}</div>`
    : `<div class="card wt-week"><p class="sc-empty">No newsletter for this week yet.</p><div class="btnrow"><button class="primary" data-nlnudge="${safe(k.id)}">📰 Upload the newsletter</button></div></div>`;
  return `<div class="card wt-card" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}"><h2>🛠️ Worksheet tools</h2>
    <p class="hint">🎯 makes a ${WS_COUNT}-question worksheet on the topics ${safe(k.name)} needs to work on: the app picks them. It's in ${safe(k.name)}'s 🎒 School › Worksheets.</p>
    ${subs.length ? `<ul class="wt-list">${rows}</ul>` : `<p class="sc-empty">No subjects yet. Add them in 🎒 School.</p>`}
    <div class="btnrow"><button class="wt-main" data-wtweek aria-expanded="${wtWeek}">📅 ${wtWeek ? "Hide" : "See"} week topics</button></div></div>${week}`;
}
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("[data-wtweek]");
  if (!b) return;
  wtWeek = !wtWeek; render();
});
// v155: titles without pictures (more professional): takes the emoji off the start of every h1 / h2 / h3 inside root
const PICS_RE = /^[\s\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D]+/u;
function plainHeads(root) {
  if (!root) return;
  root.querySelectorAll("h1, h2, h3").forEach(el => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode()) && !n.nodeValue.trim()) {}
    if (n && PICS_RE.test(n.nodeValue) && el.textContent.trim().replace(PICS_RE, "").trim()) n.nodeValue = n.nodeValue.replace(PICS_RE, "");
  });
}
const KID_SECS = [
  { id: "today", emoji: "📋", label: "Today" }, { id: "habits", emoji: "⭐", label: "Good habits today" },
  { id: "star", emoji: "🌟", label: "Shining Star" }, { id: "score", emoji: "🏆", label: "Score this week" },
  { id: "study", emoji: "📚", label: "Study per subject" }, { id: "points", emoji: "🎯", label: "Strong and weak points" },
  { id: "tasks", emoji: "✅", label: "Tasks" }, { id: "school", emoji: "🎒", label: "School" }, { id: "tools", emoji: "🛠️", label: "Worksheet tools" },
  { id: "work", emoji: "👀", label: "Work today" }, { id: "moods", emoji: "📔", label: "Moods and wishes" }, { id: "report", emoji: "📊", label: "Report" }];
// The status line under each big button
function kidSecLine(k, id) {
  const sc = scoreOf(k.id), h = kidHabitsToday(k.id);
  if (id === "today") return kidTodayLine(k.id);
  if (id === "habits") return h.all ? `${h.done} of ${h.all} done today` : "No habits on";
  if (id === "star") return kidStarLine(k.id) || "No scores yet";
  if (id === "score") return `${sc.overall} / ${sc.max}`;
  if (id === "study") return `Sessions ${sc.sp ? sc.sp.study + "%" : "–"} · Marks ${sc.wsCount ? sc.marks + "%" : "–"}`;
  if (id === "points") { const n = subjectList(schoolOf(k.id)).length; return n ? `${n} ${n === 1 ? "subject" : "subjects"}: good at, weak at, practise` : "No subjects yet"; }
  if (id === "tasks") { const t = sc.tk || {}; return t.planned ? `${Math.round(t.done / t.planned * 100)}% done this week` : "Nothing planned yet"; }
  if (id === "school") return "Files, worksheets, marks";
  if (id === "tools") return "Weak points worksheets, week topics";
  if (id === "work") { const n = kidsWorkItems().filter(x => x.kid === k.id).length; return n ? `${n} ${n === 1 ? "thing" : "things"} today` : "Nothing yet today"; }
  if (id === "moods") return "Moods, wishes";
  return "Best thing, needs help, PDF";
}
function drawKidPage() {
  if (!isParentDevice() || !exists(kidPage) || isParentId(kidPage)) return go("home");
  const k = userById(kidPage), c = colorsOf(k), sc = scoreOf(k.id), e = feat("diary") ? diaryOf(k.id, todayYmd()) : null;
  const secs = KID_SECS.filter(s => (s.id !== "habits" || habitsFor(k.id).length) && (s.id !== "moods" || feat("diary") || wishesListHtml(k.id)));
  if (kidSec && !secs.some(s => s.id === kidSec)) kidSec = null;
  if (kidSec) { $("kidBody").innerHTML = kidSectionHtml(k, kidSec); return plainHeads($("kidBody")); }
  const KP_CLAY = { today: "c-day", habits: "c-heart", star: "c-star", score: "c-trophy", study: "c-book", points: "c-rocket", tasks: "c-check", school: "c-school",
    tools: "c-pencil", work: "c-backpack", moods: "c-gift", report: "c-news" };   // 🧸 v239 clay icon per tile
  const face = charPic(k, "happy");
  $("kidBody").innerHTML = `
    <div class="card kp-top" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}">
      <div class="kp-head"><button class="kc-ringbtn" data-sdpop="${safe(k.id)}" aria-label="Score through the day">${scoreRingHtml(sc.overall, c.color, lastWeekScore(k.id))}${ringTrendHtml(k.id)}</button>${face ? `<img class="kp-face" src="${face}" alt="">` : ""}<div><h1>${face ? "" : safe(k.emoji) + " "}${safe(k.name)}${e && moodFace(e.mood) ? ` ${moodFace(e.mood)}` : ""}${kidCardTags(k.id)}</h1>
        <small>${safe(kidTodayLine(k.id))}</small></div></div></div>
    <div class="kp-tiles" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}">${secs.map(s => `<button class="kp-tile" data-kidsec="${s.id}">
      <span class="e kp-clay" aria-hidden="true">${ico3d(KP_CLAY[s.id] || "c-star")}</span><b>${s.label}</b><small>${safe(kidSecLine(k, s.id))}</small></button>`).join("")}</div>`;
}
// A big button → only that part; "⬅️ All about …" (or ⬅️ Back on the page) → the menu. (Runs before the general taps, see taps.js)
document.addEventListener("click", e => {
  const b = e.target.closest && e.target.closest("#scr-kid [data-kidsec], #scr-kid [data-navback]");
  if (!b) return;
  if ("navback" in b.dataset) { if (!kidSec) return; e.stopImmediatePropagation(); kidSec = null; }
  else kidSec = b.dataset.kidsec || null;
  render(); window.scrollTo(0, 0);
});
// ☰ More: simple, the same for everyone: 👤 My profile (big: each person's ⚙️ settings, and a parent's 👨‍👩‍👧 Family settings,
// 🚪 Sign out at its bottom) · 🔒 Your privacy · 👋 Show the tour. (✏️ Add activities and 🖨️ Print are on 📅 Calendar.)
function moreTilesHtml() {
  return [{ ...PROFILE_TILE, cls: "primary more-profile", sub: hasSpark(me) ? "My settings, my Spark, my school" : "My settings, my picture" },
    { profile: true, emoji: "👥", label: "Family profiles", sub: "Everyone's picture, birthday and Spark" },
    ...(isParentId(me) ? [] : [{ attr: "data-schoolset", emoji: "🏫", label: "My school", sub: "School, year, worksheets a day" }]), PRIVACY_TILE, TOUR_TILE].map(tileHtml).join("");
}
// 📋 Today: my next activities (not done yet, up to 5) with big ✅ ticks; "See all" opens 📅 Calendar
function todayItems(who) {
  const date = todayYmd();
  return [...(hasPlan() ? planDay(date).items.filter(it => it.users.includes(who)).map(it => ({ id: it.actId, name: it.name, start: it.start, end: it.end })) : []),
          ...(data.parentActs || []).filter(a => a.by === who && a.type !== "travel" && pactStartOn(a, date))
            .map(a => ({ id: a.id, name: `${pactType(a)[1]} ${a.title}`, start: a.from ? toMin(a.from) : -1, end: a.to ? toMin(a.to) : 1440 }))]
    .sort((a, b) => a.start - b.start);
}

// =====================================================================
//  ☰ MORE PAGES: 🗣️ family meeting · 📱 screen time · 📗 Quran & Arabic · 🧹 home duties
//   One "extra" screen (extraPage = which one). Each is a ⚙️ feature (off = hidden, no points).
//   Settings (plan document): data.screenRate { points, minutes, max } · data.chores [{ id, title, emoji, kids, days, turns, every }]
//   Shared items (points document, one field per item):
//     meeting    = "monday|person" → { great, better, goal, at }       (kept 8 weeks)
//     screen     = "date|kid" → { bought, used, run }                  (minutes; run = when the timer started; kept: points used)
//     quran      = kid → { surahs: { index: "done" | "revising" }, words: [{ id, text, date }] }
//     quranHeard = "date|kid|what" → { by, at }                        (+10, a parent heard it; 5 weeks)
//     chores     = "date|chore|kid" → { at }                           (+10; 5 weeks)
// =====================================================================
// (🏡 Our Community keeps the old ⚙️ key "meeting", so the family's on / off choice stays as it was)
const EXTRA_PAGES = [["meeting", "🏡", "Our Community", "Our family board"], ["chores", "🧹", "Home duties", "Jobs at home"]];   // (📱 Screen time: removed)
let extraPage = null, extraKid = null, extraEdit = null;   // the page, the kid a parent is looking at, an open form
const CHORE_POINTS = 10, HEARD_POINTS = 10, MEETING_DAY = 4;
// (SURAHS is with the other lists at the top: the saved data is checked with it)
function openExtra(k) {
  if (!feat(k) || !EXTRA_PAGES.some(p => p[0] === k)) return;   // (📱 a removed page: nothing)
  extraPage = k; extraEdit = null;
  extraKid = isParentDevice() ? (kidsList().some(x => x.id === extraKid) ? extraKid : (kidsList()[0] || {}).id) : me;
  homeMore = false;
  go("extra");
}
// The points from these pages (⚙️ off = none): ✅ home duties and 📗 "heard it" are Tasks
function extraTaskPoints(id, from, to) {
  let n = 0;
  const inRange = key => { const date = key.slice(0, 10); return date >= from && date < to; };
  if (feat("chores")) n += Object.keys(data.points.chores).filter(k => inRange(k) && k.split("|")[2] === id).length * CHORE_POINTS;
  // (📗 the removed Quran page: the "heard it" points already earned keep counting; no new ones can be made)
  n += Object.keys(data.points.quranHeard).filter(k => inRange(k) && k.split("|")[1] === id).length * HEARD_POINTS;
  return n;
}
const extraFunPoints = () => 0;
function drawExtra() {
  if (!extraPage || !feat(extraPage) || !EXTRA_PAGES.some(p => p[0] === extraPage)) return go("home");
  const [, emoji, label] = EXTRA_PAGES.find(p => p[0] === extraPage);
  $("extraTitle").textContent = `${emoji} ${label}`;
  const views = { meeting: communityHtml, chores: choresPageHtml };
  if (extraPage === "meeting") cmMarkSeen();   // (🏡 opened: nothing "new" any more on this device)
  $("extraBody").innerHTML = views[extraPage]();
}

// ---------- 🏡 OUR COMMUNITY: a simple family board, newest first (it took the place of 🗣️ Family meeting) ----------
//   Anyone writes: 📝 Note (about our family) · 🙏 I need (a kid asks the parents) · 📣 Please (a parent asks the kids) · ⭐ Review (1–5 stars).
//   Others react (❤️ 👍 😂 🙏); a 🙏 / 📣 can be marked ✅ Done. The writer (or a parent) deletes a post.
//   🔔 New 🙏: all parents · new 📣: the kids named (or all kids) · notes and reviews: everyone.
//   data.points.community = id → { type, text, by, at, stars?, to? }   cmReact = "post|person" → emoji   cmDone = post → { by, at }
//   (Kept 180 days. The old 🗣️ meeting answers stay saved in points.meeting, just not shown.)
// (CM_TYPES and CM_REACTS are at the top, with STUDY_POINTS: the saved data is checked with them when the app starts)
const CM_SEEN = SAVE_KEY + ".communitySeen";
let cmDraft = null;   // the post being written: { type, to: [kid ids], stars }
const cmTypesFor = who => isParentId(who) ? ["note", "please", "review"] : ["note", "need", "review"];
const cmPosts = () => Object.entries(data.points.community).map(([id, p]) => ({ id, ...p })).sort((a, b) => (b.at || "").localeCompare(a.at || ""));
function cmSeen() { try { return localStorage.getItem(CM_SEEN) || ""; } catch (e) { return ""; } }
function cmMarkSeen() { try { localStorage.setItem(CM_SEEN, new Date().toISOString()); } catch (e) {} }
const cmNewCount = () => { const seen = cmSeen(); return cmPosts().filter(p => p.by !== me && (p.at || "") > seen).length; };
const cmWhen = at => at ? new Date(at).toLocaleString("en-GB", { timeZone: "Asia/Dubai", weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
function communityHtml() {
  const posts = cmPosts(), d = cmDraft, parent = isParentDevice();
  const write = !d ? `<div class="btnrow"><button class="primary" data-cmwrite>➕ Write</button></div>`
    : !d.type ? `<div class="card sc-form cm-form"><h2>➕ What do you want to write?</h2><div class="cm-types">${cmTypesFor(me).map(t => { const [e, label, sub] = CM_TYPES[t];
        return `<button class="cm-type" data-cmtype="${t}"><span class="e">${e}</span><b>${label}</b><small>${sub}</small></button>`; }).join("")}</div>
        <div class="btnrow"><button data-cmcancel>Cancel</button></div></div>`
    : `<div class="card sc-form cm-form"><h2>${CM_TYPES[d.type][0]} ${CM_TYPES[d.type][1]}</h2>
        ${d.type === "review" ? `<label class="small">⭐ Stars</label><div class="cm-stars">${[1, 2, 3, 4, 5].map(n => `<button type="button" class="${d.stars >= n ? "on" : ""}" data-cmstar="${n}" aria-label="${n} stars">⭐</button>`).join("")}</div>` : ""}
        ${d.type === "please" ? `<label class="small">📣 For <small>(none ticked = all kids)</small></label><div class="cm-kids">${kidsList().map(k => `<button type="button" class="chip ${d.to.includes(k.id) ? "on" : ""}" data-cmkid="${safe(k.id)}" aria-pressed="${d.to.includes(k.id)}"><span class="e">${safe(k.emoji)}</span>${safe(k.name)}</button>`).join("")}</div>` : ""}
        <label class="small" for="cmText">✍️ Write it</label><textarea id="cmText" rows="3" maxlength="300" placeholder="${safe(CM_TYPES[d.type][3])}">${safe(d.text || "")}</textarea>
        <div class="err" id="cmErr"></div>
        <div class="btnrow"><button class="primary" data-cmsave>📮 Post</button><button data-cmcancel>Cancel</button></div></div>`;
  const list = posts.length ? posts.map(p => {
    const u = exists(p.by) ? userById(p.by) : null, c = u ? colorsOf(u) : GREY, [e, label] = CM_TYPES[p.type] || CM_TYPES.note;
    const reacts = Object.entries(data.points.cmReact).filter(([k]) => k.split("|")[0] === p.id);
    const done = data.points.cmDone[p.id];
    const canDone = (p.type === "need" || p.type === "please") && !done && p.by !== me;
    const forWho = p.type === "please" ? (p.to && p.to.length ? p.to.filter(exists).map(id => userById(id).name).join(", ") : "all kids") : "";
    return `<li class="card cm-post cm-${p.type}" style="--c:${c.color};--soft:${c.soft};--ink:${c.ink}">
      <div class="cm-top"><span class="cm-who"><span class="e">${u ? faceHtml(u) : "🙂"}</span><b>${safe(u ? u.name : "Someone")}</b></span>
        <span class="cm-kind">${e} ${label}${forWho ? ` · for ${safe(forWho)}` : ""}</span><small class="cm-time">${safe(cmWhen(p.at))}</small></div>
      ${p.type === "review" && p.stars ? `<p class="cm-starsline" aria-label="${p.stars} of 5 stars">${"⭐".repeat(p.stars)}<small> ${p.stars}/5</small></p>` : ""}
      <p class="cm-text">${safe(p.text)}</p>
      <div class="cm-acts">${CM_REACTS.map(r => { const n = reacts.filter(([, v]) => v === r).length, mine = data.points.cmReact[`${p.id}|${me}`] === r;
          return `<button class="cm-react ${mine ? "on" : ""}" data-cmreact="${safe(p.id)}|${r}" aria-pressed="${mine}">${r}${n ? ` ${n}` : ""}</button>`; }).join("")}
        ${done ? `<span class="cm-done">✅ Done${exists(done.by) ? ` · ${safe(userById(done.by).name)}` : ""}</span>` : canDone ? `<button class="cm-react" data-cmdone="${safe(p.id)}">✅ Done</button>` : ""}
        ${p.by === me || parent ? `<button class="cm-react danger-text" data-cmdel="${safe(p.id)}">🗑️ Delete</button>` : ""}</div></li>`;
  }).join("") : "";
  return write + (list ? `<ul class="cm-list">${list}</ul>` : `<div class="card"><p class="sc-empty">Nothing yet. Tap ➕ Write to start our board! 🏡</p></div>`);
}
// 🔔 Who gets a new post: 🙏 all parents · 📣 the kids named (or all kids) · 📝 ⭐ everyone
const cmFor = to => !to || to === "all" || (to === "parents" ? isParentId(me) : to === "kids" ? !isParentId(me) : Array.isArray(to) && to.includes(me));
function cmPost() {
  const d = cmDraft, text = $("cmText").value.trim().slice(0, 300);
  if (!d || !d.type || !cmTypesFor(me).includes(d.type)) return;
  if (!text) return $("cmErr").textContent = "Please write something first. 🙂";
  if (d.type === "review" && !d.stars) return $("cmErr").textContent = "Please pick 1 to 5 stars. ⭐";
  const id = newId(), to = d.type === "please" ? d.to.filter(exists) : [];
  data.points.community[id] = { type: d.type, text, by: me, at: new Date().toISOString(), ...(d.type === "review" ? { stars: d.stars } : {}), ...(to.length ? { to } : {}) };
  cmDraft = null;
  keepNow();
  const short = text.length > 80 ? text.slice(0, 80) + "…" : text;
  const news = d.type === "need" ? { what: `🙏 needs: ${short}`, to: "parents" }
    : d.type === "please" ? { what: `📣 asks: ${short}`, to: to.length ? to : "kids" }
    : d.type === "review" ? { what: `⭐ gave ${d.stars}/5: ${short}`, to: "all" } : { what: `📝 wrote: ${short}`, to: "all" };
  addNews([{ ...newsItem("cm", news.what, CM_TYPES[d.type][0] + " " + CM_TYPES[d.type][1], me), to: news.to }]);
  toast("📮 Posted on 🏡 Our Community!", 2500);
}
function communityTap(ds) {
  if ("cmwrite" in ds) { cmDraft = { type: null, to: [], stars: 0 }; return render(); }
  if ("cmcancel" in ds) { cmDraft = null; return render(); }
  const keep = () => { if (cmDraft && $("cmText")) cmDraft.text = $("cmText").value; };   // (what's typed stays when a star / kid is tapped)
  if (ds.cmtype && cmDraft && cmTypesFor(me).includes(ds.cmtype)) { cmDraft.type = ds.cmtype; return render(); }
  if (ds.cmstar && cmDraft) { keep(); cmDraft.stars = Number(ds.cmstar); return render(); }
  if (ds.cmkid && cmDraft) { keep(); cmDraft.to = cmDraft.to.includes(ds.cmkid) ? cmDraft.to.filter(x => x !== ds.cmkid) : [...cmDraft.to, ds.cmkid]; return render(); }
  if ("cmsave" in ds) return cmPost();
  if (ds.cmreact) {
    const [id, r] = ds.cmreact.split("|"), key = `${id}|${me}`;
    if (!data.points.community[id] || !CM_REACTS.includes(r)) return;
    if (data.points.cmReact[key] === r) delete data.points.cmReact[key]; else data.points.cmReact[key] = r;
    return keepNow();
  }
  if (ds.cmdone) {
    const p = data.points.community[ds.cmdone];
    if (!p || p.by === me) return;
    data.points.cmDone[ds.cmdone] = { by: me, at: new Date().toISOString() };
    keepNow();
    return toast("✅ Done! Thank you 💛", 2200);
  }
  if (ds.cmdel) {
    const p = data.points.community[ds.cmdel];
    if (!p || !(p.by === me || isParentDevice()) || !confirm("Delete this post?")) return;
    delete data.points.community[ds.cmdel]; delete data.points.cmDone[ds.cmdel];
    Object.keys(data.points.cmReact).forEach(k => { if (k.split("|")[0] === ds.cmdel) delete data.points.cmReact[k]; });
    return keepNow();
  }
}

// (📱 Screen time was removed: its saved data (data.screenRate, points.screen) is kept but not shown, and the points stay as they are.
//  The only reward in the app is the ⭐ Shining Star choosing their own prize: 🎁 Choose my prize.)

// (📗 Quran & Arabic was removed: its saved data (points.quran, points.quranHeard) is kept but not shown, and the
//  "✅ heard it" points already earned still count. A family that wants Quran adds it as a school subject in ✏️ Edit subjects.)

// ---------- 🧹 Home duties: per kid with days, or taking turns (daily / weekly); kids tick ✅ (+10, Tasks) ----------
const choresList = () => data.chores || [];
const dayNumber = date => Math.floor(fromYmd(date).getTime() / 86400000 + 0.5);
function choreKidsOn(ch, date) {
  if (!ch.days.includes(weekdayOf(date))) return [];
  const kids = ch.kids.filter(exists);
  if (!kids.length) return [];
  if (!ch.turns) return kids;
  const n = ch.every === "week" ? Math.floor((dayNumber(date) - weekdayOf(date)) / 7) : dayNumber(date);
  return [kids[((n % kids.length) + kids.length) % kids.length]];
}
const choreDone = (date, ch, kid) => !!data.points.chores[`${date}|${ch.id}|${kid}`];
function choresTodayHtml(kid) {
  const date = todayYmd(), list = choresList().filter(ch => choreKidsOn(ch, date).includes(kid)), c = colorsOf(userById(kid));
  return list.length ? `<div class="card td-card" style="--c:${c.color}"><h2>🧹 My duties today</h2>${list.map(ch => { const on = choreDone(date, ch, kid); return `<div class="td-row">
    <button class="k-check td-check ${on ? "on" : ""}" data-chore="${safe(ch.id)}|${safe(kid)}" style="--c:${c.color}" aria-pressed="${on}" aria-label="${safe(ch.title)}">${on ? "✓" : ""}</button>
    <span class="td-what"><b>${safe(ch.emoji)} ${safe(ch.title)}</b><small>+${CHORE_POINTS} ⭐</small></span></div>`; }).join("")}</div>` : "";
}
function choresPageHtml() {
  const parent = isParentDevice(), date = todayYmd();
  const today = kidsList().map(k => ({ k, list: choresList().filter(ch => choreKidsOn(ch, date).includes(k.id)) })).filter(x => x.list.length && (parent || x.k.id === me));
  const ed = extraEdit && extraEdit.chore;
  const form = parent && ed ? `<div class="card sc-form"><h2>${ed.id ? "✏️ Duty" : "➕ New duty"}</h2>
      <div class="row"><div style="flex:0 0 70px"><label class="small" for="chEmoji">Emoji</label><input type="text" id="chEmoji" maxlength="8" value="${safe(ed.emoji || "🧹")}"></div>
        <div><label class="small" for="chTitle">What</label><input type="text" id="chTitle" maxlength="40" value="${safe(ed.title || "")}" placeholder="Set the table"></div></div>
      <label class="small">Who</label><div class="daypick">${kidsList().map(k => `<label><input type="checkbox" name="chKid" value="${safe(k.id)}" ${(ed.kids || []).includes(k.id) ? "checked" : ""}><span>${safe(k.emoji)} ${safe(k.name)}</span></label>`).join("")}</div>
      <label class="small">Days</label><div class="daypick">${SHORT.map((d, i) => `<label><input type="checkbox" name="chDay" value="${i}" ${(ed.days || [0, 1, 2, 3, 4, 5, 6]).includes(i) ? "checked" : ""}><span>${d}</span></label>`).join("")}</div>
      <label class="checkline"><input type="checkbox" id="chTurns" ${ed.turns ? "checked" : ""}> 🔄 Take turns</label>
      <select id="chEvery" aria-label="Change turns every"><option value="day" ${ed.every !== "week" ? "selected" : ""}>Every day</option><option value="week" ${ed.every === "week" ? "selected" : ""}>Every week</option></select>
      <div class="err" id="chErr"></div>
      <div class="btnrow"><button class="primary" data-chsave>💾 Save</button>${ed.id ? `<button class="danger-text" data-chdel="${safe(ed.id)}">🗑️ Delete</button>` : ""}<button data-chcancel>Cancel</button></div></div>` : "";
  return (parent && !ed ? `<div class="btnrow"><button class="primary" data-chnew>➕ New duty</button></div>` : "") + form
    + `<div class="card"><h2>Today</h2>${today.map(({ k, list }) => `<h3 class="ph-group">${safe(k.emoji)} ${safe(k.name)}</h3>${list.map(ch => { const on = choreDone(date, ch, k.id); return `<div class="td-row">
      <button class="k-check td-check ${on ? "on" : ""}" data-chore="${safe(ch.id)}|${safe(k.id)}" style="--c:${colorsOf(k).color}" aria-pressed="${on}" aria-label="${safe(ch.title)}">${on ? "✓" : ""}</button>
      <span class="td-what"><b>${safe(ch.emoji)} ${safe(ch.title)}</b></span></div>`; }).join("")}`).join("") || `<p class="sc-empty">No duties today.</p>`}</div>`
    + (parent ? `<div class="card"><h2>All duties</h2><ul class="list">${choresList().map(ch => `<li><span class="what">${safe(ch.emoji)} ${safe(ch.title)}<small>${ch.kids.filter(exists).map(id => userById(id).emoji).join(" ")}
      ${ch.turns ? ` · 🔄 ${ch.every === "week" ? "weekly" : "daily"}` : ""} · ${ch.days.map(i => SHORT[i]).join(" ")}</small></span><button class="edit" data-chedit="${safe(ch.id)}" aria-label="Change">✏️ Edit</button></li>`).join("")
      || `<li class="sc-empty">No duties yet.</li>`}</ul></div>` : "");
}

// ---------- The taps on these pages ----------
const EXTRA_KEYS = ["extra", "extrakid", "cmwrite", "cmcancel", "cmtype", "cmstar", "cmkid", "cmsave", "cmreact", "cmdone", "cmdel",
                    "qsurah", "qword", "qheard",
                    "chore", "chnew", "chedit", "chcancel", "chdel", "chsave"];
const isExtraTap = ds => Object.keys(ds).some(k => EXTRA_KEYS.includes(k));
function extraTap(ds, t) {
  const kidOK = kid => kid === me || isParentDevice();
  if (ds.extra) return openExtra(ds.extra);
  if (ds.extrakid) { if (kidLockedOut(ds.extrakid)) return lockedToast(ds.extrakid); extraKid = ds.extrakid; return render(); }
  // 🏡
  if (Object.keys(ds).some(k => k.startsWith("cm"))) return communityTap(ds);
  // 🧹
  if (ds.chore) {
    const [id, kid] = ds.chore.split("|"), ch = choresList().find(x => x.id === id), date = todayYmd();
    if (!ch || !kidOK(kid) || !choreKidsOn(ch, date).includes(kid)) return;
    if (newWeek()) keepNow();
    const key = `${date}|${id}|${kid}`;
    if (data.points.chores[key]) delete data.points.chores[key];
    else { data.points.chores[key] = { at: new Date().toISOString() }; const r = t.getBoundingClientRect(); celebrate(r.left + r.width / 2, r.top, colorsOf(userById(kid)).color, false); toast(`🧹 Well done! +${CHORE_POINTS} ⭐`, 2200); }
    return keepNow();
  }
  if ("chnew" in ds) { extraEdit = { chore: { kids: [], days: [0, 1, 2, 3, 4, 5, 6] } }; return render(); }
  if (ds.chedit) { const ch = choresList().find(x => x.id === ds.chedit); if (ch) extraEdit = { chore: { ...ch } }; return render(); }
  if ("chcancel" in ds) { extraEdit = null; return render(); }
  if (ds.chdel && isParentDevice()) { if (!confirm("Delete this duty?")) return; data.chores = choresList().filter(x => x.id !== ds.chdel); extraEdit = null; return keepNow(); }
  if ("chsave" in ds && isParentDevice()) {
    const title = $("chTitle").value.trim().slice(0, 40), kids = [...document.querySelectorAll('input[name="chKid"]:checked')].map(x => x.value);
    const days = [...document.querySelectorAll('input[name="chDay"]:checked')].map(x => Number(x.value));
    if (!title || !kids.length || !days.length) return $("chErr").textContent = "Please type what, and pick who and the days.";
    const ch = { id: (extraEdit.chore && extraEdit.chore.id) || newId(), title, emoji: $("chEmoji").value.trim().slice(0, 8) || "🧹", kids, days,
                 turns: $("chTurns").checked, every: $("chEvery").value === "week" ? "week" : "day" };
    data.chores = [...choresList().filter(x => x.id !== ch.id), ch];
    extraEdit = null; return keepNow();
  }
  return false;
}

// ---------- 👋 The first-time tour: 4 swipe cards (kids / parents). ☰ More → Show the tour ----------
const TOUR_KID = [["✅", "Tick your tasks", "When you finish something, tap its big ✅. Every tick gives you points!"],
                  ["🧩", "Solve your riddles", "A riddle pops up when you open the app. Stuck? Ask someone in the family for help."],
                  ["📔", "Tell us your day", "Pick a face for how you feel, and write a line about your day."],
                  ["✨", "Grow your Spark", "All your points help your Spark grow. Can you reach the next level?"]];
const TOUR_PARENT = [["📅", "Family calendar", "Everyone's week in one place. ✨ Plan my week fits all the activities together."],
                     ["🎒", "School coach", "Upload today's school work: 🤖 makes worksheets, checks the answers and tells you what to practise."],
                     ["⭐", "Points & the kids' habits", "⭐ Score (out of 100, each week): 📚 study sessions (60: 30 for doing the planned time + 30 for their results) + ⚡ extra worksheets (each adds its mark × 2, up to 20) + ✅ items and habits ticked (20). Each missed ⭐ must-do takes off 2, except on your days off (📅 Calendar setup). Points still grow the ✨ Spark."],
                     ["⚙️", "Settings", "Turn features on or off for your family, and set up the people and the day."]];
let tourShown = false;   // (once per opening of the app)
function maybeShowTour() {
  const u = userById(me);
  if (tourShown || !u || u.toured || !(!cloud.enabled || cloud.ready)) return;
  tourShown = true;
  setTimeout(showTour, 400);
}
function showTour() {
  if (document.querySelector(".tour")) return;
  const cards = isParentId(me) && !isKidDevice() ? TOUR_PARENT : TOUR_KID, c = colorsOf(userById(me));
  const box = document.createElement("div");
  box.className = "tour";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "How the app works");
  box.innerHTML = `<div class="tour-box" style="--c:${c.color};--soft:${c.soft}">
    <div class="tour-track">${cards.map(([e, title, text], i) => `<div class="tour-card"><div class="tour-e">${e}</div><h2>${title}</h2><p>${text}</p>
      <small>${i + 1} / ${cards.length}</small></div>`).join("")}</div>
    <div class="tour-dots">${cards.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
    <div class="btnrow"><button data-tourskip>Skip</button><button class="primary" data-tournext>Next ›</button></div></div>`;
  const track = box.querySelector(".tour-track"), dots = box.querySelectorAll(".tour-dots i"), next = box.querySelector("[data-tournext]");
  const at = () => Math.round(track.scrollLeft / track.clientWidth);
  const show = () => { const i = at(); dots.forEach((d, k) => d.classList.toggle("on", k === i)); next.textContent = i >= cards.length - 1 ? "Let's go! 🎉" : "Next ›"; };
  const close = () => { box.remove(); const u = data.users.find(x => x.id === me); if (u && !u.toured) { u.toured = true; writeData("auto"); } maybeShowSetup(); };
  track.addEventListener("scroll", () => requestAnimationFrame(show), { passive: true });
  box.addEventListener("click", e => {
    if (e.target.closest("[data-tourskip]")) return close();
    if (e.target.closest("[data-tournext]")) { const i = at(); if (i >= cards.length - 1) return close(); track.scrollTo({ left: (i + 1) * track.clientWidth, behavior: "smooth" }); }
  });
  document.body.appendChild(box);
  next.focus();
}

// ---------- ✨ Make the app yours (parents): which features the family uses ----------
// Asked once (after the tour; an existing family: the next time a parent opens the app). Later: "✏️ Edit my home" (parent home)
// or ⚙️ Settings → Features. Off = hidden everywhere (tiles, habits, menus, points), never deleted: on again brings it all back.
// data.featuresChosen = a parent saved it (or said "Not now") once.
const FEATURE_INFO = {
  coach: ["🎒", "School coach", "Upload school work: 🤖 makes worksheets and checks them"], newsletter: ["📰", "Newsletter", "Read the school newsletter into the calendar"],
  riddles: ["🧩", "Riddles", "A fun riddle of the day for everyone"], diary: ["📔", "My day", "A mood and a few lines about the day"],
  buddy: ["✨", "Spark levels", "A Spark that grows with all your points"], parentPoints: ["⭐", "Parent points", "Parents earn points too: their activities and the weekly prize"],
  wishes: ["💌", "Kids' wishes", "Every Friday the kids tell you their wishes"], prayer: ["🕌", "Prayer times", "Prayer times on the calendar"],
  chores: ["🧹", "Home duties", "Jobs at home, or taking turns"],
  meeting: ["🏡", "Our Community", "A family board: notes, requests, reviews"]
};
let setupDraft = null;   // the switches being chosen (a copy of data.features)
function openSetup() {
  if (!isParentDevice()) return;
  setupDraft = { ...data.features };
  setupStep = "features";
  homeMore = false;
  go("setup");
}
let setupStep = "features";   // ✨ the features, then 📘 each kid's subjects
function drawSetup() {
  if (!isParentDevice()) return go("home");
  if (setupStep === "subjects") return drawSetupSubjects();
  if (!setupDraft) setupDraft = { ...data.features };
  $("setupBody").innerHTML = `<p class="lead">What would you like in your family app?</p>
    <div class="su-top"><span>${Object.values(setupDraft).filter(Boolean).length} of ${FEATURES.length} on</span><button class="linkbtn" data-setupall>Turn all on</button></div>
    <div class="su-grid">${FEATURES.map(([k]) => { const [e, name, what] = FEATURE_INFO[k], on = !!setupDraft[k]; return `<button class="su-card ${on ? "on" : ""}"
      data-setupfeat="${k}" role="switch" aria-checked="${on}"><span class="e">${e}</span><span class="su-text"><b>${name}</b><small>${what}</small></span>
      <span class="su-switch" aria-hidden="true"><i></i></span></button>`; }).join("")}</div>
    <p class="hint">Turned off = hidden, never deleted. Turn it on again and everything comes back.</p>
    <div class="btnrow su-save"><button class="primary" data-setupsave>✅ Save</button>${data.featuresChosen ? "" : `<button data-setuplater>Not now</button>`}</div>`;
}
function saveSetup(later) {
  if (!isParentDevice()) return;
  if (!later && setupDraft) data.features = { ...data.features, ...setupDraft };
  data.featuresChosen = true;
  setupDraft = null;
  writeData();
  if (!later && kidsList().length) { setupStep = "subjects"; return render(); }   // → 📘 the kids' subjects
  go("home");
  if (!later) toast("✅ Your family app is ready!", 2600);
}
// 📘 Step 2 (first time, parents): each kid's school subjects, the same as their 🎒 School subjects (used by 📚 Study activities).
// ➕ a suggested one or any name · ✕ remove (one with work in it is hidden instead). Changed any time in 🎒 School → ✏️ Edit subjects.
function drawSetupSubjects() {
  $("setupBody").innerHTML = `<p class="lead">📘 Each kid's school subjects</p>
    <p class="hint">For 📚 Study activities. Change them any time in 🎒 School → ✏️ Edit subjects.</p>
    ${kidsList().map(k => { const list = subjectList(schoolOf(k.id)), have = n => list.some(x => sameSubject(x.name, n));
      return `<div class="card su-subs"><h2>${safe(k.emoji)} ${safe(k.name)}</h2>
        <div class="su-have">${list.length ? list.map(x => `<span class="su-sub">${safe(x.emoji)} ${safe(x.name)}<button type="button" class="x" data-susubdel="${safe(k.id)}|${safe(x.id)}" aria-label="Remove ${safe(x.name)}">✕ Remove</button></span>`).join("")
          : `<span class="hint">No subjects yet.</span>`}</div>
        <div class="su-sugg">${SUBJECTS.filter(x => !have(x.name)).map(x => `<button type="button" class="pill" data-susubadd="${safe(k.id)}|${safe(x.name)}">➕ ${x.emoji} ${safe(x.name)}</button>`).join("")}</div>
        <label class="small" for="susub-${safe(k.id)}">➕ Another subject</label>
        <div class="su-addrow"><input type="text" id="susub-${safe(k.id)}" maxlength="30" placeholder="French, Computing…"><button type="button" class="pill" data-susubnew="${safe(k.id)}">➕ Add</button></div></div>`; }).join("")}
    <div class="btnrow su-save"><button class="primary" data-susubdone>✅ Done</button></div>`;
}
function setupSubjectTap(ds) {
  if (!isParentDevice()) return;
  if ("susubdone" in ds) { setupStep = "features"; go("home"); return toast("✅ Your family app is ready!", 2600); }
  const [kid, x] = (ds.susubdel || ds.susubadd || ds.susubnew || "").split("|");
  if (!kid || !userById(kid)) return;
  if (ds.susubdel) { schoolKid = kid; return deleteSubject(x); }   // (the usual 🗑️: work in it → hidden instead)
  const name = (ds.susubadd ? x : ($("susub-" + kid) || {}).value || "").trim().slice(0, 30);
  if (!name) return toast("Type a subject first.", 2000);
  ensureFolder(schoolFor(kid), name);
  writeData();
  render();
}
// The first time: after the tour (if it's still to come, the tour's end opens it)
let setupAsked = false;
function maybeShowSetup() {
  const u = userById(me);
  if (setupAsked || data.featuresChosen || !isParentDevice() || !u || !u.toured || document.querySelector(".tour") || screen === "setup" || !(!cloud.enabled || cloud.ready)) return;
  setupAsked = true;
  setTimeout(openSetup, 300);
}

// ---------- ⚙️ Features (Settings, parents): the same choices, on the "✨ Make the app yours" screen ----------
function drawFeatures() {
  const card = $("featCard");
  if (!isParentDevice()) { card.innerHTML = ""; card.hidden = true; return; }
  card.hidden = false;
  const on = FEATURES.filter(([k]) => feat(k));
  card.innerHTML = `<h2>⚙️ Features</h2><p class="hint">${on.length} of ${FEATURES.length} on: ${on.map(([, e]) => e).join(" ")}</p>
    <div class="btnrow"><button class="primary" data-setupopen>✨ Choose the features</button></div>`;
}
document.addEventListener("change", e => {
  const k = e.target.dataset && e.target.dataset.feat;
  if (!k || !isParentDevice()) return;
  data.features[k] = e.target.checked;
  keepNow();
  toast(`${e.target.checked ? "✓ On" : "Off"}: ${(FEATURES.find(f => f[0] === k) || [])[2]}`, 1800);
});
