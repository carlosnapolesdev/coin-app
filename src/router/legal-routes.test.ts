import { describe, expect, it } from 'vitest'
import router from './index'
import { LEGAL_ROUTE_PATHS, LEGAL_TITLE_KEYS, LEGAL_SLUGS } from '../content/legal'

describe('legal routes', () => {
  it('resolve each legal slug to a public route with the right title key and slug prop', () => {
    for (const slug of LEGAL_SLUGS) {
      const resolved = router.resolve(LEGAL_ROUTE_PATHS[slug])
      expect(resolved.matched.length).toBe(1)
      expect(resolved.meta.title).toBe(LEGAL_TITLE_KEYS[slug])
      expect(resolved.meta.requiresAuth).toBeUndefined()
      expect(resolved.meta.publicOnly).toBeUndefined()
      expect((resolved.matched[0]!.props.default as { slug: string }).slug).toBe(slug)
    }
  })
})
