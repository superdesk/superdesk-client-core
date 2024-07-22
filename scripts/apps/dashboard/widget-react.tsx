
import {widgetState} from 'apps/authoring-react/widget-persistance-hoc';
import {closedOnRender} from 'apps/authoring/widgets/widgets';
import {noop} from 'lodash';
import React, {RefObject} from 'react';
import {
    IArticle,
    IArticleSideWidget,
    IArticleSideWidgetComponentType,
} from 'superdesk-api';

interface IProps {
    widget: {
        active: IArticleSideWidget;
        pinnedWidget: IArticleSideWidget;
    };
    article: IArticle;
}

export class WidgetReact extends React.PureComponent<IProps> {
    widgetRef: RefObject<React.PureComponent<IArticleSideWidgetComponentType>>;

    constructor(props) {
        super(props);
        this.widgetRef = React.createRef();
    }

    componentWillUnmount(): void {
        if (this.widgetRef?.current != null) {
            widgetState[this.props.widget.active._id] = this.widgetRef.current.state;
        }

        // Reset widgetState if widget was closed through a function, or
        // if it wasn't pinned and got closed from re-rendering
        if (
            closedOnRender.closed === false ||
            (closedOnRender.closed === true && this.props.widget.pinnedWidget == null)
        ) {
            delete widgetState[this.props.widget.active._id];
        }

        closedOnRender.closed = true;
    }

    render() {
        const Component = this.props.widget.active?.component ?? this.props.widget?.pinnedWidget?.component;

        // Ensure that widget component re-mounts if the item is locked/unlocked.
        // Avoid null key in case item is unlocked - use a random string to force it to re-mount.
        const key = this.props.article.lock_session ?? Math.random().toString();

        return (
            <Component
                ref={this.widgetRef}
                key={key}
                article={this.props.article}
                initialState={(() => {
                    const localStorageWidgetState = JSON.parse(localStorage.getItem('SIDE_WIDGET') ?? 'null');

                    if (localStorageWidgetState == null && closedOnRender.closed === true) {
                        const prevWidgetState = widgetState[this.props.widget.active._id];

                        if (prevWidgetState != null) {
                            return prevWidgetState;
                        }
                    }

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
