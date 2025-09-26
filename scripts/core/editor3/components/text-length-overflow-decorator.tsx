/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */
import * as React from 'react';
import {CompositeDecorator, ContentBlock, ContentState} from 'draft-js';

interface IProps {
    contentState: ContentState;
    entityKey: string;
    color?: string;
}

type IResult = {[blockKey: string]: {from: number; to: number}};

class Component extends React.Component<IProps> {
    render() {
        return (
            <span style={{color: this.props.color}}>{this.props.children}</span>
        );
    }
}

const caches: {[key: string]: Map<ContentState, IResult>} = {};

function getRangesExceedingLimit(
    contentState: ContentState,
    limit: number,
    cacheKey: string,
): IResult {
    if (caches[cacheKey] == null) {
        caches[cacheKey] = new Map<ContentState, IResult>();
    }

    const cached = caches[cacheKey].get(contentState);

    if (cached != null) {
        return cached;
    } else {
        caches[cacheKey].clear();
    }

    const decorations = {};

    let charactersCounted = 0;

    for (const block of contentState.getBlocksAsArray()) {
        const blockLength = block.getLength();
        const entireBlockExceedsLimit = charactersCounted > limit;

        if (entireBlockExceedsLimit) {
            decorations[block.getKey()] = {
                from: 0,
                to: blockLength,
            };
        } else {
            const exceedingStartsInThisBlock = charactersCounted + blockLength > limit;

            if (exceedingStartsInThisBlock) {
                decorations[block.getKey()] = {
                    from: limit - charactersCounted,
                    to: blockLength,
                };
            }
        }

        charactersCounted += blockLength;
    }

    caches[cacheKey].set(contentState, decorations);

    return decorations;
}

export function getTextLimitHighlightDecorator(hardLimit: number, softLimit?: number): any {
    function strategyForHardLimit(contentBlock: ContentBlock, callback, contentState: ContentState) {
        const blockKey = contentBlock.getKey();
        const decoration = getRangesExceedingLimit(contentState, hardLimit, 'hard')[blockKey];

        if (decoration != null) {
            callback(decoration.from, decoration.to);
        }
    }

    function strategyForSoftLimit(contentBlock: ContentBlock, callback, contentState: ContentState) {
        const blockKey = contentBlock.getKey();
        const decoration = getRangesExceedingLimit(contentState, softLimit, 'soft')[blockKey];

        if (decoration != null) {
            let decorationTo = decoration.to;

            if (hardLimit && hardLimit < decoration.to) {
                decorationTo = hardLimit;
            }

            if (decoration.from < decorationTo) {
                callback(decoration.from, decorationTo);
            }
        }
    }

    const decorators = [
        {
            strategy: strategyForHardLimit,
            component: (props) => <Component {...props} color="var(--sd-editor-colour__hard-limit)" />,
        },
    ];

    if (typeof softLimit === 'number') {
        decorators.push({
            strategy: strategyForSoftLimit,
            component: (props) => <Component {...props} color="var(--sd-editor-colour__soft-limit)" />,
        });
    }

    const decorator = new CompositeDecorator(decorators);

    return decorator;
}
