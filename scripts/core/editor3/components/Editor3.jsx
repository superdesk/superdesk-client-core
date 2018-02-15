import React from 'react';

import {Editor3Component} from './Editor3Component';
import {MultipleHighlights} from './MultipleHighlights';

const availableHighlights = {
    // [highlightType]: [CSS Object],

    // EXAMPLES:
    // comment: {
    //     backgroundColor: 'green'
    // },
    // annotation: {
    //     backgroundColor: 'orange'
    // },
};

export class Editor3 extends React.Component {
    static getDecorator(disableSpellchecker) {
        return Editor3Component.getDecorator(disableSpellchecker);
    }
    render() {
        return (
            <MultipleHighlights availableHighlights={availableHighlights}>
                <Editor3Component {...this.props} />
            </MultipleHighlights>
        );
    }
}
