var path = require('path');

function getModuleDir(moduleName) {
    return path.join(require.resolve(moduleName + '/package.json'), '../');
}

module.exports = {
    getModuleDir: getModuleDir,
};
