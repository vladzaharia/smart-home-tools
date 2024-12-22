'use strict';

import { ISmartHomeTools } from '../types/app';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export type FlowParams = ZoneFlowParams;

export class Toggle extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'toggle');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    this.log(`toggling lights in zone ${args.zone.name}`);

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
      // get current state
      const isOn = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
      });

      this.log(`toggling ${name} (id ${id}) from ${isOn} to ${!isOn}`);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: !isOn,
      });
    }
  }
}
