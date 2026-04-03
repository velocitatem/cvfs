import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "cvfs",
    description: "CV File System — manage your resume like code: branch, version, and tailor for different roles while preserving ATS formatting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
