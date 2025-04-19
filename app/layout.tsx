import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import Sidebar from "@/components/sidebar"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Slack Archive Viewer",
  description: "Browse and search your archived Slack data",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <div className="flex h-screen overflow-hidden bg-white dark:bg-[#1A1D21]">
            <Sidebar />
            <main className="flex-1 overflow-auto dark:text-white">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
