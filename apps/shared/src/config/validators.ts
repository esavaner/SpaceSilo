import { compareAsc, differenceInYears, isValid, parse } from 'date-fns';
import { z } from 'zod';

export type PasswordRequirement = {
  id: string;
  label: string;
  validate: (value: string) => boolean;
  errorMessage: string;
};

export const defaultPasswordRequirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: '8 or more characters',
    errorMessage: 'Password must be at least 8 characters',
    validate: (value) => value.length >= 8,
  },
  {
    id: 'mixed-case',
    label: 'Upper & lowercase letters',
    errorMessage: 'Password must contain at least one uppercase and one lowercase letter',
    validate: (value) => /^(?=.*[a-z])(?=.*[A-Z])/.test(value),
  },
  {
    id: 'number',
    label: 'At least one number',
    errorMessage: 'Password must contain at least 1 number',
    validate: (value) => /^(?=.*\d)/.test(value),
  },
];

const PHONE_REGEX = /^[0-9]{3}-[0-9]{3}-[0-9]{4}$/;
const PHONE_FORMAT_MESSAGE = 'Phone number must be in the format XXX-XXX-XXXX.';
const ZIP_REGEX = /^\d{5}$/;
const ZIP_FORMAT_MESSAGE = 'ZIP Code must be exactly 5 digits.';
const EMAIL_FORMAT_MESSAGE = 'Email must be a valid email address';
const DATE_FORMAT_MESSAGE = 'Date must be in proper format (mm/dd/yyyy)';

// normalize blank/nullish input to 'undefined' so '.optional()' succeeds and
// required schemas report their message instead of a generic type error.
const toOptionalString = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const toOptionalNumber = (rawValue: unknown) => {
  const value = toOptionalString(rawValue);
  if (typeof value !== 'string') return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? rawValue : parsed;
};

// trimmed, optional string. blank/nullish becomes 'undefined'
const optionalString = z.preprocess(toOptionalString, z.string().optional());

// trimmed, required string. blank/whitespace fails with 'message'
const requiredString = (label: string, message = `${label} is required`) =>
  z
    .string({
      required_error: message,
      invalid_type_error: message,
    })
    .trim()
    .min(1, message);

// optional + required variants for a string constrained by 'regex'
const patternString = (label: string, regex: RegExp, formatMessage: string) => ({
  optional: z.preprocess(toOptionalString, z.string().regex(regex, formatMessage).optional()),
  required: z.preprocess(
    toOptionalString,
    z
      .string({
        required_error: `${label} is required`,
        invalid_type_error: formatMessage,
      })
      .min(1, `${label} is required`)
      .regex(regex, formatMessage)
  ),
});

const requiredNumber = (label: string) =>
  z.number({
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be a number`,
  });

const birthDateBase = z.string().superRefine((value, context) => {
  const addIssue = (message: string) => context.addIssue({ code: z.ZodIssueCode.custom, message });
  const date = new Date(value);

  if (!isValid(parse(value, 'MM/dd/yyyy', new Date())) || value.length !== 10) {
    addIssue(DATE_FORMAT_MESSAGE);
  } else if (differenceInYears(new Date(), date) < 14) {
    addIssue('Neura serves patients 14 and older');
  } else if (compareAsc(date, new Date('01/01/1900')) === -1) {
    addIssue('Date must be on or after 01/01/1900');
  }
});

const phone = patternString('Phone number', PHONE_REGEX, PHONE_FORMAT_MESSAGE);
const zipCode = patternString('ZIP Code', ZIP_REGEX, ZIP_FORMAT_MESSAGE);

export const validators = {
  string: optionalString,
  stringRequired: requiredString,
  boolean: z.boolean().nullable().optional(),
  booleanRequired: (label: string) =>
    z.boolean({
      required_error: `${label} is required`,
      invalid_type_error: `${label} is required`,
    }),
  number: z.preprocess(toOptionalNumber, z.number().optional()),
  numberRequired: (label: string) => z.preprocess(toOptionalNumber, requiredNumber(label)),
  integer: (label: string) =>
    z.preprocess(toOptionalNumber, z.number().int(`${label} must be a whole number`).optional()),
  integerRequired: (label: string) =>
    z.preprocess(toOptionalNumber, requiredNumber(label).int(`${label} must be a whole number`)),
  email: z.preprocess(toOptionalString, z.string().email(EMAIL_FORMAT_MESSAGE).optional()),
  emailRequired: z.preprocess(
    toOptionalString,
    z
      .string({
        required_error: 'Email is required',
        invalid_type_error: EMAIL_FORMAT_MESSAGE,
      })
      .email(EMAIL_FORMAT_MESSAGE)
  ),
  birthDate: z.preprocess(toOptionalString, birthDateBase.optional()),
  birthDateRequired: requiredString('Birth date').pipe(birthDateBase),
  firstNameRequired: requiredString('First name'),
  lastNameRequired: requiredString('Last name'),
  stateRequired: requiredString('State'),
  insuranceCarrierRequired: requiredString('Insurance carrier'),
  memberIdRequired: requiredString('Member ID'),
  phone: phone.optional,
  phoneRequired: phone.required,
  zipCode: zipCode.optional,
  zipCodeRequired: zipCode.required,
  passwordRequired: (
    label = 'Password',
    message = `${label} is required`,
    requirements = defaultPasswordRequirements
  ) =>
    z
      .string({
        required_error: message,
        invalid_type_error: message,
      })
      .min(1, message)
      .superRefine((value, context) => {
        const invalid = requirements.find((requirement) => !requirement.validate(value));
        if (invalid) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: invalid.errorMessage,
          });
        }
      }),
};
