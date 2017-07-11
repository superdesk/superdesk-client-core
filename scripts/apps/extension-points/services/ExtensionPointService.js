ExtensionPointService.$inject = [];
export function ExtensionPointService() {
    var self = this;

    self.extensions = {};

    self.register = function(type, componentClass, data) {
        if (typeof self.extensions[type] === 'undefined') {
            self.extensions[type] = [];
        }
        self.extensions[type].push({type: type, componentClass: componentClass, data: data});
    };
}
