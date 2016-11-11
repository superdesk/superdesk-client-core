var _ = require('lodash');

/**
 * @dgService angular-link
 * @description checks link for applicability and produces link to angularjs doc
 */
module.exports = function angularLink (log) {
    /**
     * ng.service.$q
     * ng.service.$q@1.2.29
     * ngRoute.provider.$routeProvider
     */
    var MATCH_REGEX = /^(ng[^\.]*)\.(\w+)\.(\$*[\w.\[\]]+)(?:@((?:\d+\.){2}\d+))?$/;
                      // ngModule    type   name               version

    var BASE_URL = 'https://docs.angularjs.org/api/${module}/${group}/${component}';
    var VERSIONED_URL = 'https://code.angularjs.org/${version}/docs/api/${module}/${group}/${component}';

    var BASE_COMPONENT_URL = 'https://docs.angularjs.org/partials/api/${module}/${group}/${component}.html';
    var VERSIONED_COMPONENT_URL = 'https://code.angularjs.org/1.2.29/docs/partials/api/${module}/${group}/${component}.html';

    function checkApplicability (component) {
        return MATCH_REGEX.test(component);
    }

    function makeUrl (component) {
        var matches = component.match(MATCH_REGEX);
        var version =  matches[4] || this.version;
        return version ? _.template(this.versionedUrl)({ version: version, module: matches[1], group: matches[2], component: matches[3] })
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
        var version = matches[4] || this.version;
        if (version) {
            res += ' (v' + version + ')';
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