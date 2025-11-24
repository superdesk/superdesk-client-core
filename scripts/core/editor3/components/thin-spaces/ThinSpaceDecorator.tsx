import React, {CSSProperties} from 'react';
import {ContentBlock, ContentState} from 'draft-js';
import {IPropsDraftDecorator} from 'core/editor3/draftjs-types';

class ThinSpaceComponent extends React.Component<IPropsDraftDecorator> {
    render() {
        const wrapperStyle: CSSProperties = {
            position: 'relative',
            color: 'var(--sd-colour-interactive)',
            fontSize: '14px',
            fontWeight: 'bold',
            display: 'inline-grid',
            whiteSpace: 'pre',
            padding: '0 2px',
            placeItems: 'center',
        };

        const contentStyle: CSSProperties = {
            gridArea: '1 / 1 / 2 / 2',
            opacity: 0,
        };

        const indicatorStyle: CSSProperties = {
            gridArea: '1 / 1 / 2 / 2',
            opacity: 0.8,
            pointerEvents: 'none',
            userSelect: 'none',
        };

        return (
            <span
                style={wrapperStyle}
                title="Thin space"
            >
                <span style={contentStyle}>{this.props.children}</span>
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
