// KEEP CHANGES IN SYNC WITH SERVER FUNCTION `get_text_word_count`
export function countWords(str: string): number {
    const strTrimmed = str.trim();

    if (strTrimmed.length < 1) {
        return 0;
    }

    return strTrimmed
        .replace(/\n/g, ' ') // replace newlines with spaces

        // Remove spaces between two numbers
        // 1 000 000 000 -> 1000000000
        .replace(/([0-9]) ([0-9])/g, '$1$2')

        // remove anything that is not a unicode letter, a space or a number
        .replace(/[^\p{L} 0-9]/gu, '')

        // replace two or more spaces with one space
        .replace(/ {2,}/g, ' ')

        .trim()
        .split(' ')
        .length;
}
