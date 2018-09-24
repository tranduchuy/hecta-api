const mongoose = require('mongoose');
const ViewModel = require('../models/ViewModel');
const moment = require('moment');

const createOrUpdateViewObj = (objectId, target, callback) => {
    const date = moment().startOf('day');
    const query = {
        objectId,
        type: target,
        date
    };

    ViewModel.findOne(query, (err, record) => {
        if (err) {
            return callback(err);
        }

        if (record) {
            record.count++;
            record.save(callback);
            return;
        }

        record = new ViewModel({
            objectId: new mongoose.Types.ObjectId(objectId),
            type: target
        });

        record.save(callback);
    });
}

module.exports = {
    createOrUpdateViewObj
};