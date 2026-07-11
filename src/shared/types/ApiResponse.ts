export class ApiResponse<T = any> {
  ok: boolean;
  payload: T;
  message: string;
  error: string;

  static success<U>(payload: U, message = "Request successful"): ApiResponse<U> {
    const response = new ApiResponse<U>();
    response.ok = true;
    response.payload = payload;
    response.message = message;
    response.error = "";
    return response;
  }

  static error(error: string, message = "Request failed"): ApiResponse<null> {
    const response = new ApiResponse<null>();
    response.ok = false;
    response.payload = null;
    response.message = message;
    response.error = error;
    return response;
  }
}
