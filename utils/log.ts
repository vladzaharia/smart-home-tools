'use strict';

import winston from 'winston';
import { SeqTransport } from '@datalust/winston-seq';
import Homey from 'homey/lib/Homey';
import HomeyInstance from 'homey';
import TransportStream from 'winston-transport';
import { SeqLoggerConfig } from 'seq-logging';
import { consoleFormat } from 'winston-console-format';

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
    >,
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
              'source',
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

    if (options) {
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
      level: 'info',
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
      let useSeq = false;
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
        useSeq = true;
      }

      if (useSeq) {
        Logger.instance = new Logger(homey, {
          apiKey: HomeyInstance.env.SEQ_API_KEY,
          serverUrl: HomeyInstance.env.SEQ_SERVER_URL,
        });
      } else {
        Logger.instance = new Logger(homey);
      }
    }
    return Logger.instance;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      throw new Error('Logger is not initialized, call initialize() first');
    }
    return Logger.instance;
  }

  public info(message: string, properties?: Record<string, unknown>): void {
    this.logger.info(message, properties || {});
  }

  public error(
    error: Error | string,
    properties?: Record<string, unknown>,
  ): void {
    if (error instanceof Error) {
      const errorProperties = {
        ...properties,
        stack: error.stack,
        name: error.name,
      };
      this.logger.error(error.message, errorProperties);
    } else {
      this.logger.error(error, properties || {});
    }
  }
}
