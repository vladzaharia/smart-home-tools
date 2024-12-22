'use strict';

import { FlowCard } from 'homey';
import { ISmartHomeTools, Source } from '../../types/app';
import { IFlow } from '../../types/flow';

export abstract class Flow<P, R> implements IFlow<P, R> {
  public _flowName: Source;
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
    const loggedProps = { flow: this._flowName, class: 'BaseFlow' };
    this._app.logger.log('debug', 'Initializing {flow}/{class}', loggedProps);

    const flow = this._app.homey.flow.getActionCard(this._flowName);

    if (this._initialized) {
      this._app.logger.log('warn', 'Flow is already initialized, skipping initialization', loggedProps);
      return flow;
    }

    this._app.logger.log('debug', 'Initializing flow {flow}', loggedProps);
    this._initialized = true;
    flow.registerRunListener(this._run.bind(this));

    this._app.logger.log('debug', 'Finished initializing {flow}/{class}', loggedProps);
    return flow;
  }
}
