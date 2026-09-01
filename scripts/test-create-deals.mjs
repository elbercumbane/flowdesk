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
const email = `deals.new.${Date.now()}@gmail.com`;
const password = "DealsNewTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Deals Creator" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name) values ($1, $2) on conflict (id) do nothing`,
  [String(userId), "Deals Creator"]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [org.rows[0].id, userId]
);

const samples = [
  { title: "Website revamp", customer: "Ana Silva", value: "5000", stage: "lead" },
  { title: "Support contract", customer: "Bruno Costa", value: "12000", stage: "qualified" },
  { title: "Brand redesign", customer: "Diogo Reis", value: "8500", stage: "proposal" },
  { title: "Annual license", customer: "Ana Silva", value: "24000", stage: "won" },
  { title: "Old pitch", customer: "Bruno Costa", value: "3000", stage: "lost" },
  { title: "Mobile app", customer: "Diogo Reis", value: "15000", stage: "lead" },
];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const results = { created: [], kanban: {}, drag: {}, dropdown: {}, table: [] };

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

  for (const sample of samples) {
    await page.goto("http://localhost:3000/app/deals/new", { waitUntil: "networkidle0" });
    await page.type("#title", sample.title);
    await page.select(
      "#customerId",
      await page.$eval("#customerId", (sel, name) => {
        const opt = Array.from(sel.options).find((o) => o.textContent.trim() === name);
        return opt?.value ?? "";
      }, sample.customer)
    );
    await page.type("#value", sample.value);
    await page.select("#stage", sample.stage);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    const err = await page.$eval("p.text-red-600", (el) => el.textContent).catch(() => null);
    results.created.push({ title: sample.title, url: page.url(), error: err });
  }

  await page.goto("http://localhost:3000/app/deals", { waitUntil: "networkidle0" });
  results.kanban = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll(".shrink-0"));
    const out = {};
    for (const col of cols) {
      const label = col.querySelector(".font-medium")?.textContent?.trim();
      const titles = Array.from(col.querySelectorAll("[draggable='true']")).map(
        (card) => card.querySelector("p.font-medium")?.textContent?.trim()
      );
      if (label) out[label] = titles;
    }
    return out;
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-deals-kanban.png" });

  results.drag.before = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Website revamp")
    );
    const col = card?.closest(".shrink-0");
    return col?.querySelector(".font-medium")?.textContent?.trim();
  });

  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Website revamp")
    );
    const targetCol = Array.from(document.querySelectorAll(".shrink-0")).find((col) =>
      col.querySelector(".font-medium")?.textContent?.includes("Qualified")
    );
    if (!card || !targetCol) throw new Error("drag source/target missing");
    const dealId = card.getAttribute("data-deal-id");
    const dt = {
      dropEffect: "move",
      effectAllowed: "all",
      files: [],
      items: [],
      types: ["dealId"],
      setData() {},
      clearData() {},
      getData(type) {
        return type === "dealId" ? dealId : "";
      },
    };
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: dt });
    targetCol.dispatchEvent(new Event("dragover", { bubbles: true, cancelable: true }));
    targetCol.dispatchEvent(drop);
  });
  await new Promise((r) => setTimeout(r, 800));
  results.drag.afterOptimistic = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Website revamp")
    );
    return card?.closest(".shrink-0")?.querySelector(".font-medium")?.textContent?.trim();
  });

  await page.reload({ waitUntil: "networkidle0" });
  results.drag.afterRefresh = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Website revamp")
    );
    return card?.closest(".shrink-0")?.querySelector(".font-medium")?.textContent?.trim();
  });

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.reload({ waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Mobile app")
    );
    const select = card?.querySelector("select");
    if (!select) throw new Error("select missing");
    select.value = "proposal";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 800));
  results.dropdown.afterOptimistic = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Mobile app")
    );
    return card?.closest(".shrink-0")?.querySelector(".font-medium")?.textContent?.trim();
  });
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-deals-mobile.png" });
  await page.reload({ waitUntil: "networkidle0" });
  results.dropdown.afterRefresh = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll("[draggable='true']")).find((el) =>
      el.textContent.includes("Mobile app")
    );
    return card?.closest(".shrink-0")?.querySelector(".font-medium")?.textContent?.trim();
  });

  await page.setViewport({ width: 1280, height: 800 });
  await page.reload({ waitUntil: "networkidle0" });
  await page.click('[aria-label="Vista tabela"]');
  results.table = await page.$$eval("table tbody tr", (rows) =>
    rows.map((row) => Array.from(row.querySelectorAll("td")).map((td) => td.textContent.trim()))
  );
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-deals-table.png" });
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
  const r = await c.query(`select title, stage, value::text from public.deals order by created_at`);
  await c.end();
  return r.rows;
})();

console.log(JSON.stringify({ results, leftover }, null, 2));
