/**
 * storage.service.ts — Upload e gestão de arquivos via korvyan-workers
 */
import { uploadFileViaWorker, deleteFileViaWorker } from './workers.service'

export async function uploadFile(path: string, file: File): Promise<string> {
  const result = await uploadFileViaWorker(file, path)
  return result.url
}

export async function removeFile(pathOrUrl: string): Promise<void> {
  return deleteFileViaWorker(pathOrUrl)
}
