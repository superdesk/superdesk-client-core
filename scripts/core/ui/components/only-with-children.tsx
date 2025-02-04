import React from 'react';

interface IWrapper {
    wrapper: React.ComponentType;
}

interface IDirectElement {
    tagName?: keyof React.ReactHTML;
    className?: string;
    style?: React.CSSProperties;
}

function isWrapper(x: IProps): x is IWrapper {
    return x['wrapper'] != null;
}

type IProps = IWrapper | IDirectElement;

function hasChildren(children) {
    if (Array.isArray(children)) {
        return children.some((child) => hasChildren(child));
    } else if (children?.type?.name === 'OnlyWithChildren' && children?.props?.hasOwnProperty('children')) {
        return hasChildren(children.props.children);
    } else {
        return children != null && children !== false;
    }
}

/**
 * Doesn't render the parent when all children are null.
 * It only works with static values.
 * React components inside children array are treated as non-null, unless it's an instance of OnlyWithChildren.
*/
export class OnlyWithChildren extends React.PureComponent<IProps> {
    render() {
        if (hasChildren(this.props.children) !== true) {
            return null;
        }

        if (isWrapper(this.props)) {
            const Wrapper = this.props.wrapper;

            return (
                <Wrapper>{this.props.children}</Wrapper>
            );
        } else {
            return React.createElement(
                this.props.tagName ?? 'div',
                {
                    className: this.props.className,
                    style: this.props.style,
                },
                this.props.children,
            );
        }
    }
}
