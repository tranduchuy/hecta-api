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
    return [];
};

const generateStageQueryPostBuy = (req) => {
    return [];
};

const generateStageQueryPostSale = (req) => {
    return [];
};

module.exports = {
    generateStageQueryPostNews,
    generateStageQueryPostProject,
    generateStageQueryPostBuy,
    generateStageQueryPostSale
};