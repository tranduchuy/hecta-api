const mongoose = require('mongoose');
const models = require('./models');
const AccountModel = models['AccountModel'];
const PostModel = models['PostModel'];
const SaleModel = models['SaleModel'];
const PostService = require('./services/PostService');
const Async = require('async');

const updateAccountOwnerObjectId = () => {
    AccountModel.find({})
        .exec((err, accounts) => {
            if (err) {
                console.error(err);
                return;
            }

            accounts.forEach((a) => {
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

const updatePostContentId = () => {
    PostModel.find({})
        .exec((err, posts) => {
            if (err) {
                console.error(err);
                return;
            }

            posts.forEach((p) => {
                p.content_id = p.contentId;
                p.save((err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('success');
                    }
                });
            });
        });
};

const fillZeroToCode = (count) => {
    let countString = '';
    if (count > 999) {
    countString = count.toString();
    } else if (count > 99) {
    countString = '0' + count;
    } else if (count > 9) {
    countString = '00' + count;
    } else {
    countString = '000' + count;
    }

    return countString;
}

const updateSaleCode = async () => {
    const sales = await SaleModel.find();
    console.log('===============')
    console.log('UPDATE SALE CODE');
    console.log(`Total: ${sales.length} records`);
    let count = 0;
    Async.eachSeries(sales, (s, cb) => {
        count++;
        s.code = `190814A${fillZeroToCode(count)}`;
        s.save((err) => {
            console.log(`Update code for sale ${s._id.toString()}. Code: ${s.code}`);
            return cb(err);
        })
    }, (err) => {
        if (err) {
            console.error(err);
        }
        console.log('===============')
        console.log('FINISH UPDATING SALE CODE');
    });
}

module.exports = () => {
    // updateAccountOwnerObjectId();
    // updatePostContentId();
    // updateSaleCode();
};
