import React from 'react';
import {OrderedMap, Set} from 'immutable';
import {
    IWebsocketMessage,
    IResourceUpdateEvent,
    IResourceDeletedEvent,
} from 'superdesk-api';
import {addWebsocketEventListener} from './notification/notification';

export interface IMultiSelectOptions<T> {
    selected: OrderedMap<string, T>;
    select(item: T): void;
    selectMultiple(items: OrderedMap<string, T>): void;
    unselect(item: T): void;
    unselectAll(): void;
    toggle(item: T): void;
}

interface IProps<T> {
    getId(item: T): string;

    // used to listen for websocket events in order to decide if items have to be unselected
    resourceNames: Array<string>;

    children: (options: IMultiSelectOptions<T>) => JSX.Element;

    /**
     * When items are updated/deleted, we need to check if they should be unselected
     * in case they no longer match the query and thus are no longer visible
     * in the list view.
     */
    shouldUnselect(ids: Set<string>): Promise<Set<string>>;
}

interface IState<T> {
    selected: OrderedMap<string, T>;
}

export class MultiSelectHoc<T> extends React.PureComponent<IProps<T>, IState<T>> {
    private removeContentUpdateListener: () => void;
    private removeResourceDeletedListener: () => void;
    private maybeUnselectItems: (ids: globalThis.Set<string>) => void;

    constructor(props: IProps<T>) {
        super(props);

        this.state = {
            selected: OrderedMap<string, T>(),
        };

        this.select = this.select.bind(this);
        this.selectMultiple = this.selectMultiple.bind(this);
        this.unselect = this.unselect.bind(this);
        this.toggle = this.toggle.bind(this);
        this.unselectAll = this.unselectAll.bind(this);
    }
    select(item: T) {
        const {getId} = this.props;

        this.setState({selected: this.state.selected.set(getId(item), item)});
    }
    selectMultiple(items: OrderedMap<string, T>): void {
        this.setState({selected: this.state.selected.merge(items)});
    }
    unselect(item: T) {
        const {getId} = this.props;

        this.setState({selected: this.state.selected.remove(getId(item))});
    }
    toggle(item: T) {
        const {getId} = this.props;

        if (this.state.selected.has(getId(item))) {
            this.unselect(item);
        } else {
            this.select(item);
        }
    }
    unselectAll() {
        this.setState({selected: OrderedMap<string, T>()});
    }
    _maybeUnselectItems(ids: globalThis.Set<string>) { // only throttled version should be used internally
        this.props.shouldUnselect(Set(Array.from(ids))).then((idsToUnselect) => {
            if (idsToUnselect.size > 0) {
                let {selected} = this.state;

                idsToUnselect.forEach((_id) => {
                    selected = selected.remove(_id);
                });

                this.setState({selected});
            }
        });
    }
    handleContentChanges(resource: string, id: string) {
        // Unselect items that no longer match the query.

        if (this.props.resourceNames.includes(resource) && this.state.selected.has(id)) {
            this.maybeUnselectItems(new global.Set([id]));
        }
    }
    componentDidMount() {
        // Skipping created event, because a resource that is not created will not be selected.

        this.removeContentUpdateListener = addWebsocketEventListener(
            'resource:updated',
            (event: IWebsocketMessage<IResourceUpdateEvent>) => {
                const {resource, _id} = event.extra;

                this.handleContentChanges(resource, _id);
            },
        );

        this.removeResourceDeletedListener = addWebsocketEventListener(
            'resource:deleted',
            (event: IWebsocketMessage<IResourceDeletedEvent>) => {
                const {resource, _id} = event.extra;

                this.handleContentChanges(resource, _id);
            },
        );
    }
    componentWillUnmount() {
        this.removeContentUpdateListener();
        this.removeResourceDeletedListener();
    }
    render() {
        return this.props.children({
            selected: this.state.selected,
            select: this.select,
            selectMultiple: this.selectMultiple,
            unselect: this.unselect,
            unselectAll: this.unselectAll,
            toggle: this.toggle,
        });
    }
}
