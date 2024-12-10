'use strict';

import Homey from 'homey/lib/Homey';
import { getTimes } from 'suncalc';

export type FlowParams = {
  zoneType: 'room' | 'hallway';
};

function getHour(date: Date = new Date(), tz?: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeStyle: 'full',
    timeZone: tz,
    hour12: false,
  });
  const formattedTime = formatter.formatToParts(date);
  return parseInt(
    formattedTime.find((o) => o.type === 'hour')?.value || '0',
    10,
  );
}

async function run(homey: Homey, args: FlowParams) {
  // Initialize TZ and formatter
  const tz = homey.clock.getTimezone();
  homey.log(`using timezone ${tz}`);

  // Get current hour from local time
  const currHour = getHour(undefined, tz);

  // Get sunrise and sunset times
  const lat = homey.geolocation.getLatitude();
  const lon = homey.geolocation.getLongitude();
  const times = getTimes(new Date(), lat, lon);

  const { sunrise, sunset } = {
    sunrise: getHour(times.sunrise) - 1,
    sunset: getHour(times.sunset) + 1,
  };
  homey.log(`using hour ${currHour}, sunrise ${sunrise}, sunset ${sunset}`);

  let result = 0;

  // Initialize light value mappings
  const MAPPINGS = {
    // [<sunrise-2, <sunrise, <sunrise+2, daytime, >sunset-2, >sunset, >sunset+2]
    hallway: [30, 45, 60, 80, 60, 45, 30],
    room: [20, 20, 40, 20, 60, 80, 60],
    default: [40, 40, 100, 80, 100, 60, 60],
  };

  // Determine which mapping to use
  const arg = args['zoneType'];
  const mapping = MAPPINGS[arg];
  homey.log(`using mapping ${arg}: ${mapping}`);

  // Determine the dim factor
  const dimFactor = result <= 50 ? 1.5 : 2;
  homey.log(`using dim factor ${dimFactor}`);

  if (currHour > sunrise && currHour < sunrise + 2) {
    // First two hours of sunrise
    result = mapping[2];
  } else if (currHour < sunset && currHour > sunset - 2) {
    // Last two hours before sunset
    result = mapping[4];
  } else if (currHour > sunrise && currHour < sunset) {
    // Daytime
    result = mapping[3];
  } else if (currHour < sunrise && currHour > sunrise - 2) {
    // Two hours before sunrise
    result = mapping[1];
  } else if (currHour > sunset && currHour < sunset + 2) {
    // Two hours after sunset
    result = mapping[5];
  } else if (currHour > sunset + 2) {
    // Late evening
    result = mapping[6];
  } else if (currHour < sunrise - 2) {
    // Early morning
    result = mapping[0];
  }

  homey.log(`returning luminence ${result / 100}, luminence_dimmed ${result / dimFactor / 100}`);

  return {
    luminence: result / 100,
    luminence_dimmed: result / dimFactor / 100,
  };
}

export default async function registerFlow(homey: Homey) {
  const determineLuminence = homey.flow.getActionCard('determine-luminence');
  determineLuminence.registerRunListener((args: FlowParams) => run(homey, args));
}
