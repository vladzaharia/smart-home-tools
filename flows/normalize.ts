'use strict';

import { ISmartHomeTools } from '../types/app';
import { Flow } from '../utils/flows/base';

export class Normalize extends Flow<void, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'normalize');
  }

  override async _run(): Promise<void> {
    await super._run();

    // Refresh zones to ensure we have the latest activity data
    await this._app.zones._refresh(this._app.api);

    this.log('normalizing lights throughout the house');

    // get all automatic lights
    const devices = this._app.zones
      .getDevices()
      .filter(
        (device) =>
          device.class === 'light' &&
          device.capabilities.includes('onoff') &&
          device.isAutomatic,
      );

    this.log(
      `found ${devices.length} lights: ${devices
        .map((device) => device.name)
        .join(', ')}`,
    );

    for (const { id, name, zone } of devices) {
      if (new Date().getTime() - new Date(this._app.zones.getZone(zone)!.activeLastUpdated).getTime() < 5 * 60 * 1000) {
        this.log(`zone ${zone} is still active, skipping trying to turn off ${name} (id ${id})`);
        continue;
      }

      this.log(`turning off ${name} (id ${id})`);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: false,
      });
    }

    // get all night lights
    const nightLights = this._app.zones
      .getDevices()
      .filter(
        (device) =>
          device.class === 'light' &&
          device.name.toLowerCase().includes('night light'),
      );

    this.log(
      `found ${nightLights.length} night lights: ${nightLights
        .map((device) => device.name)
        .join(', ')}`,
    );

    for (const { id, name } of nightLights) {
      this.log(`dimming ${name} (id ${id})`);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: true,
      });
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
        value: 75,
      });
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
