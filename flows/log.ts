'use strict';

import { ISmartHomeTools } from '../types/app';
import { LoggedFlow, LoggedFlowParams } from '../utils/flows/logged';

export type FlowParams = LoggedFlowParams & {
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error';
};

export class LogFlow extends LoggedFlow<FlowParams, void> {
  constructor(app: ISmartHomeTools) {
    super(app, 'log');
  }

  override async _run(args: FlowParams): Promise<void> {
    await super._run(args);
    this._log(args.level, args.message);
  }
}
