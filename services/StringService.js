function removeQueryStringFromPath(pathWithQuery) {
    if (pathWithQuery.indexOf('?') === -1) {
        return pathWithQuery;
    }

    return pathWithQuery.split('?')[0];
}

function getQueryStringFromPath(pathWithQuery) {
    if (pathWithQuery.indexOf('?') === -1) {
        return '';
    }

    return pathWithQuery.split('?')[1];
}

module.exports = {
    removeQueryStringFromPath,
    getQueryStringFromPath
};