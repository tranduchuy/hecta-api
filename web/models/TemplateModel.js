const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const templateTypes = require('../constants/template-types');

const templateSchema = new Schema({
	name: String,
	projects: [{
		type: Schema.Types.ObjectId,
		ref: 'Project'
	}],
	type: {
		type: String,
		default: templateTypes.SINGLE_PAGE
	},
	sourcePath: {
		require: true,
		type: String
	},
	databaseConfig: {
		host: String,
		port: Number,
		database: String,
		username: String,
		password: String
	}
}, {
	timestamp: true
});

const TemplateModel = mongoose.model('Template', templateSchema, 'Templates');
module.exports = TemplateModel;

