import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const isValidServerUrl = (value?: string) => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

export const useValidators = () => {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      displayName: yup.string().required(t('errors.displayNameRequired')),
      serverUrl: yup
        .string()
        .transform((value) => value?.trim())
        .test('is-valid-server-url', t('errors.serverUrlInvalid'), isValidServerUrl)
        .required(t('errors.serverUrlRequired')),
      email: yup.string().email(t('errors.emailInvalid')).required(t('errors.emailRequired')),
      password: yup.string().required(t('errors.passwordRequired')),
    }),
    [t]
  );
};
