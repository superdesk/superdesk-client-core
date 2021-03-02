import React from 'react';
import {OrderedMap, Set} from 'immutable';
import {
    IArticle,
    IWebsocketMessage,
    IResourceUpdateEvent,
    IResourceDeletedEvent,
} from 'superdesk-api';
import {addWebsocketEventListener} from './notification/notification';
import {ARTICLE_RELATED_RESOURCE_NAMES} from './constants';
import {throttleAndCombineSet} from './itemList/throttleAndCombine';
import {generateTrackByIdentifier} from 'apps/search/services/SearchService';

export interface IMultiSelectOptions {
    selected: OrderedMap<string, IArticle>;
    select(item: IArticle): void;
    selectMultiple(items: OrderedMap<string, IArticle>): void;
    unselect(id: string): void;
    unselectAll(): void;
    toggle(item: IArticle): void;
}

interface IProps {
    children: (options: IMultiSelectOptions) => JSX.Element;

    /**
     * When items are updated/deleted, we need to check if they should be unselected
     * in case they no longer match the query and thus are no longer visible
     * in the list view.
     */
    shouldUnselect(ids: Set<string>): Promise<Set<string>>;
}

interface IState {
    selected: OrderedMap<string, IArticle>;
}

export class MultiSelectHoc extends React.PureComponent<IProps, IState> {
    private removeContentUpdateListener: () => void;
    private removeResourceDeletedListener: () => void;
    private maybeUnselectItems: (ids: globalThis.Set<string>) => void;

    constructor(props: IProps) {
        super(props);

        this.state = {
            selected: OrderedMap<string, IArticle>(),
        };

        this.select = this.select.bind(this);
        this.selectMultiple = this.selectMultiple.bind(this);
        this.unselect = this.unselect.bind(this);
        this.toggle = this.toggle.bind(this);
        this.unselectAll = this.unselectAll.bind(this);
        this.handleContentChanges = this.handleContentChanges.bind(this);
        this.maybeUnselectItems = throttleAndCombineSet(this._maybeUnselectItems.bind(this), 500);
    }
    select(item: IArticle) {
        this.setState({selected: this.state.selected.set(generateTrackByIdentifier(item), item)});
    }
    selectMultiple(items: OrderedMap<string, IArticle>): void {
        this.setState({selected: this.state.selected.merge(items)});
    }
    unselect(id: string) {
        this.setState({selected: this.state.selected.remove(id)});
    }
    toggle(item: IArticle) {
        if (this.state.selected.has(generateTrackByIdentifier(item))) {
            this.unselect(generateTrackByIdentifier(item));
        } else {
            this.select(item);
        }
    }
    unselectAll() {
        this.setState({selected: OrderedMap<string, IArticle>()});
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

        if (ARTICLE_RELATED_RESOURCE_NAMES.includes(resource) && this.state.selected.has(id)) {
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
