import React from 'react';
import {IPropsDraftDecorator} from 'core/editor3/draftjs-types';

class ThinSpaceComponent extends React.Component<IPropsDraftDecorator> {
    render() {
        return (
            <span
                style={{
                    position: 'relative',
                    color: 'var(--sd-colour-interactive)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
                title="Thin space"
            >
                <span style={{opacity: 0.8}}>¤</span>
                {this.props.children}
            </span>
        );
    }
}

function ThinSpaceStrategy(contentBlock, callback, contentState) {
    const text = contentBlock.getText();
    const thinSpaceChar = '\u2009';
    let index = text.indexOf(thinSpaceChar);

    while (index !== -1) {
        callback(index, index + 1);
        index = text.indexOf(thinSpaceChar, index + 1);
    }
}

export const ThinSpaceDecorator = {
    strategy: ThinSpaceStrategy,
    component: ThinSpaceComponent,
};
