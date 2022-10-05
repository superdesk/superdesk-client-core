/* eslint-disable no-redeclare */

function getActiveClassNames(obj: {[className: string]: boolean}) {
    return Object.entries(obj).filter(([_key, value]) => value === true).map(([key]) => key);
}

// overloads:

export function classnames(unconditional: string, obj: {[className: string]: boolean}): string;
export function classnames(obj: {[className: string]: boolean}): string;

/**
 * Specifying conditional class names using a cleaner syntax.
 * Usage:
 *  classnames({one: true, two: true, three: false, four: false, five: true}) // outputs: "one two five"
 *  classnames('static-1 static-2', {one: true, two: true, three: false, four: false, five: true}) // outputs: "static-1 static-2 one two five"
 */
export function classnames(a: any, b? :any): string {
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
