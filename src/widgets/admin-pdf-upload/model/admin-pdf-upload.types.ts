import type { PdfFileAssetKey } from '@/entities/pdf-file/model/types';

export type AdminPdfUploadItem = {
  assetKey: PdfFileAssetKey;
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
  title: string;
};
