/* eslint-disable function-paren-newline */
/* eslint-disable implicit-arrow-linebreak */

'use strict';

import { ISmartHomeTools } from '../../types/app';
import { getIcon } from '../icons';
import { Device, GetDeviceModel } from './devices';

export type Zone = {
  id: string;
  name: string;
  icon: string;
  parent: string;
  active: boolean;
  activeLastUpdated: string;

  // What type of zone this is, for determining luminence
  zoneType: 'room' | 'hallway';
};

export class ZoneDB {
  private _zones: Zone[] = [];
  private _devices: Device[] = [];
  private _devicesByZone: { [key: string]: Device[] } = {};
  private _lastUpdated: Date = new Date(0);

  constructor(sht: ISmartHomeTools) {
    // refresh every hour
    sht.homey.setInterval(() => {
      this._refresh(sht.api).catch(() => {
        // nop
      });
    }, 3600000);
  }

  async _refresh(homeyApi: any) {
    // check if last updated more than a day ago
    if (new Date().getTime() - this._lastUpdated.getTime() < 86400000) {
      return;
    }

    const zones: Zone[] = await Object.values(await homeyApi.zones.getZones());
    this._zones = zones.map((zone: Zone) => ({
      ...zone,
      icon: getIcon(zone.icon),
      zoneType: ['hallway', 'staircase'].some((keyword) =>
        zone.name.toLowerCase().includes(keyword),
      )
        ? 'hallway'
        : 'room',
    }));

    this._devices = Object.values(
      (await homeyApi.devices.getDevices()) as Device[],
    ).map((device) => ({
      ...device,
      model: GetDeviceModel(device),
      isAutomatic: !['fan', 'night light'].some((keyword) =>
        device.name.toLowerCase().includes(keyword),
      ),
      settings: device.settingsObj
        ? device.settings
        : { value: device.settings as unknown as string },
      class: device.virtualClass || device.class, // use virtual class if it exists
    }));

    this._devicesByZone = this._devices.reduce(
      (acc: { [key: string]: Device[] }, device: Device) => {
        acc[device.zone] = acc[device.zone] || [];
        acc[device.zone].push(device);
        return acc;
      },
      {},
    );

    this._lastUpdated = new Date();
  }

  private _sortZones(zones: Zone[]): Zone[] {
    // Get root zones (zones with no parent)
    const rootZones = zones
      .filter((zone) => !zone.parent)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Recursively get children for each root zone
    const getChildrenRecursive = (parentId: string): Zone[] => {
      const children = zones
        .filter((zone) => zone.parent === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));

      return children.reduce((acc: Zone[], child) => {
        acc.push(child);
        return acc.concat(getChildrenRecursive(child.id));
      }, []);
    };

    // Build the final sorted list with all levels of hierarchy
    return rootZones.reduce((acc: Zone[], root) => {
      acc.push(root);
      return acc.concat(getChildrenRecursive(root.id));
    }, []);
  }

  public getZones(query?: string) {
    return query
      ? (this._zones.filter((zone: Zone) =>
          zone.name.toLowerCase().includes(query.toLowerCase()),
        ) as Zone[])
      : this._sortZones(this._zones);
  }

  public getZone(id: string) {
    return this._zones.find((zone: Zone) => zone.id === id);
  }

  public getDevices() {
    return this._devices;
  }

  public getLightsInZone(
    zoneId: string,
    capability: 'onoff' | 'dim' = 'onoff',
    isAutomatic: boolean = true,
  ) {
    return this.getDevicesInZone(zoneId).filter(
      (device) =>
        device.class === 'light' &&
        device.capabilities.includes(capability) &&
        device.isAutomatic === isAutomatic,
    );
  }

  public getDevicesInZone(zoneId: string) {
    return this._devicesByZone[zoneId] || [];
  }

  public getDevice(deviceId: string) {
    return this._devices.find((device: Device) => device.id === deviceId);
  }
}
