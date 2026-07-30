const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using QuickSplit, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree, you may not use the service.",
  },
  {
    title: "2. Service Description",
    body: "QuickSplit is a peer-to-peer payment platform that allows users to send and receive simulated funds. This is a demonstration application designed to showcase payment app functionality. All transactions, balances, and money movements are simulated for demonstration purposes only.",
  },
  {
    title: "3. User Accounts",
    body: "You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized use of your account.",
  },
  {
    title: "4. Payments and Transactions",
    body: "All funds displayed within QuickSplit are simulated for demonstration purposes. QuickSplit does not process real money transfers unless properly licensed as a money transmitter. Any transactions you initiate are for testing and demonstration only and do not represent actual movement of funds.",
  },
  {
    title: "5. Fees",
    body: "Withdrawals to debit cards incur a 2% processing fee. Bank account withdrawals are free of charge. All fees are subject to change at our discretion. Any changes to the fee structure will be reflected in an updated version of these terms.",
  },
  {
    title: "6. Privacy",
    body: "We collect your email address, username, and payment method tokens to provide the service. Payment details are tokenized via Stripe and never stored on our servers. We do not sell or share your personal information with third parties except as required to provide the service or comply with the law.",
  },
  {
    title: "7. Limitation of Liability",
    body: 'QuickSplit is provided "as is" without warranties of any kind, either express or implied. We are not liable for any damages, losses, or expenses arising from your use of, or inability to use, the service — including but not limited to direct, indirect, incidental, or consequential damages.',
  },
  {
    title: "8. Changes to Terms",
    body: "We reserve the right to modify or replace these Terms & Conditions at any time. Material changes will be communicated via the app or email. Your continued use of QuickSplit after any changes constitutes acceptance of the revised terms.",
  },
  {
    title: "9. Contact",
    body: "If you have any questions about these Terms & Conditions, please contact us at support@quicksplitnow.com.",
  },
];

export default function Terms() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "1.5rem 1.25rem 2.5rem",
        gap: "1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          Terms &amp; Conditions
        </h1>
        <p style={{ fontSize: "0.8rem", color: "#555", margin: 0 }}>
          Last updated: July 30, 2026
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: "1px",
          background: "#1a1a1a",
        }}
      />

      {/* Sections */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#00D632",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {section.title}
            </h2>
            <p
              style={{
                fontSize: "0.88rem",
                color: "#aaa",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {section.body}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom spacer */}
      <div style={{ height: "1rem" }} />
    </div>
  );
}
