'use strict';

import Homey from 'homey/lib/Homey';
import { Zone, ZoneDB } from '../utils/zones';

export type FlowParams = {
    level: number;
    zone: Zone;
};

async function run(homey: Homey, args: FlowParams) {
  homey.log(args)
}

export default async function registerFlow(homey: Homey, homeyApi: any, zoneDB: ZoneDB) {
  const smartDimming = homey.flow.getActionCard('smart-dimming');
  smartDimming.registerRunListener((args: FlowParams) => run(homey, args));
  smartDimming.registerArgumentAutocompleteListener('zone', async (query) => {
    return zoneDB.getZones(query);
  });
}
