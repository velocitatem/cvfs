import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Resume Branches",
    description: "Manage your CV like code: branch, version, and tailor for different roles while preserving ATS formatting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
