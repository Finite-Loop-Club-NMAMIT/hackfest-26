import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/NotoSans.ttf"),
      fontWeight: "normal",
    },
  ],
});

Font.register({
  family: "NotoSans-Bold",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
  },
  headerBar: {
    backgroundColor: "#4a86e8",
    height: 12,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  orgName: {
    fontSize: 14,
    color: "#000",
    fontFamily: "NotoSans-Bold",
    fontWeight: "bold",
    marginBottom: 4,
  },
  orgSub: {
    fontSize: 9,
    color: "#555",
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 28,
    color: "#aaa",
    textAlign: "center",
    marginRight: 26,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    alignItems: "flex-end",
    flex: 1,
  },
  metaBox: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: "NotoSans-Bold",
    color: "#1f3864",
    borderBottomWidth: 1,
    borderBottomColor: "#bfbfbf",
    paddingBottom: 2,
    marginBottom: 2,
    width: 160,
    textAlign: "center",
  },
  metaValue: {
    fontSize: 9,
    textAlign: "center",
    width: 160,
    marginBottom: 6,
  },
  billSection: {
    marginBottom: 20,
  },
  billLabel: {
    fontSize: 9,
    fontFamily: "NotoSans-Bold",
    color: "#1f3864",
    borderBottomWidth: 1,
    borderBottomColor: "#bfbfbf",
    paddingBottom: 3,
    marginBottom: 8,
    width: 160,
  },
  billText: {
    fontSize: 10,
    marginBottom: 3,
    color: "#000",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4a86e8",
    padding: 6,
  },
  tableHeaderText: {
    color: "#fff",
    fontFamily: "NotoSans-Bold",
    fontSize: 9,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    padding: 6,
  },
  tableCell: {
    fontSize: 9,
    textAlign: "center",
  },
  col1: { flex: 3 },
  col2: { flex: 1 },
  col3: { flex: 1 },
  col4: { flex: 1 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "NotoSans-Bold",
    color: "#333",
    marginRight: 16,
  },
  totalValue: {
    fontSize: 14,
    fontFamily: "NotoSans-Bold",
    backgroundColor: "#c9daf8",
    padding: "4 12",
    color: "#000",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signBlock: {
    alignItems: "flex-start",
    width: 160,
  },
  signatureImage: {
    width: 80,
    height: 40,
    marginBottom: 2,
    objectFit: "contain",
  },
  signLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    width: 140,
    marginBottom: 4,
  },
  signName: {
    fontSize: 9,
    fontFamily: "NotoSans-Bold",
  },
  signRole: {
    fontSize: 9,
    color: "#555",
  },
  footerBar: {
    backgroundColor: "#4a86e8",
    height: 12,
    marginTop: 30,
  },
  paymentInfo: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  paymentInfoText: {
    fontSize: 9,
    color: "#333",
    marginBottom: 3,
    textAlign: "right",
  },
  paymentInfoLabel: {
    fontSize: 9,
    fontFamily: "NotoSans-Bold",
    color: "#1f3864",
  },
  paidSeal: {
    position: "absolute",
    bottom: 260,
    right: 218,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    transform: "rotate(-20deg)",
    opacity: 0.85,
  },
  paidSealInner: {
    borderWidth: 2,
    borderColor: "#16a34a",
    borderRadius: 40,
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  paidSealText: {
    fontSize: 22,
    fontFamily: "NotoSans-Bold",
    color: "#16a34a",
    letterSpacing: 2,
  },
  paidSealSub: {
    fontSize: 7,
    fontFamily: "NotoSans-Bold",
    color: "#16a34a",
    letterSpacing: 1,
  },
});

interface InvoicePDFProps {
  invoiceNo: string;
  date: string;
  teamName: string;
  leaderName: string;
  collegeName: string;
  phone: string;
  email: string;
  memberCount: number;
  unitPrice: number;
  transactionId: string;
  // Image paths — pass absolute paths or base64 strings
  logoUrl: string;
  nandanSignUrl: string;
  shashankSignUrl: string;
}

