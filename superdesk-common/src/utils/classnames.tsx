/* eslint-disable no-redeclare */

function getActiveClassNames(obj: {[className: string]: boolean}): Array<string> {
    return Object.entries(obj).filter(([_key, value]) => value === true).map(([key]) => key);
}

// overloads:

export function classnames(unconditional: string, obj: {[className: string]: boolean}): string;
export function classnames(obj: {[className: string]: boolean}): string;

/**
 * Specifying conditional class names using a cleaner syntax.
 * Usage:
 *  classnames({one: true, two: false}) // outputs: "one"
 *  classnames('static-1', {one: true, two: true}) // outputs: "static-1 one two"
 */
export function classnames(a: any, b?: any): string {
    if (typeof a === 'string') {
        if (b == null) {
            return a;
        } else {
            return [a].concat(getActiveClassNames(b)).join(' ');
        }
    } else {
        return getActiveClassNames(a).join(' ');
    }
}
