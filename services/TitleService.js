const selector = require("../config/selector");

const getTitle = (data) => {
    let title = '';
    
    if (data.formality) {
        
        let formality = getFormilitySaleByValue(data.formality);
        if (formality)
            title = formality.name;
        else {
            formality = getFormilityBuyByValue(data.formality);
            if (formality)
                title = formality.name;
        }
        
        if (formality && data.type) {
            const type = getTypeByValue(formality, data.type);
            if (type) title = type.name;
        }
    }
    
    if (title == '') title = 'Bất Động Sản';
    
    return title;
}

const getLocationTitle = (data) => {
    let locationTitle = 'Việt Nam';
    
    if (data.city) {
        const city = getCityByCode(data.city);
        if (city)
            locationTitle = city.name;
        if (city && data.district) {
            const district = getDistrictByValue(city, data.district);
            if (district)
            locationTitle = (`${district.pre || ''} ${district.name}, ${locationTitle}`).trim();
    
            if (district) {
                if (data.project) {
                    const project = getProjectByValue(district, data.project);
                    if (project)
                        return locationTitle = project.name + ', ' + locationTitle;
                }
    
                if (data.ward) {
                    const ward = getWardByValue(district, data.ward);
                    if (ward)
                        locationTitle = (`${ward.pre || ''} ${ward.name}, ${locationTitle}`).trim();
                }
    
                if (data.street) {
                    const street = getStreetByValue(district, data.street);
                    if (street)
                        locationTitle = (`${street.pre || ''} ${street.name}, ${locationTitle}`).trim();
                }
            }
            
        }
    }
    
    return locationTitle;
}

const isUndefinedOrNull = (value) => {
    return value === undefined || value === null;
}

const getFormilitySaleByValue = (value) => {
    return selector.cateList.find(c => {
        return c.id === value;
    });
}

const getFormilityBuyByValue = (value) => {
    return selector.cateListBuy.find(c => {
        return c.id === value;
    });
}

const getTypeByValue = (formality, value) => {
    if (isUndefinedOrNull(value)) {
        return null;
    }
    
    return formality.children.find(t => {
        return t.id.toString() === value.toString();
    });
}

const getCityByCode = (cd) => {
    return selector.cityListOTher1.find(city => {
        return city.code === cd;
    });
}

const getDistrictByValue = (city, value) => {
    return city.district.find(d => {
        return d.id === value;
    });
}

const getProjectByValue = (district, value) => {
    return district.project.find(w => {
        return w._id.toString() === value;
    });
}

const getWardByValue = (district, value) => {
    return district.ward.find(w => {
        return w.id === value;
    });
}

const getStreetByValue = (district, value) => {
    return district.street.find(w => {
        return w.id === value;
    });
}

module.exports = {
    getLocationTitle,
    getTitle,
};