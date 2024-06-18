
import {noop} from 'lodash';
import React from 'react';
import {IArticle, IArticleSideWidget} from 'superdesk-api';

interface IProps {
    widget: {
        active: IArticleSideWidget;
        pinnedWidget: IArticleSideWidget;
    };
    article: IArticle;
}

interface IState {
    widgetDisplayed: IArticleSideWidget['component'];
}

export class WidgetReact extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            widgetDisplayed: this.props.widget.active?.component ?? this.props.widget?.pinnedWidget?.component,
        };
    }

    render() {
        const Component = this.state.widgetDisplayed;

        // Ensure that widget component re-mounts if the item is locked/unlocked.
        // Avoid null key in case item is unlocked - use a random string to force it to re-mount.
        const key = this.props.article.lock_session ?? Math.random().toString();

        return (
            <Component
                key={key}
                article={this.props.article}
                initialState={(() => {
                    const localStorageWidgetState = JSON.parse(localStorage.getItem('SIDE_WIDGET') ?? 'null');

                    if (localStorageWidgetState?.id
                        === (this.props.widget.active?._id ?? this.props.widget.pinnedWidget._id)) {
                        const initialState = localStorageWidgetState?.initialState;

                        localStorage.removeItem('SIDE_WIDGET');

                        return initialState;
                    } else {
                        return undefined;
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
