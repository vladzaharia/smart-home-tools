'use strict';

import Homey from 'homey/lib/Homey';
import { ZoneDB } from '../utils/zones/zones';
import { Logger } from '../utils/log';

export type Source =
  | 'dimming'
  | 'turn-on'
  | 'turn-off'
  | 'toggle'
  | 'normalize'
  | 'determine-luminence'
  | 'smart-dimming'
  | 'smart-dimming-level'
  | 'smart-turn-off'
  | 'initialization'
  | 'log';

export interface ISmartHomeTools {
  homey: Homey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any;
  zones: ZoneDB;
  logger: Logger;

  log(
    resource: Source,
    message: string,
    properties?: Record<string, unknown>,
    level?: 'debug' | 'info' | 'warn' | 'error',
  ): void;
}
