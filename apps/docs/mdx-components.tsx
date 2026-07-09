import { Steps } from 'nextra/components'
import { useMDXComponents as getThemeDocsMDXComponents } from 'nextra-theme-docs'

const themeDocsComponents = getThemeDocsMDXComponents()

export function useMDXComponents(components?: Readonly<Record<string, unknown>>) {
  return {
    ...themeDocsComponents,
    Steps,
    ...components
  }
}
