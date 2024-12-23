'use strict';

import { ISmartHomeTools } from '../types/app';
import { DetermineLuminence } from './determine-luminence';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';
import { LoggedFlowParams } from '../utils/flows/logged';

export type FlowParams = {
  level?: number | 'standard' | 'dimmed';
} & ZoneFlowParams &
  LoggedFlowParams;

export class SmartDimming extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'smart-dimming');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);
    const loggedProps: Record<string, unknown> = {
      zone: args.zone.name,
      dimLevel: args.level || 'default',
    };

    let { level } = args;

    this.info('Dimming lights in {zone} to {dimLevel}', loggedProps);

    if (typeof level !== 'number') {
      this.debug(
        'Determining appropriate dim level for {dimLevel}',
        loggedProps,
      );

      const determineLuminence = new DetermineLuminence(this._app);
      const luminences = await determineLuminence._run({
        zoneType: args.zone.zoneType,
        loggedProps,
        correlationId: this._loggedProps.runId as string,
        caller: 'smart-dimming',
      });
      level =
        level === 'dimmed' ? luminences.luminence_dimmed : luminences.luminence;
    }
    loggedProps.dimLevel = level;

    this.debug('Dimming lights to {dimLevel}', loggedProps);

    // get lights in zone
    const devices = this._app.zones.getLightsInZone(args.zone.id, 'dim');
    loggedProps.numLights = devices.length;

    this.debug('Found {numLights} lights in {zone}: {lights}', {
      ...loggedProps,
      lights: devices.map((device) => device.name),
    });

    loggedProps.completed = [];
    loggedProps.skipped = [];
    for (const { id, name } of devices) {
      const deviceLoggingProps: Record<string, unknown> = {
        ...loggedProps,
        light: name,
        id,
      };
      this.debug('Dimming {light} to {dimLevel}', deviceLoggingProps);

      // get current dim level
      const currentDimLevel = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'dim',
      });
      deviceLoggingProps.currentDimLevel = currentDimLevel;
      this.debug('{light}\'s dim level is {currentDimLevel}', deviceLoggingProps);

      const isOn = await this._app.api.devices.getCapabilityValue({
        deviceId: id,
        capabilityId: 'onoff',
      });
      deviceLoggingProps.isOn = isOn;

      // check if current dim level is lower than requested one or light is off
      if (currentDimLevel < level || !isOn) {
        this.debug('Dimming {light} to {dimLevel}', deviceLoggingProps);
        // set dim level
        await this._app.api.devices.setCapabilityValue({
          deviceId: id,
          capabilityId: 'dim',
          value: level,
        });
        (loggedProps.completed as string[]).push(name);
      } else {
        this.debug(
          'Dim level for {light} ({currentDimLevel}) is already higher than requested ({dimLevel}), skipping',
          deviceLoggingProps,
        );
        (loggedProps.skipped as string[]).push(name);
      }
    }

    this.info(
      'Finished dimming {numCompleted} lights in {zone} to {dimLevel}, skipped {skipped}',
      {
        ...loggedProps,
        numCompleted: (loggedProps.completed as string[]).length,
        numSkipped: (loggedProps.skipped as string[]).length,
      },
    );
  }
}
