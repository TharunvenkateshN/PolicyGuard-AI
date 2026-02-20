import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { UserProvider } from '@/context/UserContext'
import { ThemeProvider } from '@/components/theme-provider'
import { ToastProvider } from '@/components/ui/toast-context'
import { TourGuide } from '@/components/TourGuide'
import { ChatWidget } from '@/components/dashboard/ChatWidget'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter'
})

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-outfit'
})

export const metadata: Metadata = {
    title: 'Lexinel — Autonomous Compliance Sentinel',
    description: 'Neural-to-Logic Policy Recompiler: Transform unstructured regulatory PDFs into live database enforcement. Powered by Gemini AI.',
    keywords: 'compliance, AML, policy enforcement, AI agent, data governance, anti-money laundering',
    openGraph: {
        title: 'Lexinel — Autonomous Compliance Sentinel',
        description: 'Transform unstructured PDF regulations into live enforcement across your entire data fabric.',
        type: 'website',
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background bg-grid-cyber`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem={true}
                    disableTransitionOnChange={false}
                >
                    <AuthProvider>
                        <UserProvider>
                            <ToastProvider>
                                <TourGuide />
                                {children}
                                <ChatWidget />
                            </ToastProvider>
                        </UserProvider>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
