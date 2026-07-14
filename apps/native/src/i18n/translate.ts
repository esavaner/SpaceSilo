import { ApiError } from '@/api/_client';
import { type ApiErrorResponse } from '@repo/shared';
import { type TFunction } from 'i18next';

export const translateDescriptor = (t: TFunction, message?: string, fallbackKey = 'common.messages.genericError') =>
  message ? t(message) : t(fallbackKey);

export const tApiErr = (t: TFunction, error: unknown, fallbackKey = 'common.messages.genericError') => {
  if (error instanceof ApiError) {
    return translateDescriptor(t, error.responseBody?.message, fallbackKey);
  }

  if (error instanceof Error) {
    return error.message || t(fallbackKey);
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return translateDescriptor(t, error.message, fallbackKey);
  }

  return t(fallbackKey);
};

export const getApiErrorDetails = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.responseBody?.message;
  }

  if (!error || typeof error !== 'object') {
    return undefined;
  }

  return (error as ApiErrorResponse)?.message;
};
