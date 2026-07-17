import api from './api' // default export
import { getAccessToken } from './auth-session'

export interface AttachmentDto {
  id: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

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
        // IMPORTANT: clear Content-Type here so axios 1.14's transformRequest
        // does NOT JSON-serialize our FormData. With Content-Type: application/json
        // (the instance default set in src/services/api.ts), axios's default
        // transform checks hasJSONContentType and switches the FormData to
        // JSON.stringify(formDataToJSON(data)). The server then sees an
        // application/json body, multer doesn't parse multipart, and the
        // controller hits "Missing file field". axios 1.14's resolveConfig then
        // calls setContentType(undefined) for the FormData branch in browser
        // env, but the damage is already done by transformRequest running first.
        //
        // Setting the per-call header to undefined is the documented escape
        // hatch: it removes the application/json default for this request only,
        // letting the FormData pass through and the XHR adapter generate
        // multipart/form-data with the correct boundary.
        headers: { 'Content-Type': undefined as unknown as string },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      },
    );
    return res.data;
  },

  /**
   * Descarga un attachment vía `fetch` con header `Authorization` (en lugar de
   * inyectar el JWT como `?token=` en la URL, que el backend ya no acepta) y
   * devuelve un `blob:` URL. Esto evita que el JWT quede en la URL que el
   * navegador guarda en historial, en logs del servidor, y en el Referer al
   * navegar a sitios externos. Lo usan tanto los PDFs (pestaña top-level) como
   * los thumbnails de imagen (vía useAttachmentBlobUrls).
   *
   * El `window.open` NO se hace aquí: debe ejecutarse síncronamente dentro del
   * gesto del usuario (el clic), porque tras cruzar los `await` de esta función la
   * activación transitoria ya expiró y el navegador bloquearía el popup. El llamador
   * abre la pestaña síncrono y luego le asigna esta URL. El caller es responsable de
   * `URL.revokeObjectURL` tras un margen suficiente (revocar antes hace fallar la
   * carga en algunos navegadores).
   */
  async fetchInlineBlobUrl(attachmentId: number): Promise<string> {
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
    return URL.createObjectURL(await res.blob())
  },

  async remove(attachmentId: number): Promise<void> {
    await api.delete(`/users/me/attachments/${attachmentId}`);
  },
};