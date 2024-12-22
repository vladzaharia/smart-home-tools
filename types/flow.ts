'use strict';

import { FlowCard } from 'homey';

export interface IFlow<P, R> {
  initialize(): Promise<FlowCard>;
  _run(args: P): Promise<R>;
}
