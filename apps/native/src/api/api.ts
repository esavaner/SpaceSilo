import { GeneratedApi } from './generated';
import { adapter, PrismaClient } from '@repo/shared';

export const Api = new GeneratedApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  baseApiParams: {
    credentials: 'include',
  },
});
