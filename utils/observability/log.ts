'use strict';

import winston from 'winston';
import { SeqTransport } from '@datalust/winston-seq';
import Homey from 'homey/lib/Homey';
import HomeyInstance from 'homey';
import TransportStream from 'winston-transport';
import { SeqLoggerConfig } from 'seq-logging';
import { consoleFormat } from 'winston-console-format';
import { Source } from '../../types/app';

export type LoggerOptions = {
  homey: Homey;
};

export class Logger {
  private static instance: Logger;
  private logger: winston.Logger;

  private constructor(
    homey: Homey,
    options?: Omit<
      SeqLoggerConfig,
      'onError' | 'handleExceptions' | 'handleRejections'
    > & { logLevel?: 'debug' | 'info' | 'warn' | 'error', enableSeq?: boolean },
  ) {
    const transports: TransportStream[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize({ all: true }),
          winston.format.padLevels(),
          consoleFormat({
            showMeta: true,
            metaStrip: [
              'timestamp',
              // 'source',
              'appVersion',
              'platformVersion',
              'version',
              'platform',
              'manifest',
              'name',
            ],
            inspectOptions: {
              depth: Infinity,
              colors: true,
              maxArrayLength: Infinity,
              breakLength: 120,
              compact: Infinity,
            },
          }),
        ),
      }),
    ];

    if (options?.enableSeq === true) {
      transports.push(
        new SeqTransport({
          ...options,
          onError: (error) => {
            homey.error('Error sending log to Seq ', { error });
          },
          handleExceptions: true,
          handleRejections: true,
        }),
      );
    }

    this.logger = winston.createLogger({
      level: options?.logLevel || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json(),
      ),
      defaultMeta: {
        version: homey.version,
        appVersion: homey.manifest.version,
        platform: homey.platform,
        platformVersion: homey.platformVersion,
      },
      transports,
    });
  }

  public static initialize(homey: Homey): Logger {
    if (!Logger.instance) {
      let enableSeq = false;
      if (typeof homey === 'undefined') {
        // eslint-disable-next-line no-console
        console.error(
          'Error: missing `homey` constructor parameter, Seq redirection is disabled',
        );
      } else if (!HomeyInstance.env) {
        homey.error(
          'Error: could not access `HomeyModule.env`, Seq redirection is disabled',
        );
      } else if (typeof HomeyInstance.env.SEQ_API_KEY !== 'string') {
        homey.error(
          'Error: expected `SEQ_API_KEY` env variable, Seq redirection is disabled',
        );
      } else if (typeof HomeyInstance.env.SEQ_SERVER_URL !== 'string') {
        homey.error(
          'Error: expected `SEQ_SERVER_URL` env variable, Seq redirection is disabled',
        );
      } else {
        enableSeq = true;
      }

      Logger.instance = new Logger(homey, {
        apiKey: HomeyInstance.env.SEQ_API_KEY,
        serverUrl: HomeyInstance.env.SEQ_SERVER_URL,
        logLevel: HomeyInstance.env.LOG_LEVEL,
        enableSeq,
      });
    }
    return Logger.instance;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      throw new Error('Logger is not initialized, call initialize() first');
    }
    return Logger.instance;
  }

  /**
   * Creates a child logger with the specified source and properties.
   *
   * @param source The source of the log message.
   * @param properties Additional properties to include in the log message.
   * @returns A child logger with the specified source and properties.
   */
  public child(source: Source, properties?: Record<string, unknown>): winston.Logger {
    return this.logger.child({
      ...properties,
      source,
    });
  }

  /**
   * Logs a message with the specified level.
   *
   * @param level The level of the message (e.g., 'debug', 'info', 'warn', 'error').
   * @param message The message to log.
   * @param properties Optional properties to include in the log entry.
   * @param logger Optional logger to use. Defaults to the instance's logger.
   *
   * @see `error()` to log errors
   */
  public log(level: 'debug' | 'info' | 'warn' | 'error', message: string, properties?: Record<string, unknown>, logger = this.logger): void {
    logger[level](message, properties || {});
  }

  /**
   * Logs an error message.
   *
   * @param error The error object or error message to log.
   * @param properties Optional properties to include in the log entry.
   * @param logger Optional logger to use. Defaults to the instance's logger.
   */
  public error(
    error: Error | string,
    properties?: Record<string, unknown>,
    logger = this.logger,
  ): void {
    if (error instanceof Error) {
      const errorProperties = {
        ...properties,
        stack: error.stack,
        name: error.name,
      };
      this.log('error', error.message, errorProperties, logger);
    } else {
      this.log('error', error, properties, logger);
    }
  }
}
