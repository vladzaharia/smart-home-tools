'use strict';

import { ISmartHomeTools } from '../types/app';
import { Zone } from '../utils/zones';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export type FlowParams = {
  level: number;
} & ZoneFlowParams;

export class Dimming extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'dimming');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    this.log(`dimming lights in zone ${args.zone.name} to ${args.level}`);

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

    this.log(
      `found ${devices.length} lights: ${devices
        .map((device) => device.name)
        .join(', ')}`,
    );

    for (const { id, name } of devices) {
      this.log(`dimming ${name} (id ${id})`);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
        value: args.level,
      });
    }
  }
}
