'use strict';

import { ISmartHomeTools } from '../types/app';
import { Zone } from '../utils/zones';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';
import { LoggedFlow, LoggedFlowParams } from '../utils/flows/logged';

export type FlowParams = {
  level: number;
} & ZoneFlowParams &
  LoggedFlowParams;

export class Dimming extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'dimming');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);
    const loggedProps: Record<string, unknown> = {
      zone: args.zone.name,
      dimLevel: args.level,
    };

    this.info('Dimming lights in {zone} to {dimLevel}', loggedProps);

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

    this.debug('Found {numLights} lights: {lights}', {
      ...loggedProps,
      numLights: devices.length,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name } of devices) {
      this.debug('Dimming {light}', {
        ...loggedProps,
        light: name,
        id,
      });

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
        value: args.level,
      });
    }

    this.info('Finished dimming {numLights} lights in {zone} to {dimLevel}', {
      ...loggedProps,
      completed: devices.map((device) => device.name),
      numCompleted: devices.length,
    });
  }
}
