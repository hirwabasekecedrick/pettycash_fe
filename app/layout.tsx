import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Petty Cash Management",
  description: "Manage petty cash effectively",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${montserrat.className} h-full antialiased`}
    >
      <body className={`${montserrat.className} min-h-full flex flex-col font-sans`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
