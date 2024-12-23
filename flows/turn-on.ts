'use strict';

import { ISmartHomeTools } from '../types/app';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';
import { LoggedFlowParams } from '../utils/flows/logged';

export type FlowParams = ZoneFlowParams & LoggedFlowParams;

export class TurnOn extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'turn-on');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    const loggedProps: Record<string, unknown> = {
      zone: args.zone.name,
    };

    this.debug('Turning on lights in {zone}', loggedProps);

    // get lights in zone
    const devices = this._app.zones.getLightsInZone(args.zone.id);

    loggedProps.numLights = devices.length;

    this.debug('Found {numLights} lights in {zone}: {lights}', {
      ...loggedProps,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name } of devices) {
      const deviceLoggingProps: Record<string, unknown> = {
        ...loggedProps,
        light: name,
        id,
      };

      this.debug('Turning on {light}', deviceLoggingProps);

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: true,
      });
    }

    this.info('Finished turning on {numCompleted} lights in {zone}', {
      ...loggedProps,
      completed: devices.map((device) => device.name),
      numCompleted: devices.length,
    });
  }
}
