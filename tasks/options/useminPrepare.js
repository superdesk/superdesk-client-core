var path = require('path');

module.exports = {
    html: [
        path.join('<%= coreDir %>', '<%= appDir %>/index.html'),
        '<%= appDir %>/docs.html'
    ],
    options: {root: process.cwd()}
};
