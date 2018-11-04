require('../config/def');
const dbConnect = require('../config/db');
const CityModel = require('../models/CityModel');
const DistrictModel = require('../models/DistrictModel');
const ProjectModel = require('../models/ProjectModel');
const PostModel = require('../models/PostModel');
const list1 = require('./selectors/file1');
const list2 = require('./selectors/file2');
const list3 = require('./selectors/file3');
const list4 = require('./selectors/file4');
const cities = [
    ...list1,
    ...list2,
    ...list3,
    ...list4
];

// import city, district
async function importCity(cityData) {
    let city = await CityModel.findOne({code: cityData.code});
    if (city) {
        return Promise.resolve(city);
    }

    city = new CityModel();
    city.code = cityData.code;
    city.name = cityData.name;
    await city.save();
    return city;
}

async function importDistrict(districtData, cityObj) {
    let district = await DistrictModel.findOne({id: districtData.id});
    if (district) {
        return Promise.resolve(district);
    }

    district = new DistrictModel();
    district.id = districtData.id;
    district.name = districtData.name || '';
    district.pre = districtData.pre || '';
    district.wards = districtData.ward || [];
    district.streets = districtData.street || [];
    district.city = cityObj._id;

    await district.save();
    return district;
}

// check duplicate by title
// sample: {"id":2324,"name":"13B Conic Phong Phú","lat":10.71240234375,"lng":106.64177703857422,"cats":[40,48,50,51,59,163,324,325,326]}
async function importProjectPost(projectData, districtObj) {

}

async function run() {
    cities.forEach(async (cityData) => {
        // create city
        const city = await importCity(cityData);

        cityData.district.forEach(async (districtData) => {
            // create district
            const district = await importDistrict(districtData, city);

            districtData.project.forEach(async (projectData) => {
                // create project
                // await importProjectPost(projectData, district);
            });
        });
    });

    console.log('Importing done');
}

dbConnect(run);