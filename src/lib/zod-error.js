export function getZodErrors(error) {
  if (!error) {
    return {};
  }

  if (error.flatten) {
    return error.flatten().fieldErrors || {};
  }

  if (Array.isArray(error.issues)) {
    return error.issues.reduce((errors, issue) => {
      const field = issue.path?.join(".") || "general";

      if (!errors[field]) {
        errors[field] = [];
      }

      errors[field].push(issue.message);

      return errors;
    }, {});
  }

  return {};
}
