const CDP_APIS = require('../config/cdp-url-api.constant');
const { get } = require('../utils/Request');

const getListUsersByIds = (userIds, token) => {
	return new Promise((resolve, reject) => {
		const urlGetUserInfo = `${CDP_APIS.USER.LIST_USER_INFO}?ids=${userIds.join(',')}`;
		get(urlGetUserInfo, token)
			.then((response) => {
				return resolve(response.data.entries);
			})
			.catch(e => {
				return reject(e);
			});
	});
};

module.exports = {
	getListUsersByIds
};
