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
const email = `invoices.new.${Date.now()}@gmail.com`;
const password = "InvoicesNewTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Invoices Creator" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name) values ($1, $2) on conflict (id) do nothing`,
  [String(userId), "Invoices Creator"]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [org.rows[0].id, userId]
);
await db.query(`notify pgrst, 'reload schema'`);

const fn = await db.query(`
  select prosecdef as security_definer, provolatile
  from pg_proc
  where proname = 'create_invoice_with_items'
`);

const lines = [
  { description: "Website design", quantity: "1", unitPrice: "2500" },
  { description: "Hosting (12 months)", quantity: "12", unitPrice: "50" },
  { description: "Extra hours", quantity: "8", unitPrice: "75" },
];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const results = {
  rpc: fn.rows[0],
  suggestedNumber: null,
  validationError: null,
  lineCount: null,
  total: null,
  subtotals: [],
  created: {},
};

async function setInput(el, value) {
  await el.click({ clickCount: 3 });
  await el.type(value);
}

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

  await page.goto("http://localhost:3000/app/invoices/new", { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector("#number");
  results.suggestedNumber = await page.$eval("#number", (el) => el.value);

  await page.click('button[type="submit"]');
  await new Promise((r) => setTimeout(r, 300));
  results.validationError = await page.$eval("p.text-red-600", (el) => el.textContent).catch(() => null);

  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent.includes("Adicionar linha")
    );
    addBtn?.click();
    addBtn?.click();
  });

  await page.select(
    "#customerId",
    await page.$eval("#customerId", (sel) => {
      const opt = Array.from(sel.options).find((o) => o.textContent.trim() === "Ana Silva");
      return opt?.value ?? "";
    })
  );
  await page.select(
    "#dealId",
    await page.$eval("#dealId", (sel) => {
      const opt = Array.from(sel.options).find((o) => o.textContent.trim() === "Website revamp");
      return opt?.value ?? "";
    })
  );
  await page.evaluate(() => {
    const el = document.getElementById("dueDate");
    const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    desc.set.call(el, "2026-10-15");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.type("#notes", "Primeira factura de teste");

  const descInputs = await page.$$('input[placeholder="Descrição"]');
  const numberInputs = await page.$$('input[type="number"]');
  for (let i = 0; i < lines.length; i++) {
    await setInput(descInputs[i], lines[i].description);
    await setInput(numberInputs[i * 2], lines[i].quantity);
    await setInput(numberInputs[i * 2 + 1], lines[i].unitPrice);
  }

  results.lineCount = descInputs.length;
  results.subtotals = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".text-zinc-600")).map((el) => el.textContent.trim()).filter((t) => t.startsWith("$"))
  );
  results.total = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll("span"));
    const totalLabel = labels.find((s) => s.textContent.includes("Total:"));
    return totalLabel?.nextElementSibling?.textContent?.trim();
  });

  results.formReady = await page.evaluate(() => {
    const form = document.querySelector("form");
    return {
      dueDate: document.getElementById("dueDate")?.value,
      number: document.getElementById("number")?.value,
      valid: form?.checkValidity(),
    };
  });

  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoice-form.png" });
  await page.setViewport({ width: 390, height: 900 });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-invoice-form-mobile.png" });
  await page.setViewport({ width: 1280, height: 800 });

  const posts = [];
  const consoles = [];
  page.on("request", (req) => {
    if (req.method() === "POST") posts.push(req.url());
  });
  page.on("console", (msg) => consoles.push(`${msg.type()}: ${msg.text()}`));
  page.on("pageerror", (err) => consoles.push(`pageerror: ${err.message}`));

  await page.evaluate(() => {
    document.querySelector("button[type='submit']")?.scrollIntoView({ block: "center" });
    document.querySelector("form")?.requestSubmit();
  });
  await page.waitForFunction(
    () =>
      location.pathname !== "/app/invoices/new" ||
      document.querySelector("p.text-red-600") ||
      document.querySelector("button[type='submit']")?.textContent?.includes("A criar"),
    { timeout: 20000 }
  ).catch(() => {});
  await new Promise((r) => setTimeout(r, 3000));
  results.created = {
    url: page.url(),
    error: await page.$eval("p.text-red-600", (el) => el.textContent).catch(() => null),
    submitLabel: await page.$eval("button[type='submit']", (el) => el.textContent).catch(() => null),
    posts,
    consoles: consoles.slice(0, 20),
    dueDateAfter: await page.$eval("#dueDate", (el) => el.value).catch(() => null),
  };
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

const leftover = await (async () => {
  const c = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const invoices = await c.query(`
    select i.number, i.status, i.due_date::date::text, i.notes, c.name as customer, d.title as deal
    from public.invoices i
    join public.customers c on c.id = i.customer_id
    left join public.deals d on d.id = i.deal_id
    order by i.created_at
  `);
  const items = await c.query(`
    select i.number, it.description, it.quantity::text, it.unit_price::text,
           (it.quantity * it.unit_price)::text as subtotal
    from public.invoice_items it
    join public.invoices i on i.id = it.invoice_id
    order by i.number, it.description
  `);
  const totals = await c.query(`
    select i.number, sum(it.quantity * it.unit_price)::text as total, count(*)::int as lines
    from public.invoices i
    join public.invoice_items it on it.invoice_id = i.id
    group by i.number
  `);
  await c.end();
  return { invoices: invoices.rows, items: items.rows, totals: totals.rows };
})();

console.log(JSON.stringify({ results, leftover }, null, 2));
