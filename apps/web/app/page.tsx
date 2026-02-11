export default function HomePage() {
  return (
    <main style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <section style={{ maxWidth: 720, padding: "2rem", border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Mirfa Secure Transactions</h1>
        <p style={{ color: "#4b5563" }}>
          Phase 1 scaffold ready. API and crypto package are linked; encryption logic and UI will be
          added in the next phases.
        </p>
      </section>
    </main>
  );
}
