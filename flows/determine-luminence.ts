'use strict';

import { getTimes } from 'suncalc';
import { ISmartHomeTools } from '../types/app';
import { LoggedFlow, LoggedFlowParams } from '../utils/flows/logged';

export type FlowParams = {
  zoneType: 'room' | 'hallway';
  loggedProps?: Record<string, unknown>;
} & LoggedFlowParams;

export type FlowResult = {
  luminence: number;
  luminence_dimmed: number;
};

const MAPPINGS = {
  // [<sunrise-2, <sunrise, <sunrise+2, daytime, >sunset-2, >sunset, >sunset+2]
  hallway: [30, 50, 75, 100, 75, 50, 30],
  room: [40, 40, 60, 60, 100, 100, 60],
  default: [40, 40, 100, 80, 100, 60, 60],
};

export class DetermineLuminence extends LoggedFlow<FlowParams, FlowResult> {
  private _tz: string;
  private _lat: number;
  private _lon: number;

  constructor(app: ISmartHomeTools) {
    super(app, 'determine-luminence');

    this._tz = app.homey.clock.getTimezone();
    this._lat = app.homey.geolocation.getLatitude();
    this._lon = app.homey.geolocation.getLongitude();
  }

  override async _run(args: FlowParams) {
    await super._run(args);
    const loggedProps: Record<string, unknown> = {
      zoneType: args['zoneType'],
      config: {
        tz: this._tz,
        lat: this._lat,
        lon: this._lon,
      },
      ...args['loggedProps'],
    };

    this.debug('Determining luminence for zone type {zoneType}', loggedProps);

    // Get current hour from local time
    const currHour = this._getHour(undefined);
    loggedProps.hour = currHour;

    this.debug('Current hour is {hour}', loggedProps);

    // Get sunrise and sunset times
    const times = getTimes(new Date(), this._lat, this._lon);
    const { sunrise, sunset } = {
      sunrise: this._getHour(times.sunrise) - 1,
      sunset: this._getHour(times.sunset) + 1,
    };
    loggedProps.sunrise = sunrise;
    loggedProps.sunset = sunset;

    this.debug('Sunrise is {sunrise} and sunset is {sunset}', loggedProps);

    let result = 0;

    // Determine which mapping to use
    const arg = args['zoneType'];
    const mapping = MAPPINGS[arg] || MAPPINGS['default'];
    loggedProps.mapping = mapping;

    this.debug('Using mapping {mapping}', loggedProps);

    // Determine the dim factor
    const dimFactor = result <= 50 ? 1.5 : 2;
    loggedProps.dimFactor = dimFactor;

    this.debug('Using dim factor {dimFactor}', loggedProps);

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

    const finalResult = {
      luminence: Number.parseFloat((result / 100).toFixed(2)),
      luminence_dimmed: Number.parseFloat(
        (result / dimFactor / 100).toFixed(2),
      ),
    };

    this.info('Luminence for {zoneType} determined as {luminence}', {
      ...loggedProps,
      ...finalResult,
    });

    return finalResult;
  }

  private _getHour(date: Date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeStyle: 'full',
      timeZone: this._tz,
      hour12: false,
    });
    const formattedTime = formatter.formatToParts(date);
    return parseInt(
      formattedTime.find((o) => o.type === 'hour')?.value || '0',
      10,
    );
  }
}
