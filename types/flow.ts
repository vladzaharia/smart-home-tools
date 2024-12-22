'use strict';

import { FlowCard } from 'homey';
import { LoggedFlow } from './log';

export interface IFlow<P, R> extends LoggedFlow {
  initialize(): Promise<FlowCard>;
  _run(args: P): Promise<R>;
}
