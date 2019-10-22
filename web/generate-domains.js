require('./config/def');
const fs = require('fs');
const db = require('./database/db');
require('./models/index');
const SubDomainModel = require('./models/SubDomainModel');
const shell = require('shelljs');
const config = require('config');
const postFix = config.get('subDomainPostFix');

function makeid(length) {
	let result = '';
	const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}


function createSubDomain(subDomainName, root = '/usr/share/nginx/html') {
	const sample = fs.readFileSync('./shell-cmd/sample-nginx-domain.conf', 'utf8');
	const newConf = sample.replace('{{server_name}}', subDomainName)
		.replace('{{root}}', root);

	fs.writeFileSync(`./shell-cmd/${subDomainName}.conf`, newConf);
}

/**
 * Create sub domain by name
 * @param {string} subDomainName 
 */
async function createDomain(subDomainName) {
	const duplicatedName = await SubDomainModel.findOne({name: subDomainName});
	if (duplicatedName) {
		return;
	}

	const newDomain = new SubDomainModel({});
	newDomain.name = subDomainName;
	newDomain.status = global.STATUS.DOMAIN_ENABLE;

	await newDomain.save();
	createSubDomain(newDomain.name + postFix);
}


db(() => {
	console.log('Connect to mongodb successfully');

	for (let i = 0; i < 2; i++) {
		createDomain(makeid(5));
	}

	setTimeout(() => {
		shell.exec('./shell-cmd/copy-nginx-domain.sh');
		console.log('Finish generating');
	}, 5000)
});
