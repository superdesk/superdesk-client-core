import React from 'react';
import {get} from 'lodash';
import {IPropsItemListInfo} from '../ListItemInfo';

class LanguageComponent extends React.Component<IPropsItemListInfo> {
    render() {
        const {item} = this.props;

        if (item.language == null) {
            return null;
        }

        return (
            <span key="language" className="language-label">
                {get(item, 'language')}
            </span>
        );
    }
}

export const language = LanguageComponent;
