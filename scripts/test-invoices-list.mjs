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
const email = `invoices.list.${Date.now()}@gmail.com`;
const password = "InvoicesListTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Invoices Lister" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name) values ($1, $2) on conflict (id) do nothing`,
  [String(userId), "Invoices Lister"]
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

const results = { desktop: null, status: {}, mobile: null, db: null };

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

  await page.goto("http://localhost:3000/app/invoices", { waitUntil: "networkidle0", timeout: 30000 });
  results.desktop = await page.evaluate(() => {
    const err = document.querySelector("p.text-red-600, .text-red-600")?.textContent?.trim();
    const rows = Array.from(document.querySelectorAll("table tbody tr")).map((row) => {
      const cells = Array.from(row.querySelectorAll("td")).map((td) => td.textContent.replace(/\s+/g, " ").trim());
      const select = row.querySelector("select");
      return { cells, status: select?.value ?? null };
    });
    return { err, rows, heading: document.querySelector("h1")?.textContent };
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoices-list.png" });

  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("table tbody tr")).find((r) =>
      r.textContent.includes("INV-0001")
    );
    const select = row?.querySelector("select");
    if (!select) throw new Error("status select missing");
    select.value = "sent";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 1200));
  results.status.afterOptimistic = await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("table tbody tr")).find((r) =>
      r.textContent.includes("INV-0001")
    );
    return row?.querySelector("select")?.value;
  });

  await page.reload({ waitUntil: "networkidle0" });
  results.status.afterRefresh = await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("table tbody tr")).find((r) =>
      r.textContent.includes("INV-0001")
    );
    return row?.querySelector("select")?.value;
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoices-sent.png" });

  await page.setViewport({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle0" });
  results.mobile = await page.evaluate(() => {
    const tableHidden = getComputedStyle(document.querySelector(".hidden.md\\:block") || document.querySelector("table")?.closest("div")).display === "none";
    const cards = Array.from(document.querySelectorAll("a.rounded-xl")).map((card) => ({
      text: card.textContent.replace(/\s+/g, " ").trim(),
    }));
    return { tableHidden, cards };
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoices-mobile.png" });
} finally {
  await browser.close();
  results.db = (
    await db.query(`select number, status from public.invoices where number = 'INV-0001'`)
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
