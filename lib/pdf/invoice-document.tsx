import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#18181B' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  brand: { fontSize: 16, fontWeight: 700, color: '#4F46E5' },
  invoiceNumber: { fontSize: 14, fontWeight: 700 },
  section: { marginBottom: 16 },
  label: { fontSize: 8, color: '#71717A', marginBottom: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  table: { marginTop: 12, borderTop: '1px solid #E4E4E7' },
  tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottom: '1px solid #E4E4E7' },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderBottom: '0.5px solid #F0F0F0' },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colSubtotal: { flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, paddingTop: 8, borderTop: '1px solid #18181B' },
  totalLabel: { fontSize: 11, marginRight: 8 },
  totalValue: { fontSize: 13, fontWeight: 700 },
})

type InvoicePdfProps = {
  orgName: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  customerName: string
  customerEmail?: string | null
  notes?: string | null
  items: { description: string; quantity: number; unitPrice: number }[]
}

export function InvoiceDocument({
  orgName,
  number,
  status,
  issueDate,
  dueDate,
  customerName,
  customerEmail,
  notes,
  items,
}: InvoicePdfProps) {
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{orgName}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceNumber}>{number}</Text>
            <Text style={{ fontSize: 9, color: '#71717A', marginTop: 2, textTransform: 'uppercase' }}>{status}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>BILLED TO</Text>
            <Text>{customerName}</Text>
            {customerEmail && <Text style={{ color: '#71717A' }}>{customerEmail}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>ISSUE DATE</Text>
            <Text>{issueDate}</Text>
            <Text style={[styles.label, { marginTop: 6 }]}>DUE DATE</Text>
            <Text>{dueDate}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, { color: '#71717A' }]}>Description</Text>
            <Text style={[styles.colQty, { color: '#71717A' }]}>Qty</Text>
            <Text style={[styles.colPrice, { color: '#71717A' }]}>Price</Text>
            <Text style={[styles.colSubtotal, { color: '#71717A' }]}>Subtotal</Text>
          </View>
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.colSubtotal}>${(item.quantity * item.unitPrice).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        {notes && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>NOTES</Text>
            <Text style={{ color: '#3F3F46' }}>{notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
