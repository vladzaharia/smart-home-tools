'use strict';

import { camelCaseToKebab } from 'camelcase-to-kebab';

const MAPPINGS: { [key: string]: string } = {
  utilitiesRoom: 'utilities_room',
  bedroomSingle: 'bedroom',
  bedroomKids: 'kinder_room',
  entrance: 'entrance_front_door',
  fuseBox: 'lightning-bolt',
  diningRoom: 'dining_room',
  lounge: 'lounge-chair',
};

export function getIcon(icon: string): string {
  return `/img/zones/${MAPPINGS[icon] || camelCaseToKebab(icon)}.svg`;
}
