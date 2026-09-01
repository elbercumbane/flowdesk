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
const email = `seed.shot.${Date.now()}@gmail.com`;
const password = "SeedShot2026!";
const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]+/, "");
const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
await db.connect();

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
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`);
  return json;
}

const created = await admin("/auth/v1/admin/users", {
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Catalog Viewer" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name, email) values ($1, $2, $3) on conflict (id) do update set email = excluded.email`,
  [String(userId), "Catalog Viewer", email]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [org.rows[0].id, userId]
);

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const summary = {};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
  await page.type("#email", email);
  await page.type("#password", password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);

  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector(".recharts-surface", { timeout: 10000 }).catch(() => {});
  summary.dashboard = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".grid > div")).map((el) => ({
      label: el.querySelector(".text-xs")?.textContent,
      value: el.querySelector("p")?.textContent,
    }))
  );
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-seed-dashboard.png" });

  await page.goto("http://localhost:3000/app/customers", { waitUntil: "networkidle0" });
  summary.customers = await page.$$eval("table tbody tr", (rows) => rows.length);
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-seed-customers.png" });

  await page.goto("http://localhost:3000/app/deals", { waitUntil: "networkidle0" });
  summary.deals = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll(".shrink-0"));
    const out = {};
    for (const col of cols) {
      const label = col.querySelector(".font-medium")?.textContent?.trim();
      const count = col.querySelector(".text-xs")?.textContent?.trim();
      if (label) out[label] = count;
    }
    return out;
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-seed-deals.png" });

  await page.goto("http://localhost:3000/app/tasks", { waitUntil: "networkidle0" });
  summary.tasks = await page.evaluate(() => document.querySelectorAll("input[type='checkbox']").length);
  summary.overdue = await page.evaluate(() => document.querySelectorAll(".text-red-600").length);
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-seed-tasks.png" });

  await page.goto("http://localhost:3000/app/invoices", { waitUntil: "networkidle0" });
  summary.invoices = await page.evaluate(() =>
    Array.from(document.querySelectorAll("table tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td")).slice(0, 5).map((td) => td.textContent.replace(/\s+/g, " ").trim())
    )
  );
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-seed-invoices.png" });
} finally {
  await browser.close();
  await db.query(`delete from public.memberships where user_id = $1`, [String(userId)]);
  await db.query(`delete from public.profiles where id = $1`, [String(userId)]);
  await db.end();
  await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}

console.log(JSON.stringify(summary, null, 2));
