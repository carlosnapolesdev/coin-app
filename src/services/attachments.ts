import api from './api' // default export
import { getAccessToken } from './auth-session'

export interface AttachmentDto {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export type Disposition = 'attachment' | 'inline';

export const attachmentsApi = {
  async list(transactionId: number): Promise<AttachmentDto[]> {
    const res = await api.get<AttachmentDto[]>(`/users/me/transactions/${transactionId}/attachments`);
    return res.data;
  },

  async upload(
    transactionId: number,
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<AttachmentDto> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<AttachmentDto>(
      `/users/me/transactions/${transactionId}/attachments`,
      form,
      {
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      },
    );
    return res.data;
  },

  downloadUrl(attachmentId: number, disposition: Disposition): string {
    const token = getAccessToken(); // from ./auth-session; synchronous, reads from storage
    const base = (api.defaults.baseURL ?? '').replace(/\/$/, ''); // '/api' by default (relative, same origin)
    const params = new URLSearchParams({ disposition });
    if (token) params.set('token', token);
    return `${base}/users/me/attachments/${attachmentId}/download?${params.toString()}`;
  },

  async remove(attachmentId: number): Promise<void> {
    await api.delete(`/users/me/attachments/${attachmentId}`);
  },
};