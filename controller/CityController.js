const fs = require('fs');
const log4js = require('log4js');
const logger = log4js.getLogger('Controllers');
const CityModel = require('../models/CityModel');
const ProjectModel = require('../models/ProjectModel');
const moment = require('moment');

const getList = async (req, res, next) => {
    logger.info('CityController::getList is called');
    try {
        let cities = await CityModel.aggregate([
            {
                $lookup: {
                    from: "Districts",
                    localField: "_id",
                    foreignField: "city",
                    as: "districts"
                }
            }
        ]);

        cities = await Promise.all(cities.map(async (city) => {
            city['district'] = await Promise.all(city['districts'].map(async (district) => {
                district.project = await ProjectModel
                    .find({
                        city: city.code,
                        district: district.id
                    })
                    .select({
                        _id: 1,
                        id: 1,
                        title: 1
                    })
                    .lean();

                district.ward = district.wards;
                district.street = district.streets;
                delete district.wards;
                delete district.streets;
                delete district.city;
                delete district.__v;

                return district;
            }));
            delete city['districts'];
            delete city.__v;
            delete city._id;
            return city;
        }));

        const filePath = `${__dirname}/../public/files/selectors/selector-${moment().format('YYYY-MM-DD-hh-mm')}.json`;
        fs.writeFile(filePath, JSON.stringify(cities), 'utf8', (err) => {
            if (err) {
                return next(err);
            }

            return res.download(filePath);
        });
    } catch (e) {
        logger.error('CityController::getList::error', e);
        return next(e);
    }
};

const CityController = {
    list: getList
};

module.exports = CityController;