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
    const token = getAccessToken(); // de ../services/auth-session; síncrono, lee del storage
    const base = (api.defaults.baseURL ?? '').replace(/\/$/, ''); // '/api' por defecto (relativo, mismo origen)
    const params = new URLSearchParams({ disposition });
    if (token) params.set('token', token);
    return `${base}/users/me/attachments/${attachmentId}/download?${params.toString()}`;
  },

  /**
   * Descarga un attachment vía `fetch` con header `Authorization` (en lugar de
   * inyectar el JWT como `?token=` en la URL) y abre el resultado en una nueva
   * pestaña como `blob:` URL. Esto evita que el JWT quede en la URL que el
   * navegador guarda en historial, en logs del servidor, y en el Referer al
   * navegar a sitios externos.
   *
   * El `blob:` URL se revoca 60 s después — tiempo suficiente para que la pestaña
   * nueva haya cargado el documento; revocar antes hace fallar la carga en algunos
   * navegadores.
   *
   * Reservado a PDFs (donde el riesgo de URL en historial es real, porque se abre
   * en pestaña top-level). Los thumbnails usan `downloadUrl` con `?token=` porque
   * van por `<img src>` same-origin sin historial.
   */
  async openInNewTab(attachmentId: number): Promise<void> {
    const token = getAccessToken()
    if (!token) throw new Error('Not authenticated')
    const base = (api.defaults.baseURL ?? '').replace(/\/$/, '')
    const url = `${base}/users/me/attachments/${attachmentId}/download?disposition=inline`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      throw new Error(`Download failed with status ${res.status}`)
    }
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    window.open(blobUrl, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
  },

  async remove(attachmentId: number): Promise<void> {
    await api.delete(`/users/me/attachments/${attachmentId}`);
  },
};