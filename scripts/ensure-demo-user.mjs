import { config } from 'dotenv'
import pg from 'pg'

config({ path: '.env.local' })
config({ path: '.env' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const service = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.DEMO_EMAIL
const password = process.env.DEMO_PASSWORD
const connectionString = process.env.DATABASE_URL?.replace(/[?&]sslmode=[^&]+/g, '')

if (!url || !service || !email || !password || !connectionString) {
  console.error('Faltam DEMO_EMAIL, DEMO_PASSWORD ou chaves do Supabase.')
  process.exit(1)
}

async function admin(path, { method = 'POST', body } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: service,
      Authorization: `Bearer ${service}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`)
  return json
}

const db = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } })
await db.connect()

let userId
const existing = await db.query(`select id::text as id from auth.users where email = $1`, [email])
if (existing.rowCount) {
  userId = existing.rows[0].id
  await admin(`/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    body: { password, email_confirm: true },
  })
} else {
  const created = await admin('/auth/v1/admin/users', {
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'Demo Catalog' },
    },
  })
  userId = created.id
}

await db.query(
  `insert into public.profiles (id, full_name, email)
   values ($1, $2, $3)
   on conflict (id) do update set email = excluded.email, full_name = excluded.full_name`,
  [String(userId), 'Demo Catalog', email]
)

const org = await db.query(`select id, name, slug from public.organizations where slug = 'flow1' limit 1`)
if (!org.rowCount) {
  await db.end()
  throw new Error('Organização flow1 não encontrada.')
}

await db.query(
  `insert into public.memberships (organization_id, user_id, role)
   values ($1, $2, 'owner')
   on conflict do nothing`,
  [org.rows[0].id, String(userId)]
)

const customers = await db.query(
  `select count(*)::int as n from public.customers where organization_id = $1`,
  [org.rows[0].id]
)

await db.end()
console.log(
  JSON.stringify({
    email,
    org: org.rows[0].name,
    slug: org.rows[0].slug,
    customers: customers.rows[0].n,
    ok: true,
  })
)
