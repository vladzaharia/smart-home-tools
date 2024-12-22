'use strict';

import { ISmartHomeTools } from '../types/app';
import { DetermineLuminence } from './determine-luminence';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export type FlowParams = {
  level?: number | 'standard' | 'dimmed';
} & ZoneFlowParams;

export class SmartDimming extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'smart-dimming');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    let { level } = args;

    if (!level || typeof level !== 'number') {
      const determineLuminence = new DetermineLuminence(this._app);
      const luminences = await determineLuminence._run({
        zoneType: args.zone.zoneType,
      });
      level =
        level === 'dimmed' ? luminences.luminence_dimmed : luminences.luminence;
    }

    this.log(`dimming lights in zone ${args.zone.name} to ${level}`);

    // get lights in zone
    const devices = this._app.zones.getDevicesByZone(args.zone.id).filter((device) => {
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

      // get current dim level
      const currentDimLevel = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
      });

      // check if current dim level is lower than requested one
      if (currentDimLevel < level) {
        // turn on first to prevent flashing
        await this._app.api.devices.setCapabilityValue({
          deviceId: id,
          capabilityId: 'onoff',
          value: true,
        });
      }

      // set dim level
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
        value: level,
      });
    }
  }
}
