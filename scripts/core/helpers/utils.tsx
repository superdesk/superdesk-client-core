export const isEmptyString = (str?: string): boolean => typeof str === 'string' && str.length > 0;

// Unlike `String.prototype.trimStart` this only trims an exact match
export const trimStartExact = (str: string, toTrim: string) => {
    const checkStart = str.slice(0, toTrim.length);

    return checkStart === toTrim ? str.slice(toTrim.length) : str;
};

// Unlike `String.prototype.trimEnd` this only trims an exact match
export const trimEndExact = (str: string, toTrim: string) => {
    const checkEnd = str.slice(str.length - toTrim.length);

    return checkEnd === toTrim ? str.slice(0, str.length - toTrim.length) : str;
};
