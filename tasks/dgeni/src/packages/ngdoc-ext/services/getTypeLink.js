var _ = require('lodash');
var catharsis = require('catharsis');

/**
 * @dgService getTypeLink
 * @description Get link to type
 */
module.exports = function getTypeLink(aliasMap, getLinkInfo, log) {

    function TypeLink (typeStr) {
        var typeName = typeStr;
        try {
            log.debug('[getTypeLink] building type link for %s', typeStr);
            var type = catharsis.parse(typeName, {jsdoc: true});
            if (type.type === catharsis.Types.TypeApplication) {
                typeName = catharsis.stringify(type.applications[0], {restringify: true});
                type = _.clone(type);
                type.applications = type.applications.map(function (type) {
                    if (type.type !== catharsis.Types.FunctionType && type.type !== catharsis.Types.UndefinedLiteral) {
                        type.name = getLinkInfo(type.name).title;
                    }
                    return type;
                });
            } else {
                if (type.type !== catharsis.Types.FunctionType && type.type !== catharsis.Types.UndefinedLiteral) {
                    typeName = type.name;
                    type = _.clone(type);
                    type.name = getLinkInfo(type.name).title;
                }
            }
            typeStr = catharsis.stringify(type, {restringify: true});
        } catch (e) {
            log.error('[getTypeLink] Parse of "%s" failed with reason: %s', typeStr, e.message);
            typeName = typeStr;
        }
        var res = _.template('{@link ${link} ${title}}')({link: typeName, title: typeStr});
        log.silly('[getTypeLink] built link %s', res);
        return res;
    };

    return TypeLink;
};