'use strict';

import { ISmartHomeTools } from '../types/app';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export type FlowParams = ZoneFlowParams;

export class TurnOn extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'turn-on');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    const loggingProps: Record<string, unknown> = {
      zone: args.zone.name,
    };

    this.debug('turning on lights in {zone}', loggingProps);

    // get lights in zone
    const devices = this._app.zones.getDevicesByZone(args.zone.id).filter((device) => {
      return (
        device.class === 'light'
        && device.capabilities.includes('onoff')
        && device.isAutomatic
      );
    });

    this.debug('found {numLights} lights: {lights}', {
      ...loggingProps,
      numLights: devices.length,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name } of devices) {
      const deviceLoggingProps: Record<string, unknown> = {
        ...loggingProps,
        light: name,
        id,
      };

      this.debug('turning on {light}', deviceLoggingProps);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: true,
      });
    }
  }
}
