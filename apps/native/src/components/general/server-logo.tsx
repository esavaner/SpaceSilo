import DropboxLogo from '@/assets/images/dropbox.svg';
import GoogleDriveLogo from '@/assets/images/google_drive.svg';
import CoreLogo from '@/assets/images/database.svg';
import { Image } from 'expo-image';

const createLogo = (source: number) => {
  const Logo = ({ size = 18 }: { size?: number }) => (
    <Image source={source} style={{ width: size, height: size }} contentFit="contain" />
  );
  return Logo;
};

export const ServerLogo = {
  Dropbox: createLogo(DropboxLogo),
  GoogleDrive: createLogo(GoogleDriveLogo),
  Core: createLogo(CoreLogo),
};
