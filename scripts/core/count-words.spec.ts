import {countWords} from './count-words';

describe('countWords function', () => {
    it('should count empty string as 0 words', () => {
        expect(countWords('   ')).toBe(0);
    });

    it('should count space separated digits as a single word', () => {
        expect(countWords('1 000 000')).toBe(1);
    });

    it('should count comma/dot separated digits as a single word', () => {
        expect(countWords('1,000,000')).toBe(1);
        expect(countWords('1.000.000')).toBe(1);
    });

    it('should work with unicode characters', () => {
        expect(countWords('hęllö wörld')).toBe(2);
        expect(countWords('Привет мир')).toBe(2);
    });

    it('should not count space separated non-letter characters as words', () => {
        expect(countWords('Comment sont les français ?')).toBe(4);
    });

    it('should count hyphenated words as one', () => {
        expect(countWords('real-time video')).toBe(2);
    });

    it('should count abbreviations as a single word', () => {
        expect(countWords('i.e. and e.g. are both Latin abbreviations.')).toBe(7);
    });

    it('should count URL as a single word', () => {
        expect(countWords('https://domain.com?q=1&w=[a,b,c]')).toBe(1);
    });
});
