require("./config/def");
const SaleModel = require("./models/SaleModel");
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({
  provider: "google",
  apiKey: "AIzaSyAa6yqlNmvLm9I4PhP0Xfa6nBX1Wj9-PAk"
});
const { getLocationTitle } = require("./services/TitleService");

require("./database/db")(async () => {
  try {
    const sales = await SaleModel.find({geo: undefined});

    console.log(sales.length);

    await Promise.all(sales.map(async s => {
        s.address = getLocationTitle(s);
        geo = await getGeo(s.address);
        if (geo) {
            s.geo = {
            latitude: geo.latitude,
            longitude: geo.longitude
            };
            console.log(s.address, JSON.stringify(s.geo));
            await s.save();
        }
        // let geo = await getGeo(s.address);

        // if (geo) {
        //   s.geo = {
        //     latitude: geo.latitude,
        //     longitude: geo.longitude
        //   };

        //   await s.save();
        // } else {
          
        // }
      })
    );

    console.log('finish');
  } catch (e) {
    console.error(e);
  }
});

const getGeo = function(address) {
  return new Promise((resolve, reject) => {
    if (!address) {
      return resolve(null);
    }

    geocoder.geocode(address, (err, addresses) => {
      if (err) {
        reject(err);
      } else {
        if (addresses.length > 0) {
          return resolve(addresses[0]);
        }

        return resolve(null);
      }
    });
  });
};
