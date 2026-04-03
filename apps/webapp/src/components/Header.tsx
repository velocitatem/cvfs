import Link from "next/link";

export default function Header() {
    return (
        <header style={{ borderBottom: "1px solid var(--border)", padding: "0 24px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", position: "sticky", top: 0, zIndex: 40 }}>
            <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none" }}>
                cvfs
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {[["Dashboard", "/dashboard"], ["Docs", "/docs"]].map(([label, href]) => (
                    <Link key={href} href={href} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                        {label}
                    </Link>
                ))}
                <Link href="/dashboard" className="btn btn-primary" style={{ padding: "5px 14px", fontSize: 13 }}>
                    Open app
                </Link>
            </nav>
        </header>
    );
}
