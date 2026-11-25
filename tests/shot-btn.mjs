import { chromium } from 'playwright';
import path from 'path';
const styles = {
 A: `.login-card .login-btn{background:linear-gradient(180deg,#B9CC9F,#9DB482)!important;border:3px solid #fff!important;color:#fff!important;text-shadow:0 1px 2px rgba(60,80,40,.35);box-shadow:0 8px 18px rgba(110,140,80,.3),inset 0 -5px 0 rgba(0,0,0,.08)!important}`,
 B: `.login-card .login-btn{background:linear-gradient(90deg,#E8A59C,#F2CF7C,#A9BE8E,#C7A8DA,#A9C7E0)!important;border:3px solid #fff!important;color:#4A3426!important;box-shadow:0 8px 18px rgba(74,52,38,.18),inset 0 -5px 0 rgba(0,0,0,.06)!important}`,
 C: `.login-card .login-btn{background:linear-gradient(180deg,#D6AE97,#C99A82)!important;border:3px solid #fff!important;color:#fff!important;text-shadow:0 1px 2px rgba(80,50,30,.3);box-shadow:0 8px 18px rgba(150,100,70,.28),inset 0 -5px 0 rgba(0,0,0,.08)!important}`,
};
const b = await chromium.launch();
for (const [k, css] of Object.entries(styles)) {
  const pg = await b.newPage({ viewport: { width: 390, height: 800 }, deviceScaleFactor: 2 });
  await pg.route(/gstatic|googleapis|firebase/, r => r.abort());
  await pg.goto('file://' + path.resolve('../index.html'), { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(700);
  await pg.addStyleTag({ content: css });
  await pg.evaluate(() => { document.querySelectorAll('body > *').forEach(e => { if (e.id !== 'loginScreen') e.style.display = 'none'; });
    const l = document.getElementById('loginScreen'); l.hidden = false; l.style.display = 'grid'; loginStep('parent'); });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `/tmp/claude-0/-home-user/7a8246ca-648d-52c6-bbd2-b059c0606ab8/scratchpad/btn-${k}.png`, clip: { x: 0, y: 470, width: 390, height: 250 } });
  await pg.close();
}
await b.close();
