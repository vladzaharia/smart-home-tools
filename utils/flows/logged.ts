'use strict';

import { ISmartHomeTools, Source } from '../../types/app';
import winston from 'winston';
import { Flow } from './base';
import { ILoggedFlow } from '../../types/logged';
import { v7 as uuid } from 'uuid';

export type LoggedFlowParams = {
    correlationId?: string;
  } & Record<string, unknown>;

export abstract class LoggedFlow<P extends LoggedFlowParams, R> extends Flow<P, R> implements ILoggedFlow {
  protected _logger: winston.Logger;
  protected _loggedProps: Record<string, unknown> = {};

  constructor(app: ISmartHomeTools, flowName: Source) {
    super(app, flowName);

    this._logger = app.logger.child(this._flowName);
  }

  override async _run(args: P): Promise<R> {
    this._loggedProps = {
      runId: args.correlationId ?? uuid(),
    };

    // nop
    return {} as R;
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
    this._app.logger.error(error, { ...this._loggedProps, ...properties }, this._logger);
  }

  protected _log(level: 'debug' | 'info' | 'warn' | 'error', message: string, properties?: Record<string, unknown>): void {
    this._app.logger.log(level, message, { ...this._loggedProps, ...properties }, this._logger);
  }
}
