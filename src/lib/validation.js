export function getZodErrors(error) {
  if (!error?.issues) {
    return null;
  }

  const errors = {};

  for (const issue of error.issues) {
    const field = issue.path?.[0];

    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
