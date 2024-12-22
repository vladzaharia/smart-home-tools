'use strict';

import { FlowCard } from 'homey';
import { ISmartHomeTools } from '../../types/app';
import { Zone } from '../zones';
import { LoggedFlow } from './logged';

export type ZoneFlowParams = {
  zone: Zone;
} & Record<string, unknown>;

export abstract class ZoneFlow<P extends ZoneFlowParams, R> extends LoggedFlow<
  P,
  R
> {
  private _zonesInitialized = false;

  override async initialize(): Promise<FlowCard> {
    const loggedProps = { flow: this._flowName, class: 'ZoneFlow' };
    this.debug('Initializing {flow}/{class}', loggedProps);

    const flow = await super.initialize();
    if (this._zonesInitialized) {
      this.warn(
        'Flow autocomplete is already initialized, skipping initialization',
        loggedProps,
      );
      return flow;
    }

    this._zonesInitialized = true;
    this.debug('Initializing autocomplete for {flow}', loggedProps);
    flow.registerArgumentAutocompleteListener(
      'zone',
      this._app.zones.getZones.bind(this._app.zones),
    );

    this.debug('Finished initializing {flow}/{class}', loggedProps);
    return flow;
  }
}
