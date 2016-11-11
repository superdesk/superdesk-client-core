var _ = require('lodash');

/**
 * @dgService angular-link
 * @description checks link for applicability and produces link to angularjs doc
 */
module.exports = function angularLink (log) {

    function checkApplicability (component) {
        return MATCH_REGEX.test(component);
    }

    function makeUrl (component) {
        var matches = component.match(MATCH_REGEX);
        var versioned = this.version || matches[4];
        return versioned ? _.template(this.versionedUrl)({ version: matches[4], module: matches[1], group: matches[2], component: matches[3] })
                         : _.template(this.baseUrl)({ module: matches[1], group: matches[2], component: matches[3] })
    }

    /**
     * @name makeTitle
     * @param {String} component component to build title for
     * @param {String} [title] optional title, is not used
     * @description creates title from component
     */
    function makeTitle (component, title) {
        var matches = component.match(MATCH_REGEX);
        var res = matches[3];
        if (matches[4]) {
            res += ' (v' + matches[4] + ')';
        }
        return res;
    }

    return {
        version: void(null),
        baseUrl: BASE_URL,
        versionedUrl: VERSIONED_URL,
        test: checkApplicability,
        url: makeUrl,
        title: makeTitle
    }
};