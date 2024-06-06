
import {noop} from 'lodash';
import React from 'react';
import {IArticle, IArticleSideWidget} from 'superdesk-api';

interface IProps {
    widget: IArticleSideWidget;
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
                initialState={(() => {
                    const localStorageWidgetState = JSON.parse(localStorage.getItem('SIDE_WIDGET') ?? 'null');

                    if (localStorageWidgetState?.id === this.props.widget._id) {
                        const initialState = localStorageWidgetState?.initialState;

                        localStorage.removeItem('SIDE_WIDGET');

                        return initialState;
                    }
                })()}

                // below props are only relevant for authoring-react
                readOnly={undefined}
                contentProfile={undefined}
                fieldsData={undefined}
                onFieldsDataChange={noop}
                handleUnsavedChanges={undefined}

                // only used in widgets compatible with authoring-react
                authoringStorage={null}
                fieldsAdapter={null}
                storageAdapter={null}
                getLatestArticle={() => ({} as IArticle)}
            />
        );
    }
}
