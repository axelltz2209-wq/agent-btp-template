import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import companyConfig from "@/config/company";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${companyConfig.name} - Dashboard`,
  description: `Tableau de bord pour ${companyConfig.name}`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
