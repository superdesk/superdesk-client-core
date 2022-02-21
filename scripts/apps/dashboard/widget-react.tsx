
import React from 'react';
import {IArticle, IAuthoringSideWidget} from 'superdesk-api';

interface IProps {
    widget: IAuthoringSideWidget;
    article: IArticle;
}

export class WidgetReact extends React.PureComponent<IProps> {
    render() {
        const Component = this.props.widget.component;

        // Ensure that widget component re-mounts if the item is locked/unlocked.
        // Avoid null key in case item is unlocked - use a random string to force it to re-mount.
        const key = this.props.article.lock_session ?? Math.random().toString();

        return (
            <Component
                key={key}
                article={this.props.article}

                // below props are only relevant for authoring-react
                readOnly={undefined}
                contentProfile={undefined}
                fieldsData={undefined}
                handleUnsavedChanges={undefined}
            />
        );
    }
}
