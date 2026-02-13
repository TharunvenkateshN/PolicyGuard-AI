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
    title: 'PolicyGuard AI',
    description: 'Enterprise AI Policy Governance & Guardrails',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning className="dark">
            <head>
                <script dangerouslySetInnerHTML={{
                    __html: `
                        try {
                            document.documentElement.classList.add('dark');
                            document.documentElement.style.colorScheme = 'dark';
                        } catch (e) {}
                    `
                }} />
            </head>
            <body className={`${inter.variable} ${outfit.variable} font-sans antialiased bg-background bg-grid-cyber`} suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
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
