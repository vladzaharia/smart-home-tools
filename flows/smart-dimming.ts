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
    const loggingProps: Record<string, unknown> = {
      zone: args.zone.name,
      dimLevel: args.level,
    };

    let { level } = args;

    this.info('dimming lights in {zone} to {dimLevel}', loggingProps);

    if (!level || typeof level !== 'number') {
      this.debug(
        'determining appropriate dim level for {dimLevel}',
        loggingProps,
      );

      const determineLuminence = new DetermineLuminence(this._app);
      const luminences = await determineLuminence._run({
        zoneType: args.zone.zoneType,
        loggingProps,
      });
      level =
        level === 'dimmed' ? luminences.luminence_dimmed : luminences.luminence;
    }
    loggingProps.dimLevel = level;

    this.debug('dimming lights to {dimLevel}', loggingProps);

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
      const deviceLoggingProps: Record<string, unknown> = {
        ...loggingProps,
        light: name,
        id,
      };
      this.info('dimming {light}', deviceLoggingProps);

      // get current dim level
      const currentDimLevel = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
      });
      deviceLoggingProps.currentDimLevel = currentDimLevel;
      this.debug('current dim level is {currentDimLevel}', deviceLoggingProps);

      const isOn = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
      });
      deviceLoggingProps.isOn = isOn;

      // check if current dim level is lower than requested one or light is off
      if (currentDimLevel < level || !isOn) {
        this.debug('dimming to {dimLevel}', deviceLoggingProps);
        // set dim level
        await this._app.api.devices.setCapabilityValue({
          deviceId: id,
          capabilityId: 'dim',
          value: level,
        });
      } else {
        this.debug(
          'dim level ({currentDimLevel}) is already higher than requested one ({dimLevel}), skipping',
          deviceLoggingProps,
        );
      }
    }
  }
}
