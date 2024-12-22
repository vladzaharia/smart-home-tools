'use strict';

export interface ILoggedFlow {
  debug(message: string, properties?: Record<string, unknown>): void;
  info(message: string, properties?: Record<string, unknown>): void;
  warn(message: string, properties?: Record<string, unknown>): void;
  error(error: Error | string, properties?: Record<string, unknown>): void;
}