export function InvoicePDF({
  invoiceNo,
  date,
  teamName,
  leaderName,
  collegeName,
  phone,
  email,
  memberCount,
  unitPrice,
  transactionId,
  logoUrl,
  nandanSignUrl,
  shashankSignUrl,
}: InvoicePDFProps) {
  const total = memberCount * unitPrice;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top bar */}
        <View style={styles.headerBar} />

        {/* Header */}

        <View style={styles.headerRow}>
          {/* Left */}
          <View style={styles.leftSection}>
            <View style={styles.logoRow}>
              <Image src={logoUrl} style={styles.logo} />
              <View>
                <Text style={styles.orgName}>FINITE LOOP CLUB</Text>
                <Text style={styles.orgSub}>NMAM Institute of Technology</Text>
                <Text style={styles.orgSub}>
                  Nitte, SH1, Karkala, Karnataka - 574110
                </Text>
              </View>
            </View>
          </View>

          {/* Right */}
          <View style={styles.rightSection}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            {/* ← add this style */}
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{date}</Text>
              <Text style={styles.metaLabel}>INVOICE NO.</Text>
              <Text style={styles.metaValue}>{invoiceNo}</Text>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billSection}>
          <Text style={styles.billLabel}>BILL TO</Text>
          <Text style={styles.billText}>{leaderName}</Text>
          <Text style={styles.billText}>{teamName}</Text>
          <Text style={styles.billText}>{collegeName}</Text>
          <Text style={styles.billText}>{phone}</Text>
          <Text style={styles.billText}>{email}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.col1]}>
              DESCRIPTION
            </Text>
            <Text style={[styles.tableHeaderText, styles.col2]}>QTY</Text>
            <Text style={[styles.tableHeaderText, styles.col3]}>
              UNIT PRICE
            </Text>
            <Text style={[styles.tableHeaderText, styles.col4]}>TOTAL</Text>
          </View>
          <View style={styles.tableRow}>
            <Text
              style={[styles.tableCell, styles.col1, { textAlign: "left" }]}
            >
              Hackfest '26 Registration Fee
            </Text>
            <Text style={[styles.tableCell, styles.col2]}>{memberCount}</Text>
            <Text style={[styles.tableCell, styles.col3]}>₹{unitPrice}.00</Text>
            <Text style={[styles.tableCell, styles.col4]}>₹{total}.00</Text>
          </View>
        </View>

        {/* Grand Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total</Text>
          <Text style={styles.totalValue}>
            ₹{total.toLocaleString("en-IN")}.00
          </Text>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentInfoText}>
            <Text style={styles.paymentInfoLabel}>Payment Method: </Text>
            UPI
          </Text>
          <Text style={styles.paymentInfoText}>
            <Text style={styles.paymentInfoLabel}>Transaction ID: </Text>
            {transactionId !== "N/A" ? transactionId : "—"}
          </Text>
        </View>
        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signBlock}>
            <Image src={nandanSignUrl} style={styles.signatureImage} />
            <View style={styles.signLine} />
            <Text style={styles.signName}>Mr. Nandan R Pai</Text>
            <Text style={styles.signRole}>Organiser - Hackfest '26</Text>
          </View>
          <View style={styles.signBlock}>
            <Image src={shashankSignUrl} style={styles.signatureImage} />
            <View style={styles.signLine} />
            <Text style={styles.signName}>Dr. Shashank Shetty</Text>
            <Text style={styles.signRole}>
              Faculty Coordinator - Hackfest '26
            </Text>
          </View>
        </View>

        {/* Bottom bar */}
        <View style={styles.footerBar} />
        <View style={styles.paidSeal}>
          <View style={styles.paidSealInner}>
            <Text style={styles.paidSealText}>PAID</Text>
            <Text style={styles.paidSealSub}>HACKFEST '26</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
