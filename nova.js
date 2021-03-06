'use strict';

const SDS = require("hazyair-nova");

class Nova {

    constructor(model, options) {

        this.model = model;
        this.sensor = new SDS(options.device);

    }

    dust() {

        return new Promise((resolve, reject) => {

            Promise.all([this.sensor.setReportingMode('active'), this.sensor.setWorkingPeriod(0)]).then(() => {
                this.sensor.on('measure', (data) => {
                    let result = { 'concentration_pm2.5_normal': { 'value': data['PM2.5'], 'unit': 'µg/m^3' },
                                   'concentration_pm10_normal': { 'value': data.PM10, 'unit': 'µg/m^3' },
                                   'model': this.model, 'timestamp': Date.now() };
                    this.sensor.setWorkingPeriod(30).then(() => {
                        return resolve(result);
                    }).catch((error) => {
                        return reject(error);
                    });
                });
            }).catch((error) => {
                return reject(error);
            });

        });
    }
}

module.exports = Nova;
