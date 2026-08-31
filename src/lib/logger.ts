// Structured Production Logger for GODMODE Intelligence Terminal
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogContext {
  route?: string;
  feed?: string;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private format(level: LogLevel, message: string, context?: LogContext, error?: Error | unknown): string {
    const payload: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context || {}),
    };

    if (error instanceof Error) {
      payload.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      payload.error = String(error);
    }

    return JSON.stringify(payload);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("DEBUG", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.info(this.format("INFO", message, context));
  }

  warn(message: string, context?: LogContext, error?: Error | unknown): void {
    console.warn(this.format("WARN", message, context, error));
  }

  error(message: string, context?: LogContext, error?: Error | unknown): void {
    console.error(this.format("ERROR", message, context, error));
  }
}

export const logger = new Logger();
