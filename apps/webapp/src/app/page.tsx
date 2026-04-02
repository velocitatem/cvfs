import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
    return (
        <>
            <Header />
            <main>
                <section style={{ padding: "80px 24px 64px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ maxWidth: 560, margin: "0 auto" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 16 }}>
                            Resume Branches
                        </p>
                        <h1 style={{ fontSize: 40, fontWeight: 700, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.02em" }}>
                            Git for CVs
                        </h1>
                        <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 32 }}>
                            Upload your ATS-safe DOCX. Branch it by role. Tailor per company without
                            losing structure. Publish stable public links.
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "9px 20px", fontSize: 14 }}>
                                Open Dashboard
                            </Link>
                        </div>
                    </div>
                </section>

                <section style={{ padding: "64px 24px", maxWidth: 800, margin: "0 auto" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
                        {[
                            { title: "ATS-safe edits", body: "Patches apply directly to text nodes in your original DOCX. Layout, styles, and fonts are never touched." },
                            { title: "Branching tree", body: "root → ml-engineer → Anthropic internship. Every variant traces back to a single source of truth." },
                            { title: "Public links", body: "Freeze a version and publish it as an immutable, shareable link. Revoke or expire anytime." },
                        ].map(({ title, body }) => (
                            <div key={title}>
                                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={{ padding: "48px 24px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
                    <div style={{ maxWidth: 480, margin: "0 auto" }}>
                        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 20 }}>
                            {[
                                ["Upload your master DOCX", "The canonical ATS-formatted document becomes your root node."],
                                ["Create specialization branches", "ml-engineer, backend, research — each branch tracks a career path."],
                                ["Tailor per submission", "Paste a job description, accept AI suggestions, export the tailored DOCX."],
                                ["Publish selected versions", "One-click stable public links for portfolios or direct recruiter sharing."],
                            ].map(([step, desc], i) => (
                                <li key={i} style={{ display: "flex", gap: 16 }}>
                                    <span style={{ flexShrink: 0, width: 22, height: 22, border: "1px solid var(--border-strong)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 2 }}>{i + 1}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{step}</div>
                                        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
