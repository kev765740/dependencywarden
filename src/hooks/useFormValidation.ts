import { useState, useCallback } from 'react';

type ValidationRule = {
  validate: (value: any) => boolean;
  message: string;
};

type ValidationRules = {
  [key: string]: ValidationRule[];
};

type ValidationErrors = {
  [key: string]: string[];
};

export const useFormValidation = (initialValues: Record<string, any>) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const commonValidationRules = {
    required: (message = 'This field is required'): ValidationRule => ({
      validate: (value: any) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return value !== null && value !== undefined;
      },
      message,
    }),
    email: (message = 'Invalid email address'): ValidationRule => ({
      validate: (value: string) =>
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value),
      message,
    }),
    minLength: (length: number, message?: string): ValidationRule => ({
      validate: (value: string) => value.length >= length,
      message: message || `Must be at least ${length} characters`,
    }),
    maxLength: (length: number, message?: string): ValidationRule => ({
      validate: (value: string) => value.length <= length,
      message: message || `Must be no more than ${length} characters`,
    }),
    pattern: (regex: RegExp, message: string): ValidationRule => ({
      validate: (value: string) => regex.test(value),
      message,
    }),
    match: (matchValue: any, message: string): ValidationRule => ({
      validate: (value: any) => value === matchValue,
      message,
    }),
  };

  const validate = useCallback(
    (fieldName: string, value: any, rules: ValidationRule[]) => {
      const fieldErrors: string[] = [];
      
      for (const rule of rules) {
        if (!rule.validate(value)) {
          fieldErrors.push(rule.message);
        }
      }

      setErrors((prev) => ({
        ...prev,
        [fieldName]: fieldErrors,
      }));

      return fieldErrors.length === 0;
    },
    []
  );

  const validateField = useCallback(
    (fieldName: string, rules: ValidationRule[]) => {
      const value = values[fieldName];
      return validate(fieldName, value, rules);
    },
    [values, validate]
  );

  const validateForm = useCallback(
    (validationRules: ValidationRules) => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      Object.entries(validationRules).forEach(([fieldName, rules]) => {
        const value = values[fieldName];
        const fieldErrors: string[] = [];

        rules.forEach((rule) => {
          if (!rule.validate(value)) {
            fieldErrors.push(rule.message);
            isValid = false;
          }
        });

        if (fieldErrors.length > 0) {
          newErrors[fieldName] = fieldErrors;
        }
      });

      setErrors(newErrors);
      return isValid;
    },
    [values]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setValues((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      const { name } = event.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
    },
    []
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    validate,
    validateField,
    validateForm,
    handleChange,
    handleBlur,
    reset,
    setValues,
    commonValidationRules,
  };
}; 