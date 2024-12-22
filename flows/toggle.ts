'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlowParams } from '../utils/flows/logged';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';

export type FlowParams = ZoneFlowParams & LoggedFlowParams;

export class Toggle extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'toggle');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);
    const loggedProps: Record<string, unknown> = {
      zone: args.zone.name,
    };

    this.debug('Toggling lights in {zone}', loggedProps);

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
    loggedProps.numLights = devices.length;

    this.debug('Found {numLights} lights: {lights}', {
      ...loggedProps,
      lights: devices.map((device) => device.name),
    });

    for (const { id, name } of devices) {
      // get current state
      const isOn = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
      });

      this.debug('Toggling {light} from {currVal} to {newVal}', {
        ...loggedProps,
        light: name,
        id,
        currVal: isOn,
        newVal: !isOn,
      });

      await this._app.api.devices.setCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
        value: !isOn,
      });
    }

    this.info('Finished toggling {numCompleted} lights in {zone}', {
      ...loggedProps,
      completed: devices.map((device) => device.name),
      numCompleted: devices.length,
    });
  }
}
