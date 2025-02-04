import React from 'react';

import {IArticle} from 'superdesk-api';

interface IProps {
    item: IArticle;
    component: React.ComponentType<{ article: IArticle }>;
}

export class HeaderComponentField extends React.PureComponent<IProps> {
    render() {
        const Component = this.props.component;

        /**
         * Item properties are mutated from angular based authoring code.
         * Always create a new object to ensure that components from extensions
         * display the latest data, even if using React.PureComponent
         */
        const article = {...this.props.item};

        return (
            <Component article={article} />
        );
    }
}
