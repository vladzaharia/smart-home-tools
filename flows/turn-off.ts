'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlowParams } from '../utils/flows/logged';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export async function TurnOffLight(
  app: ISmartHomeTools,
  deviceId: string,
  deviceName: string,
  capabilities: string[],
  loggedProps: Record<string, unknown>,
  log: (message: string, properties?: Record<string, unknown>) => void,
) {
  const deviceLoggingProps: Record<string, unknown> = {
    ...loggedProps,
    light: deviceName,
    id: deviceId,
  };

  if (capabilities.includes('dim')) {
    log('dimming {light} to 0%', deviceLoggingProps);
    await app.api.devices.setCapabilityValue({
      deviceId,
      capabilityId: 'dim',
      value: 0,
    });
  }

  log('turning off {light}', deviceLoggingProps);
  await app.api.devices.setCapabilityValue({
    deviceId,
    capabilityId: 'onoff',
    value: false,
  });
}

export type FlowParams = ZoneFlowParams & LoggedFlowParams;

export class TurnOff extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'turn-off');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    const loggedProps: Record<string, unknown> = {
      zone: args.zone.name,
    };

    this.debug('Turning off lights in {zone}', loggedProps);

    // get lights in zone
    const devices = this._app.zones
      .getDevicesByZone(args.zone.id)
      .filter((device) => {
        return (
          device.class === 'light' &&
          device.capabilities.includes('onoff') &&
          device.isAutomatic
        );
      });
    loggedProps.numLights = devices.length;

    this.debug('Found {numLights} lights: {lights}', {
      ...loggedProps,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name, capabilities } of devices) {
      this.debug('Turning off {light}', {
        ...loggedProps,
        light: name,
        id,
      });

      await TurnOffLight(
        this._app,
        id,
        name,
        capabilities,
        loggedProps,
        this.debug,
      );
    }

    this.info('Finished turning off {numLights} lights in {zone}', loggedProps);
  }
}
