import { afterEach, describe, expect, it, vi } from 'vitest'
import api from './api'
import { tagsApi } from './tags'

const tag = { id: 1, name: 'travel', usageCount: 3 }

describe('tagsApi', () => {
  afterEach(() => vi.restoreAllMocks())

  it('lists the current user tags', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [tag] })

    const result = await tagsApi.list()

    expect(get).toHaveBeenCalledWith('/users/me/tags')
    expect(result).toEqual([tag])
  })

  it('renames a tag', async () => {
    const renamed = { id: 1, name: 'vacation' }
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: renamed })

    const result = await tagsApi.rename(1, 'vacation')

    expect(patch).toHaveBeenCalledWith('/users/me/tags/1', { name: 'vacation' })
    expect(result).toEqual(renamed)
  })

  it('removes a tag', async () => {
    const remove = vi.spyOn(api, 'delete').mockResolvedValue({ data: undefined })

    await tagsApi.remove(1)

    expect(remove).toHaveBeenCalledWith('/users/me/tags/1')
  })
})
