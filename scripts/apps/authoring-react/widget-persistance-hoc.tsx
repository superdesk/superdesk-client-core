import {closedThroughAction} from 'apps/authoring/widgets/widgets';
import React, {RefObject} from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';

export let widgetState = {};

interface IProps {
    children: (
        widgetRef: RefObject<React.PureComponent<IArticleSideWidgetComponentType>>,
    ) => JSX.Element | Array<JSX.Element>;
    sideWidgetId: string;
    pinned: boolean;
}

export class WidgetStatePersistanceHOC extends React.PureComponent<IProps, any> {
    private widgetRef: RefObject<React.PureComponent<IArticleSideWidgetComponentType, any>>;

    constructor(props: IProps) {
        super(props);

        this.widgetRef = React.createRef<React.PureComponent<IArticleSideWidgetComponentType, any>>();
    }

    componentWillUnmount(): void {
        if (this.widgetRef?.current != null) {
            widgetState[this.props.sideWidgetId] = this.widgetRef.current.state;
        }

        // Reset widgetState if widget was closed through a function, or
        // if it wasn't pinned and got closed from re-rendering
        if (closedThroughAction.closed === true) {
            delete widgetState[this.props.sideWidgetId];
        }
    }

    render(): React.ReactNode {
        return this.props.children(this.widgetRef);
    }
}
