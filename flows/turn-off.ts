'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlowParams } from '../utils/flows/logged';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

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

    this.info('Turning off lights in {zone}', loggedProps);

    // get lights in zone
    const devices = this._app.zones.getLightsInZone(args.zone.id);

    loggedProps.numLights = devices.length;

    this.debug('Found {numLights} lights in {zone}: {lights}', {
      ...loggedProps,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name, capabilities } of devices) {
      const deviceLoggingProps: Record<string, unknown> = {
        ...loggedProps,
        light: name,
        id,
      };

      this.debug('Turning off {light}', deviceLoggingProps);

      if (capabilities.includes('dim')) {
        this.debug('dimming {light} to 0%', deviceLoggingProps);
        await this._app.api.devices.setCapabilityValue({
          deviceId: id,
          capabilityId: 'dim',
          value: 0,
        });
      }

      this.debug('turning off {light}', deviceLoggingProps);
      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: false,
      });
    }

    this.info('Finished turning off {numCompleted} lights in {zone}', {
      ...loggedProps,
      completed: devices.map((device) => device.name),
      numCompleted: devices.length,
    });
  }
}
