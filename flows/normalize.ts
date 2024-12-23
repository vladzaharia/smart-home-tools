'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlow, LoggedFlowParams } from '../utils/flows/logged';

export class Normalize extends LoggedFlow<LoggedFlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'normalize');
  }

  override async _run(): Promise<void> {
    await super._run({});
    const loggedProps: Record<string, unknown> = { flow: this._flowName };

    // Refresh zones to ensure we have the latest activity data
    await this._app.zones._refresh(this._app.api);

    this.debug('Normalizing lights throughout the house');

    // get all automatic lights
    const devices = this._app.zones
      .getDevices()
      .filter(
        (device) =>
          device.class === 'light' &&
          device.capabilities.includes('onoff') &&
          device.isAutomatic,
      );
    loggedProps.numLights = devices.length;
    loggedProps.completed = [];
    loggedProps.skipped = [];

    this.debug('Found {numLights} lights: {lights}', {
      ...loggedProps,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name, zone, capabilities } of devices) {
      const deviceLoggedProps: Record<string, unknown> = {
        ...loggedProps,
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
          deviceLoggedProps,
        );
        (loggedProps.skipped as string[]).push(name);
        continue;
      }

      const deviceLoggingProps: Record<string, unknown> = {
        ...loggedProps,
        light: name,
        id,
      };

      this.debug('Turning off {light}', deviceLoggingProps);

      if (capabilities.includes('dim')) {
        this.debug('dimming {light} to 0%', deviceLoggingProps);
        await this._app.api.devices.setCapabilityValue({
          deviceId: id,
          capabilityId: 'dim',
          value: 0,
        });
      }

      this.debug('turning off {light}', deviceLoggingProps);
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: false,
      });
      (loggedProps.completed as string[]).push(name);
    }

    // get all night lights
    const nightLights = this._app.zones
      .getDevices()
      .filter(
        (device) =>
          device.class === 'light' &&
          device.name.toLowerCase().includes('night light'),
      );
    loggedProps.numNightLights = nightLights.length;

    this.debug('Found {numLights} night lights: {lights}', {
      ...loggedProps,
      nightLights: nightLights.map((device) => device.name),
    });

    for (const { id, name } of nightLights) {
      const deviceLoggedProps: Record<string, unknown> = {
        ...loggedProps,
        light: name,
        id,
        dimLevel: 0.75,
        temperature: 0.64,
      };
      this.debug('Dimming {light} to {dimLevel}', deviceLoggedProps);

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

      this.debug(
        'Setting {light} temperature to {temperature}',
        deviceLoggedProps,
      );
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

    this.info(
      'Finished turning off {numCompleted} lights and normalizing {numNightLights} night lights, skipped {skipped}',
      {
        ...loggedProps,
        numCompleted: (loggedProps.completed as string[]).length,
        numSkipped: (loggedProps.skipped as string[]).length,
        nightLights: nightLights.map((device) => device.name),
      },
    );
  }
}
