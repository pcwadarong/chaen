import type { PdfFileKind } from '@/entities/pdf-file/model/types';

export type AdminPdfUploadItem = {
  description: string;
  downloadFileName: string;
  downloadPath: string;
  filePath: string;
  isPdfReady: boolean;
  kind: PdfFileKind;
  title: string;
};
