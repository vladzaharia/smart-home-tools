'use strict';

import Homey from 'homey';
import registerFlow from './flows/determine-luminence';

module.exports = class SmartHomeTools extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('SmartHomeTools has been initialized');

    await registerFlow(this.homey);
  }
};
