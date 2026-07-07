import * as React from 'react';
import {debounce} from 'lodash';
import {IPage} from 'superdesk-api';
import {Loader} from 'superdesk-ui-framework/react';
import {fetchLists} from './api';
import {LIST_ID_URL_PARAM} from './constants';
import {IContentList} from './interfaces';
import {ListEditor} from './list-editor/list-editor';
import {ListsGrid} from './lists-grid/lists-grid';
import {addContentListsChangeListener} from './live-updates';
import {superdesk} from './superdesk';

type IProps = React.ComponentProps<IPage['component']>;

interface IState {
    lists: Array<IContentList> | null;
}

/**
 * The selected list is stored in a URL query parameter rather than a path
 * segment; extension page routes don't reload on query parameter changes,
 * so navigating within the extension doesn't re-render the application
 * chrome (top menu flickering).
 */
export function getSelectedListId(): string | null {
    return superdesk.browser.location.urlParams.getString(LIST_ID_URL_PARAM) ?? null;
}

export function openListUrl(listId: string | null): void {
    superdesk.browser.location.urlParams.setString(LIST_ID_URL_PARAM, listId ?? undefined);
}

export class ContentListsPage extends React.PureComponent<IProps, IState> {
    private removeListsChangeListener: (() => void) | null;
    private refreshListsDebounced: () => void;

    constructor(props: IProps) {
        super(props);

        this.state = {lists: null};

        this.removeListsChangeListener = null;

        this.refreshLists = this.refreshLists.bind(this);
        this.refreshListsDebounced = debounce(this.refreshLists, 1000);
        this.handleUrlChange = this.handleUrlChange.bind(this);
    }

    componentDidMount() {
        this.refreshLists();

        this.removeListsChangeListener = addContentListsChangeListener(() => {
            this.refreshListsDebounced();
        });

        // the route doesn't reload on query parameter changes; re-render manually
        window.addEventListener('hashchange', this.handleUrlChange);
    }

    componentWillUnmount() {
        this.removeListsChangeListener?.();

        window.removeEventListener('hashchange', this.handleUrlChange);
    }

    handleUrlChange() {
        this.forceUpdate();
    }

    refreshLists(): Promise<void> {
        return fetchLists().then((lists) => {
            this.setState({lists});
        });
    }

    render() {
        const {lists} = this.state;
        const selectedListId = getSelectedListId();

        if (lists == null) {
            return <Loader overlay />;
        }

        if (selectedListId != null) {
            return (
                <ListEditor
                    key={selectedListId}
                    listId={selectedListId}
                    lists={lists}
                    onBack={() => {
                        openListUrl(null);
                    }}
                    onOpenList={(listId) => {
                        openListUrl(listId);
                    }}
                />
            );
        }

        return (
            <ListsGrid
                lists={lists}
                onOpenList={(listId) => {
                    openListUrl(listId);
                }}
                refreshLists={this.refreshLists}
            />
        );
    }
}
