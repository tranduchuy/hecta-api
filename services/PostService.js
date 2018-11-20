const RequestUtils = require('../utils/RequestUtil');
const moment = require('moment');

/**
 * Generate stage to run aggregate on Posts-News
 * @param req
 * @returns {Array}
 */

const getValueAreaRange = (areaData) => {
    
    //Todo: getValueAreaRange
    return null;
}

const getValuePriceRange = (priceData) => {
    
    //Todo: getValuePriceRange
    return null;
}
const generateStageQueryPostNews = (req) => {
    const {
        createdByType, status, id, from, to, title,
        sortBy, sortDirection
    } = req.query;
    const pageCond = RequestUtils.extractPaginationCondition(req);

    const stages = [
        {
            $match: {
                "postType": global.POST_TYPE_NEWS,
            }
        },
        {
            $lookup: {
                from: "News",
                localField: "contentId",
                foreignField: "_id",
                as: "newsInfo"
            }
        },
        {
            $unwind: "$newsInfo"
        }
    ];

    // filter
    const stageFilter = {};

    if (createdByType && createdByType !== '0') {
        stageFilter["newsInfo.createdByType"] = parseInt(createdByType);
    }

    if (status) {
        stageFilter["newsInfo.status"] = parseInt(status);
    }

    if (id) {
        stageFilter["newsInfo._id"] = id;
    }

    if (title) {
        stageFilter['newsInfo.title'] = {
            $regex: title,
            $options: 'i'
        }
    }

    if (from && from.toString().length === 10) {
        const fromObj = moment(from, 'YYYY-MM-DD').toDate();
        stageFilter['from'] = {
            $gte: fromObj.getTime()
        }
    }

    if (to && to.toString().length === 10) {
        const toObj = moment(to, 'YYYY-MM-DD').toDate();
        stageFilter['to'] = {
            $lte: toObj.getTime()
        }
    }

    if (Object.keys(stageFilter).length !== 0) {
        stages.push({
            $match: stageFilter
        });
    }

    // sort
    let stageSort = {
        $sort: {}
    };

    if (sortBy) {
        stageSort.$sort[sortBy] = sortDirection === 'ASC' ? 1 : -1
    } else {
        stageSort.$sort['date'] = -1; // default sort by date descending
    }

    stages.push(stageSort);

    // pagination
    stages.push({
        $facet: {
            entries: [
                {$skip: (pageCond.page - 1) * pageCond.limit},
                {$limit: pageCond.limit},
            ],
            meta: [
                {$group: {_id: null, totalItems: {$sum: 1}}},
            ],
        },
    });

    return stages;
};

const generateStageQueryPostProject = (req) => {
    const {createdByType, status, id, title, city, type} = req.query;
    const pageCond = RequestUtils.extractPaginationCondition(req);

    const stages = [
        {
            $match: {
                "postType": global.POST_TYPE_PROJECT,
            }
        },
        {
            $lookup: {
                from: "Projects",
                localField: "contentId",
                foreignField: "_id",
                as: "projectInfo"
            }
        },
        {
            $unwind: "$projectInfo"
        }
    ];

    // filter
    const stageFilter = {};

    if (createdByType && createdByType !== '0') {
        stageFilter["projectInfo.createdByType"] = parseInt(createdByType);
    }

    if (status) {
        stageFilter["projectInfo.status"] = parseInt(status);
    }

    if (id) {
        stageFilter["projectInfo._id"] = id;
    }

    if (city) {
        stageFilter["projectInfo.city"] = city;
    }

    if (type) {
        stageFilter["projectInfo.type"] = type;
    }

    if (title) {
        stageFilter['projectInfo.title'] = {
            $regex: title,
            $options: 'i'
        }
    }

    if (Object.keys(stageFilter).length !== 0) {
        stages.push({
            $match: stageFilter
        });
    }

    // pagination
    stages.push({
        $facet: {
            entries: [
                {$skip: (pageCond.page - 1) * pageCond.limit},
                {$limit: pageCond.limit},
            ],
            meta: [
                {$group: {_id: null, totalItems: {$sum: 1}}},
            ],
        },
    });

    return stages;
};

