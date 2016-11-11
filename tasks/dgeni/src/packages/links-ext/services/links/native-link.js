var _ = require('lodash');

/**
 * @dgService getNativeTypeLink
 * @description returns native type link or empty string
 */
module.exports = function nativeLink(log) {
    var NATIVE_TYPES = [
        'arguments', 'Array', 'ArrayBuffer', 'Boolean', 'DataView', 'Date', 'Error', 'EvalError', 'Float32Array',
        'Float64Array', 'Function', 'Generator', 'GeneratorFunction', 'Infinity', 'Int16Array', 'Int32Array',
        'Int8Array', 'InternalError', 'Intl', 'Intl.Collator', 'Intl.DateTimeFormat', 'Intl.NumberFormat', 'Iterator',
        'JSON', 'Map', 'Math', 'NaN', 'null', 'Number', 'Object', 'ParallelArray', 'Promise', 'Proxy', 'RangeError',
        'ReferenceError', 'Reflect', 'RegExp', 'SIMD', 'SIMD.Float32x4', 'SIMD.Float64x2', 'SIMD.Int16x8',
        'SIMD.Int32x4', 'SIMD.Int8x16', 'Set', 'StopIteration', 'String', 'Symbol', 'SyntaxError', 'TypeError',
        'TypedArray', 'URIError', 'Uint16Array', 'Uint32Array', 'Uint8Array', 'Uint8ClampedArray', 'WeakMap',
        'WeakSet', 'undefined'
    ];

    var BASE_URL = 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/${component}';

    function getEntry (types, component) {
        var component = component.match(/^([^\s\(\)\[\]]+)/)[1].toLowerCase();
        return _.find(types, function (type) {
            return type.toLowerCase() === component;
        });
    }

    function checkApplicability (component) {
        var res = false;
        if (component) {
            res = !!getEntry(this.types, component);
        }
        return res;
    }

    function makeUrl (component) {
        return _.template(this.baseUrl)({component: getEntry(this.types, component)});
    }

    function makeTitle (component, title) {
        return getEntry(this.types, component);
    }

    return {
        baseUrl: BASE_URL,
        types: NATIVE_TYPES,
        test: checkApplicability,
        url: makeUrl,
        title: makeTitle
    };
};