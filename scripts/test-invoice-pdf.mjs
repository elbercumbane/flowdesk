import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";
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
const email = `invoices.pdf.${Date.now()}@gmail.com`;
const password = "InvoicesPdfTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Invoices PDF" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name) values ($1, $2) on conflict (id) do nothing`,
  [String(userId), "Invoices PDF"]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [org.rows[0].id, userId]
);
const inv = await db.query(`select id from public.invoices where number = 'INV-0001' limit 1`);
const invoiceId = inv.rows[0].id;

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const results = { detail: null, pdf: {}, mobile: null };

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

  await page.goto(`http://localhost:3000/app/invoices/${invoiceId}`, {
    waitUntil: "networkidle0",
    timeout: 30000,
  });
  results.detail = await page.evaluate(() => ({
    url: location.href,
    title: document.querySelector("h1")?.textContent,
    body: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 800),
    pdfHref: document.querySelector("a[href*='/pdf']")?.getAttribute("href"),
  }));
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoice-detail.png" });

  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoice-detail-mobile.png" });
  await page.setViewport({ width: 1280, height: 800 });

  const cookies = await page.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const pdfRes = await fetch(`http://localhost:3000/api/invoices/${invoiceId}/pdf`, {
    headers: { cookie: cookieHeader },
  });
  const buf = Buffer.from(await pdfRes.arrayBuffer());
  const pdfPath = process.env.TEMP + "/flowdesk-INV-0001.pdf";
  writeFileSync(pdfPath, buf);
  results.pdf = {
    status: pdfRes.status,
    contentType: pdfRes.headers.get("content-type"),
    disposition: pdfRes.headers.get("content-disposition"),
    bytes: buf.length,
    magic: buf.subarray(0, 8).toString("latin1"),
    saved: pdfPath,
  };

  const pdfPage = await browser.newPage();
  await pdfPage.goto(`file:///${pdfPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1500));
  await pdfPage.screenshot({ path: process.env.TEMP + "/flowdesk-invoice-pdf.png" });
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
