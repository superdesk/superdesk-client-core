import * as React from 'react';
import {ContentBlock, ContentState} from 'draft-js';

interface IProps {
    contentState: ContentState;
    entityKey: string;
}

type IResult = {[blockKey: string]: {from: number; to: number}};

class Component extends React.Component<IProps> {
    render() {
        return (
            <span style={{borderBottom: '2px solid red'}}>{this.props.children}</span>
        );
    }
}

// max 1 result is cached
const cache = new Map<ContentState, IResult>();

function getRangesExceedingLimit(
    contentState: ContentState,
    limit: number,
): IResult {
    const cached = cache.get(contentState);

    if (cached != null) {
        return cached;
    } else {
        cache.clear();
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

    cache.set(contentState, decorations);

    return decorations;
}

export function getTextLimitHighlightDecorator(limit: number) {
    function strategy(contentBlock: ContentBlock, callback, contentState: ContentState) {
        const blockKey = contentBlock.getKey();
        const decoration = getRangesExceedingLimit(contentState, limit)[blockKey];

        if (decoration != null) {
            callback(decoration.from, decoration.to);
        }
    }

    const decorator = {
        strategy: strategy,
        component: Component,
    };

    return decorator;
}
