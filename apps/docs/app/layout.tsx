import type { ReactNode } from 'react'
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import './globals.css'

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
  display: 'swap',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Rocky Docs',
  description: 'Documentation for the Rocky livestock platform',
}

const banner = (
  <Banner storageKey="rocky-docs-banner">Rocky Docs — work in progress</Banner>
)
const navbar = <Navbar logo={<b>Rocky</b>} />
const footer = <Footer>MIT {new Date().getFullYear()} © Rocky.</Footer>

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <Head
        color={{
          hue: { light: 152, dark: 150 },
          saturation: { light: 68, dark: 60 },
          lightness: { light: 38, dark: 68 },
        }}
        backgroundColor={{ light: '#f9fdfa', dark: '#0a0a0a' }}
      />
      <body>
        <Layout
          banner={banner}
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/rocky/rocky/tree/main/apps/docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
