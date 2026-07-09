import type { ReactNode } from 'react'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: 'Rocky Docs',
  description: 'Documentation for the Rocky livestock platform'
}

const banner = (
  <Banner storageKey="rocky-docs-banner">Rocky Docs — work in progress</Banner>
)
const navbar = <Navbar logo={<b>Rocky</b>} />
const footer = <Footer>MIT {new Date().getFullYear()} © Rocky.</Footer>

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
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
