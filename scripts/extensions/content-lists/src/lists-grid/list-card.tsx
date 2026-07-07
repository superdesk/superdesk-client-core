import * as React from 'react';
import {
    Button,
    Dropdown,
    GridItem,
    GridItemContent,
    GridItemFooter,
    GridItemFooterBlock,
    GridItemText,
    IconButton,
    Label,
} from 'superdesk-ui-framework/react';
import {deleteList, fetchListItems} from '../api';
import {IContentList} from '../interfaces';
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
    constructor(props: IProps) {
        super(props);

        this.state = {
            previewTitles: null,
            itemsTotal: 0,
        };

        this.removeList = this.removeList.bind(this);
    }

    componentDidMount() {
        fetchListItems(this.props.list._id, {maxResults: PREVIEW_ITEMS_COUNT})
            .then((response) => {
                this.setState({
                    previewTitles: response._items.map((item) => item.article_content?.title ?? ''),
                    itemsTotal: response._meta.total,
                });
            })
            .catch(() => {
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
                        <h4
                            className={`sd-grid-item__title ${getClass('sd-grid-item__header-title')}`}
                            data-test-id="content-list-card--name"
                        >
                            {list.name}
                        </h4>
                        <span data-test-id="content-list-card--edit">
                            <Button
                                text={gettext('Edit')}
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
                                        <GridItemText>{gettext('No articles in this list')}</GridItemText>
                                    )
                                    : (
                                        <React.Fragment>
                                            {previewTitles.map((title, i) => (
                                                <GridItemText key={i}>{title}</GridItemText>
                                            ))}
                                            {
                                                itemsTotal > PREVIEW_ITEMS_COUNT && (
                                                    <GridItemText>
                                                        {
                                                            gettext('+{{n}} more', {
                                                                n: itemsTotal - PREVIEW_ITEMS_COUNT,
                                                            })
                                                        }
                                                    </GridItemText>
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
                                list.enabled !== false && (
                                    <Label text={gettext('active')} type="success" style="translucent" />
                                )
                            }
                        </GridItemFooterBlock>
                    </GridItemFooter>
                </GridItem>
            </div>
        );
    }
}
