import React from 'react';
import {gettext} from 'core/utils';

interface IProps {
    type: string;
    highlight: boolean;
}

/**
 * Type icon component
 */
export class TypeIcon extends React.PureComponent<IProps> {
    render() {
        const {type, highlight} = this.props;

        if (type === 'composite' && highlight) {
            return <i className={'filetype-icon-highlight-pack'} />;
        }

        return <i className={'filetype-icon-' + type} title={gettext('Article Type: {{type}}', {type})} />;
    }
}