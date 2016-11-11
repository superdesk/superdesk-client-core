/**
 * Thanks to @maksimr
 * https://gist.github.com/maksimr/5ed25c631d3ad6011263
 */
module.exports = function jsxFileReader(jsdocFileReader) {
    return {
        name: 'jsxFileReader',
        defaultPattern: /\.jsx$/,
        getDocs: fileInfo => {
            // Workaround to get into 'api' area. Dgeni doesn't recognise
            // other files than JS as part of the API.
            // See `dgeni-packages/ngdoc/tag-defs/area.js`.
            fileInfo.extension = 'js';
            return jsdocFileReader.getDocs(fileInfo);
        }
    };
};
