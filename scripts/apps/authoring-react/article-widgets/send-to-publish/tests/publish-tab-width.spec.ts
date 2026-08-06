import {getWidgetWidth} from '../send-to-publish-widget';
import {singleColumnWidthRem} from 'core/interactive-article-actions-panel/actions/publish-action';

describe('send to / publish widget width', () => {
    it('is one column wide for the tabs that have a single column', () => {
        expect(getWidgetWidth(1)).toBe(`${singleColumnWidthRem}rem`);
    });

    it('allocates a full column to every contributed publishing section', () => {
        expect(getWidgetWidth(2)).toBe(`${singleColumnWidthRem * 2}rem`);
        expect(getWidgetWidth(3)).toBe(`${singleColumnWidthRem * 3}rem`);
    });

    it('widens by exactly one column per section', () => {
        const widthInRem = (columnCount: number) => parseFloat(getWidgetWidth(columnCount));

        expect(widthInRem(2) - widthInRem(1)).toBe(singleColumnWidthRem);
        expect(widthInRem(3) - widthInRem(2)).toBe(singleColumnWidthRem);
        expect(widthInRem(4) - widthInRem(3)).toBe(singleColumnWidthRem);
    });
});
