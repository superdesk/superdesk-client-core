import React from 'react';

import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    component: React.ComponentType<{ article: IArticle }>;
}

export class HeaderComponentField extends React.PureComponent<IProps> {
    render() {
        const Component = this.props.component;

        return (
            <Component article={this.props.item} />
        );
    }
}
