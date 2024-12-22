'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlow } from '../utils/flows/logged';
import { TurnOffLight } from './turn-off';

export class Normalize extends LoggedFlow<void, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'normalize');
  }

  override async _run(): Promise<void> {
    await super._run();

    // Refresh zones to ensure we have the latest activity data
    await this._app.zones._refresh(this._app.api);

    this.info('normalizing lights throughout the house');

    // get all automatic lights
    const devices = this._app.zones
      .getDevices()
      .filter(
        (device) =>
          device.class === 'light' &&
          device.capabilities.includes('onoff') &&
          device.isAutomatic,
      );

    this.debug('found {numLights} lights: {lights}', {
      numLights: devices.length,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name, zone, capabilities } of devices) {
      const loggingProps: Record<string, unknown> = {
        zone,
        light: name,
        id,
      };
      if (
        new Date().getTime() -
          new Date(this._app.zones.getZone(zone)!.activeLastUpdated).getTime() <
        5 * 60 * 1000
      ) {
        this.debug(
          '{zone} is still active, skipping trying to turn off {light}',
          loggingProps,
        );
        continue;
      }

      this.debug('turning off {light}', loggingProps);
      await TurnOffLight(
        this._app,
        id,
        name,
        capabilities,
        loggingProps,
        this.debug.bind(this),
      );
    }

    // get all night lights
    const nightLights = this._app.zones
      .getDevices()
      .filter(
        (device) =>
          device.class === 'light' &&
          device.name.toLowerCase().includes('night light'),
      );

    this.debug('found {numLights} night lights: {lights}', {
      numLights: nightLights.length,
      lights: nightLights.map((device) => device.name),
    });

    for (const { id, name } of nightLights) {
      const loggingProps: Record<string, unknown> = {
        light: name,
        id,
        dimLevel: 0.75,
        temperature: 0.64,
      };
      this.debug('dimming {light} to {dimLevel}', loggingProps);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: true,
      });
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
        value: 0.75,
      });

      this.debug('setting {light} to temperature {temperature}', loggingProps);
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'light_mode',
        value: 'temperature',
      });
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'light_temperature',
        value: '0.64',
      });
    }
  }
}
