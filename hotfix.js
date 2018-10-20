const mongoose = require('mongoose');
const models = require('./models');
const AccountModel = models['AccountModel'];

const updateAccountOwnerObjectId = () => {
    AccountModel.find({})
        .exec((err, accounts) => {
            if (err) {
                console.error(err);
                return;
            }

            accounts.forEach((a) => {
                a.owner = mongoose.Types.ObjectId(a.owner);
                a.save((err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('success');
                    }
                });
            });
        });
};

module.exports = () => {
    updateAccountOwnerObjectId();
};