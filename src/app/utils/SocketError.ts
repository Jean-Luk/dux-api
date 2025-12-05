import logger from "../../config/logger";
import { AppError } from "./AppError";

export class SocketError extends AppError {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    logger.error(message);

    // Corrige o nome da classe no stack trace
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}
