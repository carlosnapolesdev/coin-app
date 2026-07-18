import api from './api'

export interface TagDto {
  id: number
  name: string
  usageCount?: number
}

export const tagsApi = {
  async list(): Promise<TagDto[]> {
    const response = await api.get<TagDto[]>('/users/me/tags')
    return response.data
  },

  async rename(id: number, name: string): Promise<TagDto> {
    const response = await api.patch<TagDto>(`/users/me/tags/${id}`, { name })
    return response.data
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/users/me/tags/${id}`)
  },
}
