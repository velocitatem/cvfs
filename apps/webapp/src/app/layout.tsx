import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const fontVariables = "font-sans";

export const metadata: Metadata = {
    title: "Resume Branches - Git for CVs",
    description: "Manage your CV like code: branch, version, and tailor for different roles while preserving ATS formatting",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${fontVariables} antialiased`}>
                <Header />
                <main className="min-h-screen">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}
