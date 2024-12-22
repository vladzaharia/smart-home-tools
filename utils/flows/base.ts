'use strict';

import { FlowCard } from 'homey';
import { ISmartHomeTools, Source } from '../../types/app';
import { IFlow } from '../../types/flow';

export abstract class Flow<P, R> implements IFlow<P, R> {
  protected _flowName: Source;
  protected _app!: ISmartHomeTools;
  private _initialized = false;

  constructor(app: ISmartHomeTools, flowName: Source) {
    this._flowName = flowName;
    this._app = app;

    this.initialize().catch((err) => {
      this.log(`Error initializing flow ${this._flowName}`, { err });
    });

    this.log('Flow initialized', { name: this._flowName });
  }

  async _run(args: P): Promise<R> {
    if (!this._initialized) {
      throw new Error('Flow is not initialized! Call initialize() first.');
    }

    // nop, sublasses should override and call super._run()
    return {} as R;
  }

  async initialize(): Promise<FlowCard> {
    this._initialized = true;

    const flow = this._app.homey.flow.getActionCard(this._flowName);
    flow.registerRunListener(async (args: P) => this._run(args));
    return flow;
  }

  log(message: string, properties?: Record<string, unknown>): void {
    this._app.log(this._flowName, message, properties || {});
  }
}
