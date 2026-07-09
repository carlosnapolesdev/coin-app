import { ref } from 'vue';
import { attachmentsApi, type AttachmentDto } from '../services/attachments';

export function useAttachments() {
  const attachments = ref<AttachmentDto[]>([]);
  const isUploading = ref(false);
  const progressByFile = ref<Map<string, number>>(new Map());
  const errorByFile = ref<Map<string, string>>(new Map());

  async function load(transactionId: number): Promise<void> {
    attachments.value = await attachmentsApi.list(transactionId);
  }

  function clearErrors(): void {
    errorByFile.value = new Map();
  }

  function retry(transactionId: number, file: File): Promise<void> {
    errorByFile.value.delete(file.name);
    return addFiles(transactionId, [file]).then(() => undefined);
  }

  async function addFiles(transactionId: number, files: File[]): Promise<void> {
    clearErrors();
    isUploading.value = true;
    try {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          return attachmentsApi.upload(transactionId, file, (pct) => {
            const next = new Map(progressByFile.value);
            next.set(file.name, pct);
            progressByFile.value = next;
          });
        }),
      );
      results.forEach((r, i) => {
        const file = files[i]!;
        if (r.status === 'fulfilled') {
          attachments.value.push(r.value);
          progressByFile.value.delete(file.name);
        } else {
          const next = new Map(errorByFile.value);
          next.set(file.name, (r.reason as Error)?.message ?? 'Upload failed');
          errorByFile.value = next;
        }
      });
    } finally {
      isUploading.value = false;
    }
  }

  async function remove(id: number): Promise<void> {
    await attachmentsApi.remove(id);
    attachments.value = attachments.value.filter((a) => a.id !== id);
  }

  return { attachments, isUploading, progressByFile, errorByFile, load, addFiles, remove, retry, clearErrors };
}