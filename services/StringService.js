function removeQueryStringFromPath(pathWithQuery) {
    if (pathWithQuery.indexOf('?') === -1) {
        return pathWithQuery;
    }

    return pathWithQuery.split('?')[0];
}

module.exports = {
    removeQueryStringFromPath
};