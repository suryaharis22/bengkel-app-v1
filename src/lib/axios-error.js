export function getAxiosError(error, fallback = "Something went wrong") {
  if (!error) {
    return fallback;
  }

  if (!error.response) {
    return "Network error. Please check your connection.";
  }

  const data = error.response.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  if (data?.errors) {
    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item?.message && typeof item.message === "string") {
            return item.message;
          }

          return null;
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    if (typeof data.errors === "object") {
      const messages = Object.values(data.errors)
        .flatMap((value) => {
          if (Array.isArray(value)) {
            return value;
          }

          return [value];
        })
        .filter((value) => typeof value === "string" && value.trim());

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback;
  }

  return "Something went wrong";
}
