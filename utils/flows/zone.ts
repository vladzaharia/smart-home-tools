'use strict';

import { FlowCard } from 'homey';
import { ISmartHomeTools } from '../../types/app';
import { Zone } from '../zones';
import { Flow } from './base';

export type ZoneFlowParams = {
  zone: Zone;
} & Record<string, unknown>;

export abstract class ZoneFlow<P extends ZoneFlowParams, R> extends Flow<P, R> {
  override async initialize(): Promise<FlowCard> {
    const flow = await super.initialize();
    flow.registerArgumentAutocompleteListener('zone', async (query) => {
      return this._app.zones.getZones(query);
    });
    return flow;
  }
}
