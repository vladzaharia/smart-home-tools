'use strict';

import { HomeyAPI } from 'homey-api';
import Homey from 'homey';
import registerLuminenceFlow from './flows/determine-luminence';
import registerSmartDimmingFlow from './flows/smart-dimming.js';
import { ZoneDB } from './utils/zones';

module.exports = class SmartHomeTools extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    // Create a HomeyAPI instance. Ensure your app has the `homey:manager:api` permission.
    const homeyApi = await HomeyAPI.createAppAPI({
      homey: this.homey,
    });

    // Create a ZoneDB instance
    const zoneDB = new ZoneDB(homeyApi);

    this.log('SmartHomeTools has been initialized');

    // Register flows
    await registerLuminenceFlow(this.homey);
    await registerSmartDimmingFlow(this.homey, homeyApi, zoneDB);
  }
};
