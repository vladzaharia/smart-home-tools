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
    const loggingProps: Record<string, unknown> = {
      zone: args.zone.name,
    };

    this.debug('toggling lights in {zone}', loggingProps);

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
      // get current state
      const isOn = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
      });

      this.debug('toggling {light} from {currVal} to {newVal}', {
        ...loggingProps,
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
  }
}
