/* eslint-disable operator-linebreak */
'use strict';

const PRODUCT_ID_MAPPING = {
  // Matter d.settings.mtr_product_id
  '0x002e': 'Cync Downlight',
  '0x2002': 'Aqara Contact Sensor',
  '0x1088': 'ThirdReality Night Light',
  '0x0b03': 'Nanoleaf Desk Lamp',
  '0x0202': 'Kasa Dimmer Switch',
  '0x0201': 'Kasa On/Off Switch',
  '0x0059': 'Eve Motion Sensor',
  '0x004b': 'Nanoleaf A19 Bulb',

  // Z-Wave d.settings.zw_product_id
  5: 'Aeotec TriSensor',
  100: 'Aeotec MultiSensor 6',
  61441: 'Zooz Remote Switch',

  // Zigbee d.settings.zb_product_id
  '3RWS18BZ': 'ThirdReality Water Leak Sensor',
  'lumi.remote.b1acn01': 'Aqara Button Switch',
  'lumi.remote.cagl02': 'Aqara Cube',

  // Homekit d.capabilitiesObj.hap-model.value
  'PS-S02E': 'Aqara Presence Sensor',

  // Chromecast d.data.model
  'Google Home Mini': 'Nest Mini',
  Chromecast: 'Google Chromecast',

  // Samsung TV d.settings.modelName
  UN55MU7000: 'Samsung TV',
  'SP-LSP3BLAXZA': 'Samsung Projector',

  // Sonos d.settings.modelName
  S17: 'Sonos Move',
  S3: 'Sonos Play:3',
  S31: 'Sonos Beam',

  // Misc d.driverId
  'homey:app:com.google.nest:camera': 'Nest Camera',
  'homey:app:com.google.nest:doorbell': 'Nest Doorbell',
  'homey:app:me.nanoleaf:lines': 'Nanoleaf Lines',
  'homey:app:com.smartthings:washer': 'Samsung Washer',
  'homey:app:com.lg.webos:webos': 'LG TV',

  '???': 'Unknown',
} as const;

export type ProductModelId = keyof typeof PRODUCT_ID_MAPPING;
export type ProductModels = (typeof PRODUCT_ID_MAPPING)[ProductModelId];

export type Device = {
  id: string;
  name: string;
  class: string;
  virtualClass: string;
  zone: string;
  model: ProductModels;

  driverId: string;
  data: Record<string, string>;

  capabilities: string[];
  capabilitiesObj: Record<string, Record<string, string>>;

  settings: Record<string, string>;
  settingsObj: boolean;

  // Whether this device should be turned on/off automatically
  isAutomatic: boolean;
};

export function GetDeviceModel(device: Device): ProductModels {
  return (
    PRODUCT_ID_MAPPING[device.settings?.mtr_product_id as ProductModelId] ||
    PRODUCT_ID_MAPPING[device.settings?.zw_product_id as ProductModelId] ||
    PRODUCT_ID_MAPPING[device.settings?.zb_product_id as ProductModelId] ||
    PRODUCT_ID_MAPPING[device.capabilitiesObj?.['hap-model']?.value as ProductModelId] ||
    PRODUCT_ID_MAPPING[device.settings?.modelName as ProductModelId] ||
    PRODUCT_ID_MAPPING[device.driverId as ProductModelId] ||
    'Unknown'
  );
}
