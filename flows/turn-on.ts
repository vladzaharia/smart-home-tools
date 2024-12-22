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

    this.log(`turning on lights in zone ${args.zone.name}`);

    // get lights in zone
    const devices = this._app.zones.getDevicesByZone(args.zone.id).filter((device) => {
      return (
        device.class === 'light' &&
        device.capabilities.includes('onoff') &&
        device.isAutomatic
      );
    });

    this.log(
      `found ${devices.length} lights: ${devices
        .map((device) => device.name)
        .join(', ')}`,
    );

    for (const { id, name } of devices) {
      this.log(`turning on ${name} (id ${id})`);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: true,
      });
    }
  }
}
