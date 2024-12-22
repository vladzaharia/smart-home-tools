'use strict';

import { FlowCard } from 'homey';
import { Source } from './app';

export interface IFlow<P, R> {
  _flowName: Source;
  initialize(): Promise<FlowCard>;
  _run(args: P): Promise<R>;
}
