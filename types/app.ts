'use strict';

import Homey from 'homey/lib/Homey';
import { ZoneDB } from '../utils/zones';
import { Logger } from '../utils/log';

export type Source =
  | 'dimming'
  | 'turn-on'
  | 'turn-off'
  | 'toggle'
  | 'normalize'
  | 'determine-luminence'
  | 'smart-dimming'
  | 'smart-turn-off'
  | 'app';

export interface ISmartHomeTools {
  homey: Homey;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any;
  zones: ZoneDB;
  logger: Logger;

  log(
    source: Source,
    message: string,
    properties?: Record<string, unknown>,
  ): void;
}
