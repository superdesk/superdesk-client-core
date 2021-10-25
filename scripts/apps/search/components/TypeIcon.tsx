import React from 'react';
import {gettext} from 'core/utils';

interface IProps {
    type: string;
    highlight?: boolean;
    'aria-hidden'?: boolean;
}

/**
 * Type icon component
 */
export class TypeIcon extends React.PureComponent<IProps> {
    render() {
        const {type, highlight} = this.props;

        if (type === 'composite' && highlight) {
            return (
                <i
                    className={'filetype-icon-highlight-pack'}
                    aria-label={gettext('Article Type {{type}}', {type})}
                    aria-hidden={this.props['aria-hidden'] ?? false}
                />
            );
        }

        return (
            <i
                className={'filetype-icon-' + type}
                title={gettext('Article Type: {{type}}', {type})}
                aria-label={gettext('Article Type {{type}}', {type})}
                aria-hidden={this.props['aria-hidden'] ?? false}
            />
        );
    }
}
