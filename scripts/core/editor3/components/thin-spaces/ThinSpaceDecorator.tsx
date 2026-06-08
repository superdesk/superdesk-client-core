import React, {CSSProperties} from 'react';
import {ContentBlock, ContentState} from 'draft-js';
import {IPropsDraftDecorator} from 'core/editor3/draftjs-types';
import {THIN_SPACE_CHAR} from 'core/editor3/constants';
import {gettext} from 'core/utils';

class ThinSpaceComponent extends React.Component<IPropsDraftDecorator> {
    render() {
        const wrapperStyle: CSSProperties = {
            position: 'relative',
            color: 'var(--sd-colour-interactive)',
            display: 'inline-grid',
            padding: '0 var(--space--0-5)',
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
                className="whitespace-pre text-sm font-bold place-items-center"
                style={wrapperStyle}
                title={gettext('Thin space')}
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
    let index = text.indexOf(THIN_SPACE_CHAR);

    while (index !== -1) {
        callback(index, index + 1);
        index = text.indexOf(THIN_SPACE_CHAR, index + 1);
    }
}

export const ThinSpaceDecorator = {
    strategy: ThinSpaceStrategy,
    component: ThinSpaceComponent,
};
