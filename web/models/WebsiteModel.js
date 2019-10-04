const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const websiteSchema = new Schema({
	userId: String,
	projectId: String,
	subDomain: {
		type: Schema.Types.ObjectId,
		ref: 'SubDomain'
	},
	customDomain: String,
	type: {
		type: Number, // level 1, 2, 3,
		default: null
	},
	database: {
		host: String,
		port: Number,
		database: String,
		username: String,
		password: String
	},
	template: {
		type: {type: Schema.Types.ObjectId, ref: 'Template'},
		default: null
	},
	contactInfo: {
		name: String,
		phone: String,
		email: String,
		address: String
	}
}, {
	timestamp: true
});

const WebsiteModel = mongoose.model('Website', websiteSchema, 'Websites');
module.exports = WebsiteModel;

