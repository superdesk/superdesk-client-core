import * as React from 'react';
import {
    Button,
    Dropdown,
    EmptyState,
    GridItem,
    GridItemContent,
    GridItemFooter,
    GridItemFooterBlock,
    IconButton,
    Label,
    SimpleList,
    SimpleListItem,
    Text,
} from 'superdesk-ui-framework/react';
import {debounce} from 'lodash';
import {deleteList, fetchListItems} from '../api';
import {IContentList} from '../interfaces';
import {addArticleChangesListener} from '../live-updates';
import {superdesk} from '../superdesk';

const {gettext} = superdesk.localization;
const {notify} = superdesk.ui;
const {getRelativeOrAbsoluteDateTime} = superdesk.localization;
const {getClass} = superdesk.utilities.CSS;

const PREVIEW_ITEMS_COUNT = 5;

interface IProps {
    list: IContentList;
    onOpenList(listId: string): void;
    onOpenSettings(): void;
    refreshLists(): Promise<void>;
}

interface IState {
    previewTitles: Array<string> | null;
    itemsTotal: number;
}

export class ListCard extends React.PureComponent<IProps, IState> {
    private removeArticleChangesListener: (() => void) | null;
    private loadPreviewDebounced: () => void;
    // article ids currently shown in the preview; kept out of the state
    // because rendering doesn't depend on them
    private previewContentIds: Set<string>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            previewTitles: null,
            itemsTotal: 0,
        };

        this.removeArticleChangesListener = null;
        this.previewContentIds = new Set();

        this.removeList = this.removeList.bind(this);
        this.loadPreview = this.loadPreview.bind(this);
        this.loadPreviewDebounced = debounce(this.loadPreview, 1000);
    }

    componentDidMount() {
        this.loadPreview();

        // preview titles are resolved at read time on the backend; an article
        // change doesn't touch content_list_items_updated_at, so re-fetch on
        // the public content:update event. That event is global, so only the
        // cards actually previewing a changed article refetch - otherwise a
        // single article change would cost one request per rendered card.
        this.removeArticleChangesListener = addArticleChangesListener((changedArticleIds) => {
            const previewed = Array.from(changedArticleIds).some(
                (articleId) => this.previewContentIds.has(articleId),
            );

            if (previewed) {
                this.loadPreviewDebounced();
            }
        });
    }

    componentWillUnmount() {
        this.removeArticleChangesListener?.();
    }

    componentDidUpdate(prevProps: IProps) {
        if (prevProps.list.content_list_items_updated_at !== this.props.list.content_list_items_updated_at) {
            this.loadPreview();
        }
    }

    loadPreview() {
        fetchListItems(this.props.list._id, {maxResults: PREVIEW_ITEMS_COUNT})
            .then((response) => {
                this.previewContentIds = new Set(response._items.map((item) => item.content));

                this.setState({
                    previewTitles: response._items.map(
                        (item) => item.article_content == null
                            ? gettext('Article no longer available')
                            : item.article_content.title,
                    ),
                    itemsTotal: response._meta.total,
                });
            })
            .catch(() => {
                this.previewContentIds = new Set();
                this.setState({previewTitles: []});
            });
    }

    removeList() {
        superdesk.ui.confirm(gettext('Please confirm you want to delete the list.'))
            .then((confirmed) => {
                if (!confirmed) {
                    return;
                }

                deleteList(this.props.list)
                    .then(() => this.props.refreshLists())
                    .catch(() => {
                        notify.error(gettext('Could not delete the list.'));
                    });
            });
    }

    render() {
        const {list} = this.props;
        const {previewTitles, itemsTotal} = this.state;

        const itemsUpdatedAt = list.content_list_items_updated_at;

        return (
            <div data-test-id="content-list-card" data-test-value={list.name}>
                <GridItem>
                    <div className={getClass('sd-grid-item__header')}>
                        <h3
                            className={`sd-grid-item__title ${getClass('sd-grid-item__header-title')}`}
                            data-test-id="content-list-card--name"
                        >
                            {list.name}
                        </h3>
                        <span data-test-id="content-list-card--edit">
                            <Button
                                text={gettext('Edit')}
                                type="tertiary"
                                size="small"
                                onClick={() => {
                                    this.props.onOpenList(list._id);
                                }}
                            />
                        </span>
                        <Dropdown
                            items={[
                                {
                                    label: gettext('Settings'),
                                    icon: 'settings',
                                    onSelect: () => {
                                        this.props.onOpenSettings();
                                    },
                                },
                                {
                                    label: gettext('Remove'),
                                    icon: 'trash',
                                    onSelect: this.removeList,
                                },
                            ]}
                        >
                            <IconButton
                                icon="dots-vertical"
                                ariaValue={gettext('Actions')}
                                onClick={() => false}
                            />
                        </Dropdown>
                    </div>
                    <GridItemContent>
                        {
                            previewTitles != null && (
                                previewTitles.length < 1
                                    ? (
                                        <EmptyState
                                            size="small"
                                            title={gettext('No articles in this list')}
                                        />
                                    )
                                    : (
                                        <React.Fragment>
                                            <SimpleList density="compact" className="pb-0-5">
                                                {previewTitles.map((title, i) => (
                                                    <SimpleListItem key={i}>
                                                        <Text className="mb-0">{title}</Text>
                                                    </SimpleListItem>
                                                ))}
                                            </SimpleList>
                                            {
                                                itemsTotal > PREVIEW_ITEMS_COUNT && (
                                                    <Text color="lighter" className="mb-0">
                                                        {
                                                            gettext('+{{n}} more', {
                                                                n: itemsTotal - PREVIEW_ITEMS_COUNT,
                                                            })
                                                        }
                                                    </Text>
                                                )
                                            }
                                        </React.Fragment>
                                    )
                            )
                        }
                    </GridItemContent>
                    <GridItemFooter>
                        <GridItemFooterBlock align="left">
                            <span className="sd-grid-item__text-label">
                                {gettext('Items updated:')}
                            </span>
                            <span>
                                {
                                    itemsUpdatedAt == null
                                        ? gettext('never')
                                        : getRelativeOrAbsoluteDateTime(itemsUpdatedAt, 'HH:mm, DD.MM.YYYY')
                                }
                            </span>
                        </GridItemFooterBlock>
                        <GridItemFooterBlock align="right">
                            {
                                list.enabled !== false
                                    ? <Label text={gettext('active')} type="success" style="translucent" />
                                    : <Label text={gettext('disabled')} type="alert" style="translucent" />
                            }
                        </GridItemFooterBlock>
                    </GridItemFooter>
                </GridItem>
            </div>
        );
    }
}
