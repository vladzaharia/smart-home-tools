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
import { Logger } from './utils/log';

module.exports = class SmartHomeTools extends Homey.App implements ISmartHomeTools {
  public logger!: Logger;
  public api!: HomeyAPI;
  public zones!: ZoneDB;

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.logger = Logger.initialize(this.homey);
    this.log('app', 'Initializing SmartHomeTools', { manifest: this.manifest });

    // Create a HomeyAPI instance. Ensure your app has the `homey:manager:api` permission.
    this.api = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });

    // Create a ZoneDB instance
    this.zones = new ZoneDB(this);

    // Register flows
    await new DetermineLuminence(this);
    await new SmartDimming(this);
    await new SmartTurnOff(this);
    await new Dimming(this);
    await new Toggle(this);
    await new TurnOff(this);
    await new TurnOn(this);
    await new Normalize(this);

    // Log success
    this.log('app', 'SmartHomeTools has been initialized');
  }

  log(source: Source, message: string, properties?: Record<string, unknown>) {
    this.logger.info(message, {
      ...properties,
      source,
    });
  }
};
