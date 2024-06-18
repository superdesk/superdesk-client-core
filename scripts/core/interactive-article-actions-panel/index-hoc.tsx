import React from 'react';
import {IArticle} from 'superdesk-api';
import {addInternalEventListener, dispatchInternalEvent} from 'core/internal-events';
import {applicationState} from 'core/get-superdesk-api-implementation';
import {IArticleActionInteractive} from './interfaces';

interface IStateActive {
    active: true;
    tabs: Array<IArticleActionInteractive>;
    items: Array<IArticle>;
    activeTab: IArticleActionInteractive;
}

export type IStateInteractiveActionsPanelHOC = {active: false} | IStateActive;
export type IActionsInteractiveActionsPanelHOC = {closePanel(): void};

interface IProps {
    /**
     * Multiple instances of the component should be able to work at once.
     * `location` is added in order to be able to determine which one should be activated.
     */
    location: 'authoring' | 'list-view';
    children: (state: IStateInteractiveActionsPanelHOC, actions: IActionsInteractiveActionsPanelHOC) => JSX.Element;
}

export class WithInteractiveArticleActionsPanel extends React.PureComponent<IProps, IStateInteractiveActionsPanelHOC> {
    private eventListenersToRemoveBeforeUnmounting: Array<() => void>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            active: false,
        };

        this.eventListenersToRemoveBeforeUnmounting = [];
        this.closePanel = this.closePanel.bind(this);
    }

    componentDidMount() {
        this.eventListenersToRemoveBeforeUnmounting.push(
            addInternalEventListener('interactiveArticleActionStart', (event) => {
                const {items} = event.detail;

                const triggeredFromAuthoring =
                    items.length === 1
                    && items[0]._id === applicationState.articleInEditMode;

                if (
                    (this.props.location === 'authoring' && triggeredFromAuthoring === true)
                    || (this.props.location !== 'authoring' && triggeredFromAuthoring !== true)
                ) {
                    this.setState({
                        active: true,
                        ...event.detail,
                    });
                }
            }),
        );
    }

    componentWillUnmount() {
        this.eventListenersToRemoveBeforeUnmounting.forEach((removeListener) => {
            removeListener();
        });
    }

    closePanel() {
        this.setState({active: false});

        dispatchInternalEvent('interactiveArticleActionEnd', undefined);
    }

    render() {
        return this.props.children(this.state, {closePanel: this.closePanel});
    }
}
