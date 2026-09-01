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
const email = `dash.${Date.now()}@gmail.com`;
const password = "DashTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Dash Tester" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name) values ($1, $2) on conflict (id) do nothing`,
  [String(userId), "Dash Tester"]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
const orgId = org.rows[0].id;
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [orgId, userId]
);

await db.query(`update public.invoices set status = 'paid' where number = 'INV-0001'`);

const customer = await db.query(
  `select id from public.customers where organization_id = $1 order by name limit 1`,
  [orgId]
);
const customerId = customer.rows[0].id;

async function ensureInvoice(number, status, issueDate, dueDate, items) {
  const existing = await db.query(
    `select id from public.invoices where organization_id = $1 and number = $2`,
    [orgId, number]
  );
  let invoiceId = existing.rows[0]?.id;
  if (!invoiceId) {
    const ins = await db.query(
      `insert into public.invoices (organization_id, customer_id, number, status, issue_date, due_date)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [orgId, customerId, number, status, issueDate, dueDate]
    );
    invoiceId = ins.rows[0].id;
    for (const item of items) {
      await db.query(
        `insert into public.invoice_items (invoice_id, description, quantity, unit_price)
         values ($1, $2, $3, $4)`,
        [invoiceId, item.description, item.quantity, item.unitPrice]
      );
    }
  } else {
    await db.query(`update public.invoices set status = $2, issue_date = $3 where id = $1`, [
      invoiceId,
      status,
      issueDate,
    ]);
  }
}

await ensureInvoice("INV-0002", "paid", "2026-07-10", "2026-08-10", [
  { description: "Retainer July", quantity: 1, unitPrice: 1800 },
]);
await ensureInvoice("INV-0003", "paid", "2026-08-12", "2026-09-12", [
  { description: "Retainer August", quantity: 1, unitPrice: 2200 },
]);
await ensureInvoice("INV-0004", "overdue", "2026-06-01", "2026-07-01", [
  { description: "Late fee", quantity: 1, unitPrice: 400 },
]);

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const results = { desktop: null, mobile: null };

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

  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector(".recharts-surface", { timeout: 15000 }).catch(() => {});
  results.desktop = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".rounded-xl.border.bg-white.p-3, .rounded-xl.border.bg-white.p-3.sm\\:p-4"));
    const kpis = Array.from(document.querySelectorAll(".grid > div")).map((el) => ({
      label: el.querySelector(".text-xs")?.textContent?.trim(),
      value: el.querySelector("p")?.textContent?.trim(),
      alert: el.querySelector("p")?.className.includes("text-red-600"),
    }));
    const bars = document.querySelectorAll(".recharts-bar-rectangle, .recharts-rectangle").length;
    return {
      heading: document.querySelector("h1")?.textContent,
      kpis,
      chartTitle: document.querySelector(".text-sm.font-medium")?.textContent,
      hasChart: !!document.querySelector(".recharts-surface"),
      bars,
      gridCols: getComputedStyle(document.querySelector(".grid")).gridTemplateColumns,
    };
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-dashboard.png" });

  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 800));
  results.mobile = await page.evaluate(() => ({
    gridCols: getComputedStyle(document.querySelector(".grid")).gridTemplateColumns,
    kpis: Array.from(document.querySelectorAll(".grid > div")).map((el) => ({
      label: el.querySelector(".text-xs")?.textContent?.trim(),
      value: el.querySelector("p")?.textContent?.trim(),
    })),
    hasChart: !!document.querySelector(".recharts-surface"),
  }));
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-dashboard-mobile.png" });
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

console.log(JSON.stringify(results, null, 2));
