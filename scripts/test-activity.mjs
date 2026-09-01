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
const email = `activity.${Date.now()}@gmail.com`;
const password = "ActivityTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Activity Actor" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name, email) values ($1, $2, $3)
   on conflict (id) do update set full_name = excluded.full_name, email = excluded.email`,
  [String(userId), "Activity Actor", email]
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

const results = {};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
  await page.type("#email", email);
  await page.type("#password", password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);

  await page.goto("http://localhost:3000/app/customers/new", { waitUntil: "networkidle0", timeout: 30000 });
  await page.type("#name", "Eva Mendes");
  await page.type("#company", "Atlantic Co");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  results.customerCreated = { url: page.url(), error: await page.$eval("p.text-red-600", (el) => el.textContent).catch(() => null) };

  await page.goto("http://localhost:3000/app/deals", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Brand redesign")
    );
    const select = card?.querySelector("select");
    if (!select) throw new Error("deal select missing");
    select.value = "qualified";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.goto("http://localhost:3000/app/invoices", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("table tbody tr"))[0];
    const select = row?.querySelector("select");
    if (!select) throw new Error("invoice select missing");
    const next = select.value === "paid" ? "sent" : "paid";
    select.value = next;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.goto("http://localhost:3000/app/tasks", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("p.font-medium")).find((p) => {
      const box = p.closest(".flex.items-center");
      const checked = box?.querySelector("input[type='checkbox']")?.checked;
      return !checked && p.textContent.includes("Preparar apresentação mensal");
    })?.closest(".flex.items-center");
    const fallback = Array.from(document.querySelectorAll("input[type='checkbox']")).find((i) => !i.checked);
    (row?.querySelector("input[type='checkbox']") ?? fallback)?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  await page.goto("http://localhost:3000/app/activity", { waitUntil: "networkidle0", timeout: 30000 });
  results.activity = await page.evaluate(() => ({
    heading: document.querySelector("h1")?.textContent,
    error: document.querySelector(".text-red-600")?.textContent,
    rows: Array.from(document.querySelectorAll(".rounded-xl.border.bg-white .flex.items-start")).map((row) => ({
      text: row.querySelector(".text-sm")?.textContent?.trim(),
      meta: row.querySelector(".text-xs")?.textContent?.trim(),
    })),
  }));
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-activity.png" });
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-activity-mobile.png" });
} finally {
  await browser.close();
  results.db = (
    await db.query(
      `select action, entity_type, description, actor_id
       from public.activity_logs
       order by created_at desc
       limit 10`
    )
  ).rows;
  await db.query(`delete from public.memberships where user_id = $1`, [String(userId)]);
  await db.query(`delete from public.profiles where id = $1`, [String(userId)]);
  await db.end();
  await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}` },
  });
}

console.log(JSON.stringify(results, null, 2));
