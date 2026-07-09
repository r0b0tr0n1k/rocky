import nextra from 'nextra'

const withNextra = nextra({
  // Nextra Docs Theme options
  defaultShowCopyCode: true,
  search: {
    codeblocks: false
  }
})

export default withNextra({
  reactStrictMode: true,
  turbopack: { root: '/home/goce/appz/rocky' }
})
