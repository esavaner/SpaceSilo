import { GeneratedApi } from './generated';

export const Api = new GeneratedApi({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});
