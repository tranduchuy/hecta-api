const RequestUtils = require('../utils/RequestUtil');

/**
 * Generate stage to run aggregate on Posts-News
 * @param req
 * @returns {Array}
 */
const generateStageQueryPostNews = (req) => {
    const {createdByType, status, id} = req.query;
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

const generateStageQueryPost = (req) => {
    const pageCond = RequestUtils.extractPaginationCondition(req);
    const stages = [];

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
    generateStageQueryPost
};