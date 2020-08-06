
import React from 'react';
import {IArticle, IAuthoringSideWidget} from 'superdesk-api';

interface IProps {
    widget: IAuthoringSideWidget;
    article: IArticle;
}

export class WidgetReact extends React.PureComponent<IProps> {
    render() {
        const Component = this.props.widget.component;

        return (
            <Component article={this.props.article} />
        );
    }
}
