
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { AppShell } from '@/components/AppShell';
import "@/app/globals.css";

export const metadata: Metadata = {
  title: 'Nexus Aurae',
  description: "A Next-Gen Web Application",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });


export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell>{children}</AppShell>
  );
}