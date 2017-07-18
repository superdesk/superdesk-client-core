export function ExtensionPointsProvider() {
    var extensions = {};

    this.register = function(type, componentClass, data) {
        if (typeof extensions[type] === 'undefined') {
            extensions[type] = [];
        }
        extensions[type].push({type: type, componentClass: componentClass, data: data});
    };

    this.$get = function() {
        return extensions;
    };
}
