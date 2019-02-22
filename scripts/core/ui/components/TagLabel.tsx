import React from "react";

interface IProps {
    type?: 'rounded' | 'square';
    color?: 'gray-lighter' | 'gray' | 'blue-lighter' | 'blue';
    onRemove?(): void;
}

export class TagLabel extends React.Component<IProps> {
    render() {
        let classNames = ['tag-label'];

        const {type, color} = this.props;

        if (type === 'square') {
            classNames.push('tag-label--square');
        }

        if (color === 'gray') {
            classNames.push('tag-label--darker');
        } else if (color === 'blue-lighter') {
            classNames.push('tag-label--highlight1');
        }  else if (color === 'blue') {
            classNames.push('tag-label--highlight2');
        }

        return (
            <div className={classNames.join(' ')}>
                {this.props.children}
                {
                    typeof this.props.onRemove === 'function'
                        ? (
                            <button
                                onClick={this.props.onRemove}
                                className="tag-label__remove"
                            >
                                <i className="icon-close-small" />
                            </button>
                        ) : null
                }
            </div>
        );
    }
}
