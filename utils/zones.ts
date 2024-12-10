'use strict';

import { getIcon } from './icons';

export class ZoneDB {
  private _zones: Zone[] = [];

  constructor(homeyApi: any) {
    this._init(homeyApi);
  }

  private async _init(homeyApi: any) {
    const zones: Zone[] = await Object.values(
      await homeyApi.zones.getZones(),
    );
    this._zones = zones.map((zone: Zone) => ({
      ...zone,
      icon: getIcon(zone.icon),
    }));
  }

  public getZones(query?: string) {
    return query
      ? (this._zones.filter((zone: Zone) =>
          zone.name.toLowerCase().includes(query.toLowerCase()),
        ) as Zone[])
      : this._zones;
  }

  public getZone(id: string) {
    return this._zones.find((zone: Zone) => zone.id === id);
  }
}

export type Zone = {
  id: string;
  name: string;
  icon: string;
  parent: string;
  active: boolean;
};
