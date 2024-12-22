'use strict';

import { ISmartHomeTools } from '../types/app';
import { Zone } from '../utils/zones';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';
import { LoggedFlow } from '../utils/flows/logged';

export type FlowParams = {
  level: number;
} & ZoneFlowParams;

export class Dimming extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'dimming');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);
    const loggingProps: Record<string, unknown> = {
      zone: args.zone.name,
      dimLevel: args.level,
    };

    this.info('dimming lights in {zone} to {dimLevel}', loggingProps);

    // get lights in zone
    const devices = this._app.zones
      .getDevicesByZone(args.zone.id)
      .filter((device) => {
        return (
          device.class === 'light' &&
          device.capabilities.includes('dim') &&
          device.isAutomatic
        );
      });

    this.debug('found {numLights} lights: {lights}', {
      ...loggingProps,
      numLights: devices.length,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name } of devices) {
      this.debug('dimming {light}', {
        ...loggingProps,
        light: name,
        id,
      });

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
        value: args.level,
      });
    }
  }
}
