const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const systemSchema = new Schema({
	staticPage: {
		'gioiThieu'              : [{ content: String, createdAt: Date }],
		'huongDanSuDung'         : [{ content: String, createdAt: Date }],
		'quyDinh'                : [{ content: String, createdAt: Date }],
		'quyCheHoatDong'         : [{ content: String, createdAt: Date }],
		'baoVeThongTinCaNhan'    : [{ content: String, createdAt: Date }],
		'coCheGiaiQuyetTranhChap': [{ content: String, createdAt: Date }],
		'lienHe'                 : [{ content: String, createdAt: Date }],
		'dieuKhoanThoaThuan'     : [{ content: String, createdAt: Date }],
		'baoGia'                 : [{ content: String, createdAt: Date }],
	},
	banners   : {
		header: [{ content: String, createdAt: Date }],
	}
});

const SystemModel = mongoose.model('System', systemSchema, 'Systems');
module.exports = SystemModel;
module.exports.Model = systemSchema;


async function initSystemConfig() {
	let system = await SystemModel.findOne({});
	if (system) {
		return;
	}

	system = new SystemModel({
		staticPage: {
			'gioiThieu'              : [{ content: '', createdAt: new Date() }],
			'huongDanSuDung'         : [{ content: '', createdAt: new Date() }],
			'quyDinh'                : [{ content: '', createdAt: new Date() }],
			'quyCheHoatDong'         : [{ content: '', createdAt: new Date() }],
			'baoVeThongTinCaNhan'    : [{ content: '', createdAt: new Date() }],
			'coCheGiaiQuyetTranhChap': [{ content: '', createdAt: new Date() }],
			'lienHe'                 : [{ content: '', createdAt: new Date() }],
			'dieuKhoanThoaThuan'     : [{ content: '', createdAt: new Date() }],
			'baoGia'                 : [{ content: '', createdAt: new Date() }]
		},
		banners   : {
			header: [{ content: '', createdAt: new Date() }]
		}
	});

	await system.save();
}

// IMPORTANT: DO NOT REMOVE THIS LINE
initSystemConfig();
