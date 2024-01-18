/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */

import React from 'react';
import {CompositeDecorator, ContentBlock, ContentState} from 'draft-js';
import {List} from 'immutable';

/**
 * Replacement for {@see CompositeDecorator} that supports
 * multiple decorations for a single character.
 */
export class CompositeDecoratorCustom {
    // Supports both - standard and composite decorators
    private decorators: Array<CompositeDecorator>;

    constructor(decorators: Array<any> = []) {
        this.decorators = decorators.map((decorator) => {
            const isStandard = (decorator.strategy != null && decorator.component != null);
            const isComposite = isStandard !== true;

            return isComposite
                ? decorator
                : new CompositeDecorator([decorator]);
        });
    }

    getDecorations(block: ContentBlock, contentState: ContentState): List<string> {
        const blockLength = block.getText().length;
        const decorationsByDecoratorIndex = {};

        this.decorators.forEach((decorator, index) => {
            decorationsByDecoratorIndex[index] = decorator.getDecorations(block, contentState);
        });

        let result: List<string> = List();

        for (let charIndex = 0; charIndex < blockLength; charIndex++) {
            result = result.push(
                JSON.stringify(
                    this.decorators.map(
                        (_, decoratorIndex) => decorationsByDecoratorIndex[decoratorIndex].get(charIndex),
                    ),
                ),
            );
        }

        return result;
    }

    /**
     * @param key - stringified Array<IDecoration>
     */
    getComponentForKey(key: string) {
        const decorations: Array<string | null> = JSON.parse(key);

        return (props) => {
            const {decoratorProps, ...compositionProps} = props;

            const Composed = decorations.reduce(
                (Composition: React.ComponentType, decoration, i) => {
                    if (decoration == null) {
                        return Composition;
                    }

                    const decorator = this.decorators[i];
                    const Component = decorator.getComponentForKey(decoration);
                    const componentProps = {
                        ...compositionProps,
                        ...decoratorProps[i],
                    };

                    return () => (
                        <Component {...componentProps}>
                            <Composition {...compositionProps} />
                        </Component>
                    );
                },
                ({children}) => (<span>{children}</span>),
            );

            return (
                <Composed>{props.children}</Composed>
            );
        };
    }

    /**
     * @param key - stringified Array<IDecoration>
     */
    getPropsForKey(key: string) {
        const decorations: Array<string> = JSON.parse(key);

        return {
            decoratorProps: decorations.map((decoration, i) => {
                const decorator = this.decorators[i];

                return decoration == null ? {} : decorator.getPropsForKey(decoration);
            }),
        };
    }
}
