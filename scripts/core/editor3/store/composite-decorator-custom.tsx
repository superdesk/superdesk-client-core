/* eslint-disable react/no-multi-comp */
/* eslint-disable react/display-name */

import React from 'react';
import {CompositeDecorator, ContentBlock, ContentState} from 'draft-js';
import {List} from 'immutable';

type IDecoration = string | null;

/**
 * Replacement for {@see CompositeDecorator} that supports
 * multiple decorations for a single character.
 */
export class CompositeDecoratorCustom {
    // Supports both - standard and composite decorators
    private decorators: Array<any>;

    constructor(decorators: Array<any> = []) {
        this.decorators = decorators.map((decorator) => {
            const isStandard = (decorator.strategy != null && decorator.component != null);
            const isComposite = isStandard !== true;

            return isComposite
                ? decorator
                : new CompositeDecorator([decorator]);
        });
    }

    getDecorations(block: ContentBlock, contentState: ContentState) {
        const blockLength = block.getText().length;

        // Array of decorations for each character in the block
        const result: Array<Array<IDecoration>> = [];

        for (let charIndex = 0; charIndex < blockLength; charIndex++) {
            result.push(
                this.decorators.map((decorator) => decorator.getDecorations(block, contentState).get(charIndex)),
            );
        }

        return List(result.map((decorator) => JSON.stringify(decorator)));
    }

    /**
     * @param key - stringified Array<IDecoration>
     */
    getComponentForKey(key: string) {
        const decorations: Array<string> = JSON.parse(key);

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
