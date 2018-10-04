const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const systemSchema = new Schema({
    crawler: Object
});

const SystemModel = mongoose.model('Systems', systemSchema);
module.exports = SystemModel;
module.exports.Model = systemSchema;

async function initSystemConfig() {
    try {
        let config = await SystemModel.findOne({});
        if (config) {
            return;
        }

        config = new SystemModel();
        config['crawler'] = {
            timeCrawl: '',
            sale: 2000,
            post: 2000,
            news: 2000,
            project: 2000
        };

        await config.save();
    } catch (e) {
        console.error(e);
    }
}

initSystemConfig();