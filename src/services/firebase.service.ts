/**
 * firebase.service.ts — Redirecionado para o korvyan-workers
 */
import {
  uploadFileViaWorker,
  uploadTenantLogoViaWorker,
  deleteFileViaWorker,
  getTenantConfigViaWorker,
  saveTenantConfigViaWorker,
  getAllTenantConfigsViaWorker,
  deleteTenantConfigViaWorker,
  getReportsViaWorker,
  saveReportViaWorker,
  deleteReportViaWorker,
} from './workers.service'

export const uploadFile = (file: File, path?: string) => uploadFileViaWorker(file, path)
export const deleteFile = (url: string) => deleteFileViaWorker(url)
export const uploadTenantLogo = (tenantPrefix: string, file: File) => uploadTenantLogoViaWorker(file)

export const saveTenantConfig = (prefix: string, config: any) => saveTenantConfigViaWorker(prefix, config)
export const getTenantConfig = (prefix: string) => getTenantConfigViaWorker(prefix)
export const getAllTenantConfigs = () => getAllTenantConfigsViaWorker()
export const deleteTenantConfig = (prefix: string) => deleteTenantConfigViaWorker(prefix)

export const saveReport = (report: any) => saveReportViaWorker(report)
export const getReports = (tenant: string) => getReportsViaWorker(tenant)
export const deleteReport = (id: string) => deleteReportViaWorker(id)
