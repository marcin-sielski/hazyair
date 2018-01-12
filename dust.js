'use strict';

const Plantower = require('plantower');

const Database = require('./database');
const Cache = require('./cache');
const round = require('./round');

let Dust = function(model, device) {

    this.plantower = new Plantower(model, device);
    this.database = new Database('dust', 24 * 366);
    this.cache = new Cache(['last', 'mean']);

};

Dust.prototype.store = function() {

    this.plantower.read().then((data) => {
        this.cache.clean();
        this.database.store(data);
    }).catch((err) => {
        console.error(err);
    });

};

Dust.prototype.info = function (req, res) {

    res.json(this.database.records());

};

Dust.prototype.current = function (req, res) {

    this.plantower.read().then((data) => {
        res.json(data);
    }).catch((err) => {
        console.error(err);
        res.json('');
    });

};

Dust.prototype.last  = function(req, res) {

    let response = this.cache.read('last', req.query);
    if (response === null) {
        response = [];
        this.database.find(this.cache.timestamp(req.query), (record) => {
            response.unshift(record);
        });
        if (response.length) {
            this.cache.write('last', req.query, response);
        }
    }
    res.json(response);

};

Dust.prototype.mean = function(req, res) {

    let response = this.cache.read('mean', req.query);
    if (response === null) {
        let divider = 0;
        this.database.find(this.cache.timestamp(req.query), (record) => {
            if (response === null) {
                response = record;
            } else {
                response['concentration_pm1.0_normal'].value += record['concentration_pm1.0_normal'].value;
                response['concentration_pm2.5_normal'].value += record['concentration_pm2.5_normal'].value;
                response.concentration_pm10_normal.value += record.concentration_pm10_normal.value;
                response['concentration_pm1.0_atmos'].value += record['concentration_pm1.0_atmos'].value;
                response['concentration_pm2.5_atmos'].value += record['concentration_pm2.5_atmos'].value;
                response.concentration_pm10_atmos.value += record.concentration_pm10_atmos.value;
                response['count_pm_0.3'].value += record['count_pm_0.3'].value;
                response['count_pm_0.5'].value += record['count_pm_0.5'].value;
                response['count_pm_1.0'].value += record['count_pm_1.0'].value;
                response['count_pm_2.5'].value += record['count_pm_2.5'].value;
                response.count_pm_5.value += record.count_pm_5.value;
                response.count_pm_10.value += record.count_pm_10.value;
            }
            divider++;
        });
        if (response !== undefined && response !== null && divider) {
            response['concentration_pm1.0_normal'].value = round(response['concentration_pm1.0_normal'].value/divider);
            response['concentration_pm2.5_normal'].value = round(response['concentration_pm2.5_normal'].value/divider);
            response.concentration_pm10_normal.value = round(response.concentration_pm10_normal.value/divider);
            response['concentration_pm1.0_atmos'].value = round(response['concentration_pm1.0_atmos'].value/divider);
            response['concentration_pm2.5_atmos'].value = round(response['concentration_pm2.5_atmos'].value/divider);
            response.concentration_pm10_atmos.value = round(response.concentration_pm10_atmos.value/divider);
            response['count_pm_0.3'].value = round(response['count_pm_0.3'].value/divider);
            response['count_pm_0.5'].value = round(response['count_pm_0.5'].value/divider);
            response['count_pm_1.0'].value = round(response['count_pm_1.0'].value/divider);
            response['count_pm_2.5'].value = round(response['count_pm_2.5'].value/divider);
            response.count_pm_5.value = round(response.count_pm_5.value/divider);
            response.count_pm_10.value = round(response.count_pm_10.value/divider);
            this.cache.write('mean', req.query, response);
        }
    }
    res.json(response);

};

Dust.prototype.close  = function() {

    this.database.close();

};

module.exports = Dust;