const generateStageQueryPostBuy = (req) => {
    const {createdByType, status, id} = req.query;
    const pageCond = RequestUtils.extractPaginationCondition(req);

    const stages = [
        {
            $match: {
                "postType": global.POST_TYPE_BUY,
            }
        },
        {
            $lookup: {
                from: "Buys",
                localField: "contentId",
                foreignField: "_id",
                as: "buyInfo"
            }
        },
        {
            $unwind: "$buyInfo"
        }
    ];

    // filter
    const stageFilter = {};

    if (createdByType && createdByType !== '0') {
        stageFilter["buyInfo.createdByType"] = parseInt(createdByType);
    }

    if (status) {
        stageFilter["buyInfo.status"] = parseInt(status);
    }

    if (id) {
        stageFilter["buyInfo._id"] = id;
    }

    if (Object.keys(stageFilter).length !== 0) {
        stages.push({
            $match: stageFilter
        });
    }

    // pagination
    stages.push({
        $facet: {
            entries: [
                {$skip: (pageCond.page - 1) * pageCond.limit},
                {$limit: pageCond.limit},
            ],
            meta: [
                {$group: {_id: null, totalItems: {$sum: 1}}},
            ],
        },
    });

    return stages;
};

const generateStageQueryPostSale = (req) => {
    const {createdByType, status, id} = req.query;
    const pageCond = RequestUtils.extractPaginationCondition(req);

    const stages = [
        {
            $match: {
                "postType": global.POST_TYPE_SALE,
            }
        },
        {
            $lookup: {
                from: "Sales",
                localField: "contentId",
                foreignField: "_id",
                as: "saleInfo"
            }
        },
        {
            $unwind: "$saleInfo"
        }
    ];

    // filter
    const stageFilter = {};

    if (createdByType && createdByType !== '0') {
        stageFilter["saleInfo.createdByType"] = parseInt(createdByType);
    }

    if (status) {
        stageFilter["saleInfo.status"] = parseInt(status);
    }

    if (id) {
        stageFilter["saleInfo._id"] = id;
    }

    if (Object.keys(stageFilter).length !== 0) {
        stages.push({
            $match: stageFilter
        });
    }

    // pagination
    stages.push({
        $facet: {
            entries: [
                {$skip: (pageCond.page - 1) * pageCond.limit},
                {$limit: pageCond.limit},
            ],
            meta: [
                {$group: {_id: null, totalItems: {$sum: 1}}},
            ],
        },
    });

    return stages;
};

/**
 * Can be filtered by:
 * ++ status: number
 * ++ formality: number
 * ++ type: number
 * ++ url: string like
 * ++ customUrl: string like
 * ++ from: string date -> should convert to number by getTime()
 * ++ to: string date -> should convert to number by getTime()
 */
const generateStageQueryPost = (req) => {
    const {status, formality, type, url, customUrl, from, to} = req.query;
    const pageCond = RequestUtils.extractPaginationCondition(req);
    const stages = [];

    // filter
    const stageFilter = {};
    if (status && !isNaN(status)) {
        stageFilter['status'] = parseInt(status);
    }

    if (formality && !isNaN(formality)) {
        stageFilter['formality'] = parseInt(formality);
    }

    if (type && !isNaN(type)) {
        stageFilter['type'] = parseInt(type);
    }

    if (url && url.toString().trim() !== '') {
        stageFilter['url'] = {
            $regex: url,
            $options: 'i'
        }
    }

    if (customUrl && customUrl.toString().trim() !== '') {
        stageFilter['customUrl'] = {
            $regex: customUrl,
            $options: 'i'
        }
    }

    if (from && from.length === 10) {
        const fromObj = moment(from, 'YYYY-MM-DD').toDate();
        stageFilter['from'] = {
            $gte: fromObj.getTime()
        }
    }

    if (to && to.length === 10) {
        const toObj = moment(to, 'YYYY-MM-DD').toDate();
        stageFilter['to'] = {
            $lte: toObj.getTime()
        }
    }

    if (Object.keys(stageFilter).length !== 0) {
        stages.push({
            $match: stageFilter
        });
    }

    // pagination
    stages.push({
        $facet: {
            entries: [
                {$skip: (pageCond.page - 1) * pageCond.limit},
                {$limit: pageCond.limit},
            ],
            meta: [
                {$group: {_id: null, totalItems: {$sum: 1}}},
            ],
        },
    });

    return stages;
};

module.exports = {
    generateStageQueryPostNews,
    generateStageQueryPostProject,
    generateStageQueryPostBuy,
    generateStageQueryPostSale,
    generateStageQueryPost,
    getValueAreaRange,
    getValuePriceRange
};