import {SpaceComponent} from './SpaceComponent';

const SPACE_REGEX = / /g;

function findWithRegex(regex, contentBlock, callback) {
    const text = contentBlock.getText();
    let matches;
    let start;

    // tslint:disable-next-line no-conditional-assignment
    while ((matches = regex.exec(text)) !== null) {
        start = matches.index;
        callback(start, start + matches[0].length);
    }
}

/**
 * @name spaceStrategy
 * @param {Object} contentBlock The content block being scanned
 * @param {Function} callback The callback to call upon finding a range to decorate
 * @param {Object} contentState The content state
 * @description Defines the strategy for identifying ranges to decorate
 */
function spaceStrategy(contentBlock, callback, contentState) {
    findWithRegex(SPACE_REGEX, contentBlock, callback);
}

export const SpaceDecorator = {
    strategy: spaceStrategy,
    component: SpaceComponent,
};
