import { GeneratedApi } from './generated';

export const Api = new GeneratedApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
});
