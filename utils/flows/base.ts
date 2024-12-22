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
  }

  async _run(args: P): Promise<R> {
    // nop
    return {} as R;
  }

  async initialize(): Promise<FlowCard> {
    this._app.logger.log('debug', 'Initializing {class}/{source}', { source: this._flowName, class: 'BaseFlow' });

    const flow = this._app.homey.flow.getActionCard(this._flowName);

    if (this._initialized) {
      this._app.logger.log('warn', 'Flow is already initialized, skipping initialization');
      return flow;
    }

    this._app.logger.log('info', 'Initializing flow {source}', { source: this._flowName });
    this._initialized = true;
    flow.registerRunListener(this._run.bind(this));

    this._app.logger.log('debug', 'Finished initializing {class}/{source}', { source: this._flowName, class: 'BaseFlow' });
    return flow;
  }
}
