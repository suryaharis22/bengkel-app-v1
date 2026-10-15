export function successResponse({
  data = null,
  message = "Success",
  code = 200,
  meta = null,
}) {
  const response = {
    success: true,
    code,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return Response.json(response, {
    status: code,
  });
}

export function errorResponse({
  message = "Something went wrong",
  code = 500,
  errors = null,
}) {
  const response = {
    success: false,
    code,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return Response.json(response, {
    status: code,
  });
}
