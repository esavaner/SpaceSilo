export const fileSize = (bytes = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
};

export const getInitials = (name?: string) => {
  if (!name) return 'N/A';
  const [first, last] = name.split(' ');
  if (!first || !last) return first ? first[0].toUpperCase() : '';
  return `${first[0]}${last[0]}`.toUpperCase();
};
