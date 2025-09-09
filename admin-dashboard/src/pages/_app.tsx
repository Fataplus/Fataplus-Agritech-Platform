import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import Layout from '@/components/Layout'
import { ThemeProvider } from '@/components/ThemeProvider'
import { DashboardProvider } from '@/contexts/DashboardContext'

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DashboardProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </DashboardProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}