'use strict';

import { FlowCard } from 'homey';
import { ISmartHomeTools } from '../../types/app';
import { Zone } from '../zones';
import { LoggedFlow } from './logged';

export type ZoneFlowParams = {
  zone: Zone;
} & Record<string, unknown>;

export abstract class ZoneFlow<P extends ZoneFlowParams, R> extends LoggedFlow<P, R> {
  private _zonesInitialized = false;

  override async initialize(): Promise<FlowCard> {
    this.debug('Initializing {class}/{source}', { class: 'ZoneFlow' });

    const flow = await super.initialize();
    if (this._zonesInitialized) {
      this.warn('Flow autocomplete is already initialized, skipping initialization');
      return flow;
    }

    this._zonesInitialized = true;
    this.info('Initializing autocomplete for {source}');
    flow.registerArgumentAutocompleteListener('zone', this._app.zones.getZones.bind(this._app.zones));

    this.debug('Finished initializing {class}/{source}', { class: 'ZoneFlow' });
    return flow;
  }
}
