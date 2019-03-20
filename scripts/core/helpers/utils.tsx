/**
 * @name isEmptyString
 * @description Takes a string and checks if length of string is greater than 0
 * @param {String} the string
 * @returns {Boolean}
 */
export const isEmptyString = (string) => typeof string === 'string' && string.length > 0;
