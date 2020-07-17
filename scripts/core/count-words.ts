// KEEP CHANGES IN SYNC WITH SERVER FUNCTION `get_text_word_count`
export function countWords(str: string): number {
    return str.trim()
        // Remove spaces between two numbers
        // 1 000 000 000 -> 1000000000
        .replace(/([0-9]) ([0-9])/g, '$1$2')

        // split hyphenated words(2 letters or longer) so they are counted as multiple words
        // real-time video -> real time video
        .replace(/(\p{L}{2,})-(\p{L}{2,})/gu, '$1 $2')

        // remove anything that is not a unicode letter, a space or a number
        .replace(/[^\p{L} 0-9]/gu, '')

        // replace two or more spaces with one space
        .replace(/ {2,}/g, ' ')

        .trim()
        .split(' ')
        .length;
}
