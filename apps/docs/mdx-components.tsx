import type { MDXComponents } from 'nextra/mdx-components'
import { Steps, Tabs } from 'nextra/components'
import { useMDXComponents as getThemeDocsMDXComponents } from 'nextra-theme-docs'

const themeDocsComponents = getThemeDocsMDXComponents()

export function useMDXComponents(components?: Readonly<Record<string, unknown>>): MDXComponents {
  return {
    ...themeDocsComponents,
    Steps,
    Tabs,
    ...components
  }
}
