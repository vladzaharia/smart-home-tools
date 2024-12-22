'use strict';

import { ISmartHomeTools } from '../types/app';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export async function TurnOffLight(
  app: ISmartHomeTools,
  deviceId: string,
  deviceName: string,
  capabilities: string[],
  loggingProps: Record<string, unknown>,
  log: (message: string, properties?: Record<string, unknown>) => void,
) {
  const deviceLoggingProps: Record<string, unknown> = {
    ...loggingProps,
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

export type FlowParams = ZoneFlowParams;

export class TurnOff extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'turn-off');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    const loggingProps: Record<string, unknown> = {
      zone: args.zone.name,
    };

    this.debug('turning off lights in {zone}', loggingProps);

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

    this.debug('found {numLights} lights: {lights}', {
      ...loggingProps,
      numLights: devices.length,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name, capabilities } of devices) {
      await TurnOffLight(
        this._app,
        id,
        name,
        capabilities,
        loggingProps,
        this.debug,
      );
    }
  }
}
