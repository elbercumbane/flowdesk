import { pathToFileURL } from "node:url";
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const puppeteer = (
  await import(
    pathToFileURL(
      "C:/Users/Elber Elizio/AppData/Local/Temp/flowdesk-shots/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js"
    ).href
  )
).default;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ownerEmail = `team.owner.${Date.now()}@gmail.com`;
const ownerPassword = "TeamOwnerTest2026!";
const inviteeEmail = "flowdesk.dev2@gmail.com";
const inviteePassword = "FlowDeskDev2!";
const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]+/, "");
const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();
await db.query(`notify pgrst, 'reload schema'`);

async function admin(path, { method = "POST", body } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${path} ${JSON.stringify(json)}`);
  return json;
}

async function findUser(email) {
  const listed = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, {
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  }).then((r) => r.json());
  return (listed.users ?? []).find((u) => u.email === email);
}

async function deleteUserByEmail(email) {
  const match = await findUser(email);
  if (!match) return;
  await db.query(`delete from public.memberships where user_id = $1`, [String(match.id)]);
  await db.query(`delete from public.profiles where id = $1`, [String(match.id)]);
  await fetch(`${url}/auth/v1/admin/users/${match.id}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}

await deleteUserByEmail(inviteeEmail);
await db.query(`delete from public.invitations where email = $1`, [inviteeEmail]);

const created = await admin("/auth/v1/admin/users", {
  body: {
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: { full_name: "Team Owner" },
  },
});
const ownerId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(ownerId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name, email) values ($1, $2, $3)
   on conflict (id) do update set email = excluded.email, full_name = excluded.full_name`,
  [String(ownerId), "Team Owner", ownerEmail]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [org.rows[0].id, ownerId]
);

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const results = {};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
  await page.type("#email", ownerEmail);
  await page.type("#password", ownerPassword);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);

  await page.goto("http://localhost:3000/app/team", { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluate(() => {
    Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Invite"))?.click();
  });
  await page.waitForSelector('input[name="email"]');
  await page.type('input[name="email"]', inviteeEmail);
  await page.select('select[name="role"]', "member");
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => document.body.innerText.includes("Convites pendentes"), { timeout: 15000 });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-team-invite.png" });

  const inv = await db.query(
    `select id from public.invitations where email = $1 and status = 'pending' order by created_at desc limit 1`,
    [inviteeEmail]
  );
  const invitationId = inv.rows[0].id;
  results.invitationId = invitationId;

  const invitee = await admin("/auth/v1/admin/users", {
    body: {
      email: inviteeEmail,
      password: inviteePassword,
      email_confirm: true,
      user_metadata: { full_name: "Flowdesk Dev Two" },
    },
  });
  for (let i = 0; i < 10; i++) {
    const p = await db.query(`select id from public.profiles where id = $1`, [String(invitee.id)]);
    if (p.rowCount) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  await db.query(
    `insert into public.profiles (id, full_name, email) values ($1, $2, $3)
     on conflict (id) do update set email = excluded.email, full_name = excluded.full_name`,
    [String(invitee.id), "Flowdesk Dev Two", inviteeEmail]
  );

  const context = await browser.createBrowserContext();
  const guest = await context.newPage();
  await guest.setViewport({ width: 1280, height: 800 });
  await guest.goto(`http://localhost:3000/invite/${invitationId}`, { waitUntil: "networkidle0", timeout: 30000 });
  results.anonRedirect = guest.url();

  await guest.goto(`http://localhost:3000/login?returnTo=/invite/${invitationId}`, { waitUntil: "networkidle0" });
  await guest.type("#email", inviteeEmail);
  await guest.type("#password", inviteePassword);
  await Promise.all([
    guest.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
    guest.click('button[type="submit"]'),
  ]);
  results.afterLogin = guest.url();
  await guest.goto(`http://localhost:3000/invite/${invitationId}`, { waitUntil: "networkidle0", timeout: 30000 });
  results.invitePage = await guest.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 400));
  await guest.screenshot({ path: process.env.TEMP + "/flowdesk-invite.png" });

  await guest.evaluate(() => {
    Array.from(document.querySelectorAll("button")).find((b) => b.textContent.includes("Aceitar convite"))?.click();
  });
  await guest.waitForFunction(
    () => location.pathname.startsWith("/app") || document.querySelector("p.text-red-600"),
    { timeout: 20000 }
  ).catch(() => {});
  await new Promise((r) => setTimeout(r, 1500));
  results.afterAccept = {
    url: guest.url(),
    error: await guest.$eval("p.text-red-600", (el) => el.textContent).catch(() => null),
  };

  await page.goto("http://localhost:3000/app/team", { waitUntil: "networkidle0" });
  results.ownerTeam = await page.evaluate(() =>
    Array.from(document.querySelectorAll("p.text-sm.font-medium")).map((p) => p.textContent.replace(/\s+/g, " ").trim())
  );
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-team-two.png" });

  results.members = (
    await db.query(
      `select p.email, p.full_name, m.role
       from public.memberships m
       join public.profiles p on p.id = m.user_id
       join public.organizations o on o.id = m.organization_id
       where o.slug = 'flow1'
       order by m.role, p.email`
    )
  ).rows;
  results.inviteStatus = (
    await db.query(`select status from public.invitations where id = $1`, [invitationId])
  ).rows[0];
} finally {
  await browser.close();
  await db.query(`delete from public.memberships where user_id = $1`, [String(ownerId)]);
  await db.query(`delete from public.profiles where id = $1`, [String(ownerId)]);
  await db.end();
  await fetch(`${url}/auth/v1/admin/users/${ownerId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}

console.log(JSON.stringify(results, null, 2));
