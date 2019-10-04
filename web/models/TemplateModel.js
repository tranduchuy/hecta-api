const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const templateSchema = new Schema({
	name: String,
	projects: [{
		type: Schema.Types.ObjectId,
		ref: 'Project'
	}]
}, {
	timestamp: true
});

const TemplateModel = mongoose.model('Template', templateSchema, 'Templates');
module.exports = TemplateModel;

