import * as React from 'react';
import {debounce} from 'lodash';
import {IPage} from 'superdesk-api';
import {Loader} from 'superdesk-ui-framework/react';
import {fetchLists} from './api';
import {CONTENT_LISTS_PAGE_URL} from './constants';
import {IContentList} from './interfaces';
import {ListEditor} from './list-editor/list-editor';
import {ListsGrid} from './lists-grid/lists-grid';
import {addContentListsChangeListener} from './live-updates';
import {superdesk} from './superdesk';

type IProps = React.ComponentProps<IPage['component']>;

interface IState {
    lists: Array<IContentList> | null;
}

export function getSelectedListId(): string | null {
    const page = superdesk.browser.location.getPage();
    const prefix = `${CONTENT_LISTS_PAGE_URL}/`;

    return page.startsWith(prefix) ? page.slice(prefix.length) : null;
}

export function openListUrl(listId: string | null): void {
    superdesk.browser.location.setPage(
        listId == null ? CONTENT_LISTS_PAGE_URL : `${CONTENT_LISTS_PAGE_URL}/${listId}`,
    );
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
    }

    componentDidMount() {
        this.refreshLists();

        this.removeListsChangeListener = addContentListsChangeListener(() => {
            this.refreshListsDebounced();
        });
    }

    componentWillUnmount() {
        this.removeListsChangeListener?.();
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
