'use strict';

import { ISmartHomeTools, Source } from '../../types/app';
import winston from 'winston';
import { Flow } from './base';
import { ILoggedFlow } from '../../types/logged';

export abstract class LoggedFlow<P, R> extends Flow<P, R> implements ILoggedFlow {
  protected _logger: winston.Logger;

  constructor(app: ISmartHomeTools, flowName: Source) {
    super(app, flowName);

    this._logger = app.logger.child(this._flowName);
  }

  /**
   * Logs an debug message.
   *
   * @param message The message to log.
   * @param properties Optional properties to include in the log entry.
   */
  public debug(message: string, properties?: Record<string, unknown>): void {
    this._log('debug', message, properties);
  }

  /**
   * Logs an info message.
   *
   * @param message The message to log.
   * @param properties Optional properties to include in the log entry.
   */
  public info(message: string, properties?: Record<string, unknown>): void {
    this._log('info', message, properties);
  }

  /**
   * Logs a warn message.
   *
   * @param message The message to log.
   * @param properties Optional properties to include in the log entry.
   */
  public warn(message: string, properties?: Record<string, unknown>): void {
    this._log('warn', message, properties);
  }

  /**
   * Logs an error message.
   *
   * @param error The error object or error message to log.
   * @param properties Optional properties to include in the log entry.
   */
  public error(
    error: Error | string,
    properties?: Record<string, unknown>,
  ): void {
    this._app.logger.error(error, properties, this._logger);
  }

  protected _log(level: 'debug' | 'info' | 'warn' | 'error', message: string, properties?: Record<string, unknown>): void {
    this._app.logger.log(level, message, properties || {}, this._logger);
  }
}
