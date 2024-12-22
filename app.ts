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
import { IFlow } from './types/flow';

module.exports = class SmartHomeTools
  extends Homey.App
  implements ISmartHomeTools
{
  public logger!: Logger;
  public api!: HomeyAPI;
  public zones!: ZoneDB;
  private _flows: IFlow<unknown, unknown>[] = [];

  /**
   * onInit is called when the init is initialized.
   */
  async onInit() {
    this.logger = Logger.initialize(this.homey);
    this.log('initialization', 'Initializing SmartHomeTools', {
      manifest: this.manifest,
    });

    // Create a HomeyAPI instance. Ensure your init has the `homey:manager:api` permission.
    this.log('initialization', 'Initializing HomeyAPI', {}, 'debug');
    this.api = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });
    this.log(
      'initialization',
      'Finished initializing HomeyAPI',
      { api: this.api },
      'debug',
    );

    // Create a ZoneDB instance
    this.log('initialization', 'Initializing ZoneDB', {}, 'debug');
    this.zones = new ZoneDB(this);
    await this.zones._refresh(this.api);
    this.log(
      'initialization',
      'Finished initializing ZoneDB with {numZones} zones and {numDevices} devices',
      {
        zones: this.zones.getZones().map((zone) => zone.name),
        devices: this.zones.getDevices().map((device) => device.name),
        numZones: this.zones.getZones().length,
        numDevices: this.zones.getDevices().length,
      },
      'debug',
    );

    // Register flows
    if (this._flows.length > 0) {
      this.log(
        'initialization',
        'Flows are already initialized, skipping initialization',
        { flows: this._flows.map((f) => f._flowName) },
        'warn',
      );
    } else {
      this.log('initialization', 'Initializing flows', {}, 'debug');
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
      this.log(
        'initialization',
        'Finished initializing flows!',
        { flows: this._flows.map((f) => f._flowName) },
        'debug',
      );
    }

    // Log success
    this.log('initialization', 'SmartHomeTools has been initialized!');
  }

  log(
    resource: Source,
    message: string,
    properties?: Record<string, unknown>,
    level: 'debug' | 'info' | 'warn' | 'error' = 'info',
  ) {
    this.logger.log(level, message, {
      ...properties,
      resource,
    });
  }
};
