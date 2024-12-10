'use strict';

import Homey from 'homey/lib/Homey';

export type FlowParams = {
  zoneType: 'room' | 'hallway';
};

async function run(args: FlowParams) {
  return {
    luminence: 0,
    luminence_dimmed: 0,
  };
}

export default async function registerFlow(homey: Homey) {
  const determineLuminence = homey.flow.getActionCard('determine-luminence');
  determineLuminence.registerRunListener(run);
}
