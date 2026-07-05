import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

const normalizeServerUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return trimmed;
  }

  return /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

const isValidServerUrl = (value?: string) => {
  const normalized = normalizeServerUrl(value);
  if (!normalized) return false;

  try {
    const parsed = new URL(normalized);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
};

export const useValidators = () => {
  const { t } = useTranslation();

  return {
    displayName: yup.string().required(t('errors.displayNameRequired')),
    serverUrl: yup
      .string()
      .transform((value) => normalizeServerUrl(value))
      .test('is-valid-server-url', t('errors.serverUrlInvalid'), isValidServerUrl)
      .required(t('errors.serverUrlRequired')),
    email: yup.string().email(t('errors.emailInvalid')).required(t('errors.emailRequired')),
    password: yup.string().required(t('errors.passwordRequired')),
  };
};
