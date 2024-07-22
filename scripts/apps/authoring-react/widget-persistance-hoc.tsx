import {closedOnRender} from 'apps/authoring/widgets/widgets';
import React, {RefObject} from 'react';
import {IArticleSideWidgetComponentType} from 'superdesk-api';

export let widgetState = {};

interface IProps {
    children: (
        widgetRef: RefObject<React.PureComponent<IArticleSideWidgetComponentType>>,
    ) => JSX.Element | Array<JSX.Element>;
    sideWidgetId: string;
}

interface IState {
    mounted: boolean;
}

export class WidgetStatePersistenceHOC extends React.PureComponent<IProps, IState> {
    private widgetRef: RefObject<React.PureComponent<IArticleSideWidgetComponentType, any>>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            mounted: false,
        };
        this.widgetRef = React.createRef<React.PureComponent<IArticleSideWidgetComponentType, any>>();
    }

    componentDidMount(): void {
        this.setState({mounted: true});
    }

    componentWillUnmount(): void {
        if (this.widgetRef?.current != null) {
            widgetState[this.props.sideWidgetId] = this.widgetRef.current.state;
        }

        // Reset widgetState if widget was closed through a function, or
        // if it wasn't pinned and got closed from re-rendering
        if (closedOnRender.closed === false) {
            delete widgetState[this.props.sideWidgetId];
        }
    }

    render(): React.ReactNode {
        return this.state.mounted ? this.props.children(this.widgetRef) : null;
    }
}
