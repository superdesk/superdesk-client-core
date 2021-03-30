const path = require('path');

// get the superdesk.config.js configuration object
function getConfig() {
    return require(path.join(process.cwd(), 'superdesk.config.js'))();
}

module.exports = {
    getConfig: getConfig,
};