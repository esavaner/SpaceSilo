export type FileType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'OTHER';

export const fileTypes: Record<FileType, string[]> = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
  VIDEO: ['mp4', 'avi', 'mkv', 'webm', 'mov', 'flv'],
  AUDIO: ['mp3', 'wav', 'flac', 'ogg', 'm4a'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv'],
  OTHER: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'apk', 'exe'],
};
