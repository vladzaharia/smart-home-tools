'use strict';

import { HomeyAPI } from 'homey-api';
import Homey from 'homey';

import { DetermineLuminence } from './flows/determine-luminence';
import { SmartDimming } from './flows/smart-dimming';
import { SmartTurnOff } from './flows/smart-turn-off';
import { Dimming } from './flows/dimming';
import { Toggle } from './flows/toggle';
import { TurnOff } from './flows/turn-off';
import { TurnOn } from './flows/turn-on';
import { Normalize } from './flows/normalize';
import { ZoneDB } from './utils/zones';
import { ISmartHomeTools, Source } from './types/app';
import { Logger } from './utils/observability/log';
import { IFlow } from './types/flow';

module.exports = class SmartHomeTools extends Homey.App implements ISmartHomeTools {
  public logger!: Logger;
  public api!: HomeyAPI;
  public zones!: ZoneDB;
  private _flows: IFlow<unknown, unknown>[] = [];

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.logger = Logger.initialize(this.homey);
    this.log('app', 'Initializing SmartHomeTools', { manifest: this.manifest });

    // Create a HomeyAPI instance. Ensure your app has the `homey:manager:api` permission.
    this.log('app', 'Initializing HomeyAPI', {}, 'debug');
    this.api = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });
    this.log('app', 'Finished initializing HomeyAPI', {}, 'debug');

    // Create a ZoneDB instance
    this.log('app', 'Initializing ZoneDB', {}, 'debug');
    this.zones = new ZoneDB(this);
    this.log('app', 'Finished initializing ZoneDB', {}, 'debug');

    // Register flows
    if (this._flows.length > 0) {
      this.log('app', 'Flows are already initialized, skipping initialization', {}, 'warn');
    } else {
      this.log('app', 'Initializing flows', {}, 'debug');
      const determineLuminence = new DetermineLuminence(this);
      await determineLuminence.initialize();
      this._flows.push(determineLuminence);

      const smartDimming = new SmartDimming(this);
      await smartDimming.initialize();
      this._flows.push(smartDimming);

      const smartTurnOff = new SmartTurnOff(this);
      await smartTurnOff.initialize();
      this._flows.push(smartTurnOff);

      const dimming = new Dimming(this);
      await dimming.initialize();
      this._flows.push(dimming);

      const toggle = new Toggle(this);
      await toggle.initialize();
      this._flows.push(toggle);

      const turnOff = new TurnOff(this);
      await turnOff.initialize();
      this._flows.push(turnOff);

      const turnOn = new TurnOn(this);
      await turnOn.initialize();
      this._flows.push(turnOn);

      const normalize = new Normalize(this);
      await normalize.initialize();
      this._flows.push(normalize);
      this.log('app', 'Finished initializing flows!', {}, 'debug');
    }

    // Log success
    this.log('app', 'SmartHomeTools has been initialized!');
  }

  log(source: Source, message: string, properties?: Record<string, unknown>, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logger.log(level, message, {
      ...properties,
      source,
    });
  }
};
