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
const email = `tasks.new.${Date.now()}@gmail.com`;
const password = "TasksNewTest2026!";
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
  body: { email, password, email_confirm: true, user_metadata: { full_name: "Tasks Creator" } },
});
const userId = created.id;
for (let i = 0; i < 10; i++) {
  const p = await db.query(`select id from public.profiles where id = $1`, [String(userId)]);
  if (p.rowCount) break;
  await new Promise((r) => setTimeout(r, 300));
}
await db.query(
  `insert into public.profiles (id, full_name) values ($1, $2) on conflict (id) do nothing`,
  [String(userId), "Tasks Creator"]
);
const org = await db.query(`select id from public.organizations where slug = 'flow1' limit 1`);
await db.query(
  `insert into public.memberships (organization_id, user_id, role) values ($1, $2, 'owner')`,
  [org.rows[0].id, userId]
);

const samples = [
  { title: "Enviar proposta", deal: "Website revamp", customer: "Ana Silva", dueDate: "2026-09-15" },
  { title: "Call follow-up", deal: "Support contract", customer: "", dueDate: "2026-10-01" },
  { title: "Preparar apresentação mensal", deal: "", customer: "", dueDate: "" },
  { title: "Recolher feedback", deal: "", customer: "Bruno Costa", dueDate: "" },
  { title: "Fechar contrato", deal: "Annual license", customer: "Ana Silva", dueDate: "2026-08-01" },
  { title: "Kickoff call", deal: "Mobile app", customer: "Diogo Reis", dueDate: "2026-12-31" },
];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars"],
});

const results = {
  empty: null,
  created: [],
  list: [],
  filters: {},
  checkbox: {},
  select: {},
  overdue: {},
  mobile: {},
};

async function selectByLabel(page, selector, label) {
  if (!label) {
    await page.select(selector, "");
    return;
  }
  const value = await page.$eval(
    selector,
    (sel, name) => {
      const opt = Array.from(sel.options).find((o) => o.textContent.trim() === name);
      return opt?.value ?? "";
    },
    label
  );
  await page.select(selector, value);
}

async function taskCards(page) {
  return page.evaluate(() => {
    return Array.from(document.querySelectorAll("input[type='checkbox']")).map((input) => {
      const row = input.closest(".flex.items-center");
      const title = row?.querySelector("p.font-medium")?.textContent?.trim();
      const meta = row?.querySelector(".text-xs")?.textContent?.replace(/\s+/g, " ").trim();
      const overdue = !!row?.querySelector(".text-red-600");
      const done = input.checked;
      const struck = row?.querySelector("p.font-medium")?.className.includes("line-through");
      const select = row?.querySelector("select");
      return {
        title,
        meta,
        overdue,
        done,
        struck,
        status: select?.value ?? null,
        selectVisible: select ? getComputedStyle(select).display !== "none" : false,
      };
    });
  });
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

  await page.goto("http://localhost:3000/app/tasks", { waitUntil: "networkidle0", timeout: 30000 });
  results.empty = await page.$eval("p.text-zinc-500", (el) => el.textContent?.trim()).catch(() => null);
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-tasks-empty.png" });

  for (const sample of samples) {
    await page.goto("http://localhost:3000/app/tasks/new", { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#title");
    await page.type("#title", sample.title);
    await selectByLabel(page, "#dealId", sample.deal);
    await selectByLabel(page, "#customerId", sample.customer);
    if (sample.dueDate) {
      await page.$eval("#dueDate", (el, v) => {
        el.value = v;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }, sample.dueDate);
    }
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0", timeout: 20000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    const err = await page.$eval("p.text-red-600", (el) => el.textContent).catch(() => null);
    results.created.push({ title: sample.title, url: page.url(), error: err });
  }

  await page.goto("http://localhost:3000/app/tasks", { waitUntil: "networkidle0" });
  results.list = await taskCards(page);
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-tasks-list.png" });

  async function clickFilter(label) {
    await page.evaluate((text) => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) => b.textContent.trim() === text);
      btn?.click();
    }, label);
    await new Promise((r) => setTimeout(r, 200));
  }

  await clickFilter("To do");
  results.filters.todo = (await taskCards(page)).map((t) => t.title);
  await clickFilter("In progress");
  results.filters.inProgressEmpty = await page.$eval("p.text-zinc-500", (el) => el.textContent?.trim()).catch(() => null);
  await clickFilter("Done");
  results.filters.doneEmpty = await page.$eval("p.text-zinc-500", (el) => el.textContent?.trim()).catch(() => null);
  await clickFilter("Todas");
  results.filters.all = (await taskCards(page)).map((t) => t.title);

  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("p.font-medium")).find((p) =>
      p.textContent.includes("Enviar proposta")
    )?.closest(".flex.items-center");
    row?.querySelector("input[type='checkbox']")?.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  results.checkbox.afterOptimistic = (await taskCards(page)).find((t) => t.title === "Enviar proposta");
  await page.reload({ waitUntil: "networkidle0" });
  results.checkbox.afterRefresh = (await taskCards(page)).find((t) => t.title === "Enviar proposta");

  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("p.font-medium")).find((p) =>
      p.textContent.includes("Call follow-up")
    )?.closest(".flex.items-center");
    const select = row?.querySelector("select");
    if (!select) throw new Error("status select missing");
    select.value = "in_progress";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 800));
  results.select.afterOptimistic = (await taskCards(page)).find((t) => t.title === "Call follow-up");
  await page.reload({ waitUntil: "networkidle0" });
  results.select.afterRefresh = (await taskCards(page)).find((t) => t.title === "Call follow-up");

  results.overdue = (await taskCards(page)).find((t) => t.title === "Fechar contrato");
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-tasks-after.png" });

  await clickFilter("To do");
  results.filters.todoAfter = (await taskCards(page)).map((t) => t.title);
  await clickFilter("In progress");
  results.filters.inProgressAfter = (await taskCards(page)).map((t) => t.title);
  await clickFilter("Done");
  results.filters.doneAfter = (await taskCards(page)).map((t) => t.title);

  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:3000/app/tasks", { waitUntil: "networkidle0" });
  results.mobile.selectHidden = await page.evaluate(() => {
    const select = document.querySelector("select");
    return !select || getComputedStyle(select).display === "none";
  });
  await page.evaluate(() => {
    const row = Array.from(document.querySelectorAll("p.font-medium")).find((p) =>
      p.textContent.includes("Kickoff call")
    )?.closest(".flex.items-center");
    row?.querySelector("input[type='checkbox']")?.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  results.mobile.checkbox = (await taskCards(page)).find((t) => t.title === "Kickoff call");
  await page.screenshot({ path: process.env.TEMP + "/flowdesk-tasks-mobile.png" });
  await page.reload({ waitUntil: "networkidle0" });
  results.mobile.afterRefresh = (await taskCards(page)).find((t) => t.title === "Kickoff call");
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
  const r = await c.query(`
    select t.title, t.status, t.due_date::text, d.title as deal, cu.name as customer
    from public.tasks t
    left join public.deals d on d.id = t.deal_id
    left join public.customers cu on cu.id = t.customer_id
    order by t.created_at
  `);
  await c.end();
  return r.rows;
})();

console.log(JSON.stringify({ results, leftover }, null, 2));
