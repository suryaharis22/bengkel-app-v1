import { errorResponse } from "@/lib/response";

export function handleMiddlewareError(error, fallbackMessage) {
  console.error(fallbackMessage, error);

  return errorResponse({
    code: 500,
    message: fallbackMessage,
  });
}
