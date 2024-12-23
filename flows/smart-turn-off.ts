'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlowParams } from '../utils/flows/logged';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';
import { Zone } from '../utils/zones';
import { TurnOff } from './turn-off';

export type FlowParams = ZoneFlowParams & LoggedFlowParams;

export class SmartTurnOff extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'smart-turn-off');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    const loggedProps: Record<string, unknown> = {
      zone: args.zone,
    };

    this.info('Attempting to turn off lights in {zone.name}', loggedProps);

    const zone: Zone = await this._app.api.zones.getZone({ id: args.zone.id });
    loggedProps.zone = zone;
    this.debug('Retrieved latest zone data: {zone.name}', loggedProps);

    if (new Date(zone.activeLastUpdated).getTime() > Date.now() - 1000 * 60 * 5) {
      this.info('{zone.name} is still active, skipping', loggedProps);
      return;
    }

    // Turn off lights using regular turn off flow
    const turnOffFlow = new TurnOff(this._app);
    await turnOffFlow._run({
      zone: args.zone,
      correlationId: this._loggedProps.runId as string,
    });
  }
}
