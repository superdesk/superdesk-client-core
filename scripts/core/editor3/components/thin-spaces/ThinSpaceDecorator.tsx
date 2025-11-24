import React from 'react';
import {ContentBlock, ContentState} from 'draft-js';
import {IPropsDraftDecorator} from 'core/editor3/draftjs-types';

class ThinSpaceComponent extends React.Component<IPropsDraftDecorator> {
    render() {
        const wrapperStyle: React.CSSProperties = {
            position: 'relative',
            color: 'var(--sd-colour-interactive)',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-block',
            whiteSpace: 'pre',
            padding: '0 2px',
        };

        const indicatorStyle: React.CSSProperties = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.8,
            pointerEvents: 'none',
            userSelect: 'none',
        };

        return (
            <span
                style={wrapperStyle}
                title="Thin space"
            >
                {this.props.children}
                <span
                    aria-hidden={true}
                    style={indicatorStyle}
                >
                    ¤
                </span>
            </span>
        );
    }
}

function ThinSpaceStrategy(
    contentBlock: ContentBlock,
    callback: (start: number, end: number) => void,
    contentState: ContentState,
) {
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
