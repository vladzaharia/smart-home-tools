'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlowParams } from '../utils/flows/logged';
import { ZoneFlow, ZoneFlowParams } from '../utils/flows/zone';
import { TurnOff } from './turn-off';

export type FlowParams = ZoneFlowParams & LoggedFlowParams;

export class SmartTurnOff extends ZoneFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'smart-turn-off');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);

    const turnOff = new TurnOff(this._app);
    await turnOff._run(args);
  }
}
