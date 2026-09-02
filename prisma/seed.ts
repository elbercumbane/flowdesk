import 'dotenv/config'
import pg from 'pg'
import { PrismaClient } from '../lib/generated/prisma/client.ts'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL!.replace(/[?&]sslmode=[^&]+/g, '')
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}
function monthsAgo(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

async function main() {
  const org = await prisma.organization.findFirst()
  if (!org) throw new Error('No organization found — create one via onboarding first.')
  console.log(`Seeding data for organization: ${org.name} (${org.id})`)

  // limpa dados de negócio existentes desta organização (mantém org, memberships, profiles)
  await prisma.invoiceItem.deleteMany({ where: { invoice: { organizationId: org.id } } })
  await prisma.invoice.deleteMany({ where: { organizationId: org.id } })
  await prisma.task.deleteMany({ where: { organizationId: org.id } })
  await prisma.deal.deleteMany({ where: { organizationId: org.id } })
  await prisma.customer.deleteMany({ where: { organizationId: org.id } })
  await prisma.activityLog.deleteMany({ where: { organizationId: org.id } })
  console.log('Previous business data removed.')

  // ---------- CUSTOMERS ----------
  const customersData = [
    { name: 'Sarah Jennings', company: 'Acme Corp', email: 'sarah@acmecorp.com', phone: '+1 415 555 0132', status: 'active' },
    { name: 'Marcus Webb', company: 'Northwind Traders', email: 'marcus@northwind.io', phone: '+1 212 555 0187', status: 'active' },
    { name: 'Elena Popov', company: 'Flow Labs', email: 'elena@flowlabs.dev', phone: '+1 646 555 0110', status: 'active' },
    { name: 'David Chen', company: 'Horizon Media', email: 'david@horizonmedia.co', phone: '+1 305 555 0144', status: 'active' },
    { name: 'Priya Nair', company: 'Bluepeak Logistics', email: 'priya@bluepeak.com', phone: '+1 312 555 0198', status: 'lead' },
    { name: 'Tom Reilly', company: 'Coastal Ventures', email: 'tom@coastalventures.com', phone: '+1 617 555 0121', status: 'inactive' },
    { name: 'Nina Kowalski', company: 'Nimbus Software', email: 'nina@nimbussoft.com', phone: '+1 512 555 0165', status: 'active' },
    { name: 'James Okafor', company: 'Trailhead Consulting', email: 'james@trailhead.co', phone: '+1 720 555 0177', status: 'active' },
    { name: 'Laura Bianchi', company: 'Vertex Analytics', email: 'laura@vertexanalytics.io', phone: '+1 213 555 0155', status: 'lead' },
    { name: 'Ryan Foster', company: 'Solstice Design Studio', email: 'ryan@solsticedesign.co', phone: '+1 503 555 0142', status: 'active' },
    { name: 'Chloe Martin', company: 'Kaia Wellness', email: 'chloe@kaiawellness.com', phone: '+1 206 555 0190', status: 'inactive' },
    { name: 'Ahmed Hassan', company: 'Ridgeline Capital', email: 'ahmed@ridgelinecap.com', phone: '+1 917 555 0173', status: 'active' },
    { name: 'Sophie Turner', company: 'Meridian Freight', email: 'sophie@meridianfreight.com', phone: '+1 404 555 0161', status: 'lead' },
    { name: 'Lucas Meyer', company: 'Alto Coffee Co.', email: 'lucas@altocoffee.com', phone: '+1 415 555 0129', status: 'active' },
    { name: 'Grace Kim', company: 'Peakline Studio', email: 'grace@peaklinestudio.com', phone: '+1 646 555 0155', status: 'active' },
  ]

  const customers = await Promise.all(
    customersData.map((c) => prisma.customer.create({ data: { ...c, organizationId: org.id } }))
  )
  const cust = Object.fromEntries(customers.map((c) => [c.company, c]))
  console.log(`${customers.length} clientes criados.`)

  // ---------- DEALS ----------
  const dealsData = [
    { title: 'Website redesign', customer: 'Acme Corp', value: 8500, stage: 'lead' },
    { title: 'Brand identity refresh', customer: 'Solstice Design Studio', value: 6200, stage: 'lead' },
    { title: 'Mobile app MVP', customer: 'Flow Labs', value: 22000, stage: 'lead' },
    { title: 'SEO audit & strategy', customer: 'Vertex Analytics', value: 3400, stage: 'lead' },
    { title: 'Fleet tracking dashboard', customer: 'Bluepeak Logistics', value: 15800, stage: 'qualified' },
    { title: 'Customer portal build', customer: 'Northwind Traders', value: 18500, stage: 'qualified' },
    { title: 'Marketing site relaunch', customer: 'Horizon Media', value: 9200, stage: 'qualified' },
    { title: 'Loyalty program integration', customer: 'Alto Coffee Co.', value: 7100, stage: 'qualified' },
    { title: 'Internal tools revamp', customer: 'Trailhead Consulting', value: 12400, stage: 'qualified' },
    { title: 'E-commerce migration', customer: 'Meridian Freight', value: 26500, stage: 'proposal' },
    { title: 'Data pipeline automation', customer: 'Vertex Analytics', value: 19800, stage: 'proposal' },
    { title: 'Investor reporting portal', customer: 'Ridgeline Capital', value: 31000, stage: 'proposal' },
    { title: 'Booking system redesign', customer: 'Kaia Wellness', value: 8800, stage: 'proposal' },
    { title: 'Studio showcase site', customer: 'Peakline Studio', value: 5600, stage: 'proposal' },
    { title: 'Annual support retainer', customer: 'Acme Corp', value: 24000, stage: 'won' },
    { title: 'Landing page sprint', customer: 'Nimbus Software', value: 4200, stage: 'won' },
    { title: 'Analytics dashboard', customer: 'Trailhead Consulting', value: 13500, stage: 'won' },
    { title: 'API integration project', customer: 'Northwind Traders', value: 9700, stage: 'won' },
    { title: 'Rebrand — phase 1', customer: 'Coastal Ventures', value: 6800, stage: 'lost' },
    { title: 'Internal wiki setup', customer: 'Bluepeak Logistics', value: 2900, stage: 'lost' },
  ]

  const deals = await Promise.all(
    dealsData.map((d) =>
      prisma.deal.create({
        data: {
          organizationId: org.id,
          customerId: cust[d.customer].id,
          title: d.title,
          value: d.value,
          stage: d.stage as any,
        },
      })
    )
  )
  const deal = Object.fromEntries(deals.map((d) => [d.title, d]))
  console.log(`${deals.length} deals criados.`)

  // ---------- TASKS ----------
  const tasksData = [
    { title: 'Kickoff call', status: 'done', deal: 'Website redesign', dueDays: -12 },
    { title: 'Send discovery questionnaire', status: 'done', deal: 'Website redesign', dueDays: -10 },
    { title: 'Draft wireframes', status: 'in_progress', deal: 'Website redesign', dueDays: 5 },
    { title: 'Follow up on proposal', status: 'todo', deal: 'E-commerce migration', dueDays: -2 },
    { title: 'Prepare investor demo', status: 'in_progress', deal: 'Investor reporting portal', dueDays: 7 },
    { title: 'Review contract terms', status: 'todo', deal: 'Booking system redesign', dueDays: 3 },
    { title: 'Send onboarding docs', status: 'done', customer: 'Acme Corp', dueDays: -20 },
    { title: 'Quarterly check-in call', status: 'todo', customer: 'Acme Corp', dueDays: 14 },
    { title: 'Renew support contract', status: 'todo', customer: 'Nimbus Software', dueDays: 21 },
    { title: 'Collect testimonial', status: 'todo', customer: 'Trailhead Consulting', dueDays: -5 },
    { title: 'Schedule design review', status: 'in_progress', deal: 'Brand identity refresh', dueDays: 4 },
    { title: 'Finalize scope doc', status: 'done', deal: 'Mobile app MVP', dueDays: -8 },
    { title: 'Set up staging environment', status: 'todo', deal: 'Mobile app MVP', dueDays: 10 },
    { title: 'Audit current SEO rankings', status: 'in_progress', deal: 'SEO audit & strategy', dueDays: 6 },
    { title: 'Prepare fleet demo dataset', status: 'todo', deal: 'Fleet tracking dashboard', dueDays: 9 },
    { title: 'Client walkthrough call', status: 'done', deal: 'Customer portal build', dueDays: -6 },
    { title: 'Draft marketing site copy', status: 'todo', deal: 'Marketing site relaunch', dueDays: 12 },
    { title: 'Integrate loyalty API', status: 'in_progress', deal: 'Loyalty program integration', dueDays: 8 },
    { title: 'Internal tools requirements review', status: 'todo', deal: 'Internal tools revamp', dueDays: 15 },
    { title: 'Migrate product catalog', status: 'todo', deal: 'E-commerce migration', dueDays: 18 },
    { title: 'Set up automated reports', status: 'todo', deal: 'Data pipeline automation', dueDays: 11 },
    { title: 'Prepare studio portfolio assets', status: 'done', deal: 'Studio showcase site', dueDays: -3 },
    { title: 'Post-launch bug triage', status: 'todo', deal: 'Annual support retainer', dueDays: 2 },
    { title: 'Landing page A/B test setup', status: 'done', deal: 'Landing page sprint', dueDays: -15 },
    { title: 'Send analytics training video', status: 'done', deal: 'Analytics dashboard', dueDays: -18 },
    { title: 'API rate limit review', status: 'todo', deal: 'API integration project', dueDays: 6 },
    { title: 'Prepare monthly invoice batch', status: 'todo', dueDays: 4 },
    { title: 'Review freelancer contracts', status: 'todo', dueDays: 9 },
    { title: 'Update FlowDesk brand assets', status: 'in_progress', dueDays: 13 },
    { title: 'Team retro — Q3', status: 'todo', dueDays: 20 },
  ]

  await Promise.all(
    tasksData.map((t) =>
      prisma.task.create({
        data: {
          organizationId: org.id,
          title: t.title,
          status: t.status as any,
          dealId: t.deal ? deal[t.deal].id : null,
          customerId: t.customer ? cust[t.customer].id : t.deal ? deal[t.deal].customerId : null,
          dueDate: t.dueDays !== undefined ? daysFromNow(t.dueDays) : null,
        },
      })
    )
  )
  console.log(`${tasksData.length} tarefas criadas.`)

  // ---------- INVOICES ----------
  const invoicesData = [
    {
      number: 'INV-1001', customer: 'Acme Corp', deal: 'Annual support retainer', status: 'paid', issuedMonthsAgo: 5,
      items: [{ description: 'Annual support retainer — Q1', quantity: 1, unitPrice: 6000 }],
    },
    {
      number: 'INV-1002', customer: 'Nimbus Software', deal: 'Landing page sprint', status: 'paid', issuedMonthsAgo: 4,
      items: [
        { description: 'Landing page design', quantity: 1, unitPrice: 1800 },
        { description: 'Copywriting', quantity: 1, unitPrice: 900 },
        { description: 'A/B testing setup', quantity: 1, unitPrice: 1500 },
      ],
    },
    {
      number: 'INV-1003', customer: 'Trailhead Consulting', deal: 'Analytics dashboard', status: 'paid', issuedMonthsAgo: 3,
      items: [
        { description: 'Dashboard development', quantity: 40, unitPrice: 85 },
        { description: 'Data source integration', quantity: 12, unitPrice: 95 },
      ],
    },
    {
      number: 'INV-1004', customer: 'Northwind Traders', deal: 'API integration project', status: 'paid', issuedMonthsAgo: 2,
      items: [
        { description: 'API integration — phase 1', quantity: 1, unitPrice: 5500 },
        { description: 'Testing & QA', quantity: 20, unitPrice: 60 },
      ],
    },
    {
      number: 'INV-1005', customer: 'Acme Corp', deal: 'Annual support retainer', status: 'paid', issuedMonthsAgo: 1,
      items: [{ description: 'Annual support retainer — Q2', quantity: 1, unitPrice: 6000 }],
    },
    {
      number: 'INV-1006', customer: 'Peakline Studio', status: 'sent', issuedMonthsAgo: 1,
      items: [
        { description: 'Portfolio site — design', quantity: 1, unitPrice: 2200 },
        { description: 'CMS setup', quantity: 1, unitPrice: 800 },
      ],
    },
    {
      number: 'INV-1007', customer: 'Kaia Wellness', deal: 'Booking system redesign', status: 'sent', issuedMonthsAgo: 0,
      items: [{ description: 'Booking system — deposit', quantity: 1, unitPrice: 3000 }],
    },
    {
      number: 'INV-1008', customer: 'Ridgeline Capital', deal: 'Investor reporting portal', status: 'overdue', issuedMonthsAgo: 2,
      items: [
        { description: 'Portal development — milestone 1', quantity: 1, unitPrice: 9500 },
        { description: 'Design system setup', quantity: 1, unitPrice: 2800 },
      ],
    },
    {
      number: 'INV-1009', customer: 'Flow Labs', deal: 'Mobile app MVP', status: 'draft', issuedMonthsAgo: 0,
      items: [{ description: 'Mobile app MVP — deposit', quantity: 1, unitPrice: 7000 }],
    },
    {
      number: 'INV-1010', customer: 'Bluepeak Logistics', deal: 'Fleet tracking dashboard', status: 'draft', issuedMonthsAgo: 0,
      items: [{ description: 'Discovery & scoping', quantity: 1, unitPrice: 1500 }],
    },
  ]

  for (const inv of invoicesData) {
    const issueDate = monthsAgo(inv.issuedMonthsAgo)
    const dueDate = new Date(issueDate)
    dueDate.setDate(dueDate.getDate() + 30)

    await prisma.invoice.create({
      data: {
        organizationId: org.id,
        customerId: cust[inv.customer].id,
        dealId: inv.deal ? deal[inv.deal].id : null,
        number: inv.number,
        status: inv.status as any,
        issueDate,
        dueDate: inv.status === 'overdue' ? daysAgo(10) : dueDate,
        items: { create: inv.items },
      },
    })
  }
  console.log(`${invoicesData.length} invoices created.`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
