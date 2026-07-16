export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
  }
}
