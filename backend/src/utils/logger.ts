/**
 * Logger utility
 * Centralized logging for the application
 */

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

class Logger {
  private isDevelopment = process.env.NODE_ENV !== "production";

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  info(message: string, data?: any) {
    const formatted = this.formatMessage("INFO", message, data);
    console.log(formatted);
  }

  warn(message: string, data?: any) {
    const formatted = this.formatMessage("WARN", message, data);
    console.warn(formatted);
  }

  error(message: string, error?: any) {
    const formatted = this.formatMessage("ERROR", message, error);
    console.error(formatted);
  }

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage("DEBUG", message, data);
      console.debug(formatted);
    }
  }
}

export const logger = new Logger();
