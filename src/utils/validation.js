
export const validateRequiredFields = (job) => {
  const errors = {};

  if (!job.company?.trim()) {
    errors.company = "Company is required.";
  }

  if (!job.role?.trim()) {
    errors.role = "Role is required.";
  }

  if (!job.status?.trim()) {
    errors.status = "Status is required.";
  }

  return errors;
};

export const validateAndNormalizeUrl = (value) => {
  if (!value?.trim()) {
    return {
      errors: {},
      url: "",
    };
  }

  const tryParse = (input) => {
    const parsed = new URL(input);

    if (!parsed.hostname.includes(".")) {
      throw new Error("Invalid hostname");
    }

    return parsed.toString();
  };

  try {
    return {
      errors: {},
      url: tryParse(value.trim()),
    };
  } catch {
    try {
      return {
        errors: {},
        url: tryParse(`https://${value.trim()}`),
      };
    } catch {
      return {
        errors: {
          applicationUrl:
            "Enter a valid URL (e.g. https://company.com/job)",
        },
        url: "",
      };
    }
  }
};

/**
 * Validates uploaded resume.
 */
export const validateResume = (file) => {
  const errors = {};

  if (!file) return errors;

  const allowedTypes = ["application/pdf"];

  const maxSize = 5 * 1024 * 1024; // 5 MB

  if (!allowedTypes.includes(file.type)) {
    errors.resume = "Resume must be a PDF.";
  }

  if (file.size > maxSize) {
    errors.resume = "Resume must be smaller than 5 MB.";
  }

  return errors;
};

/**
 * Validates business rules for dates.
 */
export const validateDates = (job) => {
  const errors = {};

  if (
    job.appliedDate &&
    job.interviewDate &&
    new Date(job.interviewDate) < new Date(job.appliedDate)
  ) {
    errors.interviewDate =
      "Interview date cannot be before the application date.";
  }

  return errors;
};

/**
 * Main validation function.
 */
export const validateJob = (job) => {
  const errors = {
    ...validateRequiredFields(job),
    ...validateResume(job.resume),
    ...validateDates(job),
  };

  const urlResult = validateAndNormalizeUrl(job.applicationUrl);

  Object.assign(errors, urlResult.errors);

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    normalizedJob: {
      ...job,
      applicationUrl: urlResult.url,
    },
  };
};