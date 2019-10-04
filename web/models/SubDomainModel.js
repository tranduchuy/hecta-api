const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const subDomainSchema = new Schema({
	name: {
		type: String,
		unique : true,
		required : true,
		dropDups: true // auto remove duplicate name
	},
	status: {
		type: Number,
		default: global.DOMAIN_STATUS.DOMAIN_ENABLE
	},
}, {
	timestamp: true
});

const SubDomainModel = mongoose.model('SubDomain', subDomainSchema, 'SubDomains');
module.exports = SubDomainModel;

