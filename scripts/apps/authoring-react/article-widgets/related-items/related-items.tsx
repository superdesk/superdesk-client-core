import React from 'react';
import {Badge, Button, EmptyState, IconButton, Input, Loader, Menu} from 'superdesk-ui-framework/react';
import {
    IArticle,
    IArticleSideWidget,
    IArticleSideWidgetComponentType,
    IContentProfileV2,
    IRestApiResponse,
} from 'superdesk-api';
import {gettext, getArticleLabel} from 'core/utils';
import {notify} from 'core/notify/notify';
import ng from 'core/services/ng';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {isHttpApiError} from 'core/helpers/network';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {Spacer} from 'core/ui/components/Spacer';
import {ActionsMenu} from 'apps/search/components/actions-menu/ActionsMenu';
import {getFieldsData} from '../../authoring-react';
import {getArticleAdapter} from '../../article-adapter';
import {previewAuthoringEntity} from '../../preview-article-modal';
import {RelatedItem} from './related-item';
import {RelatedItemsConfiguration} from './related-items-configuration';
import {
    canAssociateAsUpdate,
    canAssociateMetadata,
    DEFAULT_RELATED_ITEMS_CONFIGURATION,
    getMetadataToCopy,
    getModificationDateAfterQueryValue,
    getStoredConfiguration,
    hasEnoughKeywords,
    IRelatedItemsConfiguration,
    isRelatedItemsWidgetAllowed,
    RELATED_ITEMS_WIDGET_ID,
    storeConfiguration,
} from './related-items-logic';

const getLabel = () => gettext('Related Items');

/**
 * `existing-relations` lists the items already sharing an event id with the article; only when
 * there are none does the widget turn into a search for an item to relate.
 */
type IMode = 'loading' | 'existing-relations' | 'search';

interface IState {
    mode: IMode;
    items: Array<IArticle>;
    keyword: string;
    searching: boolean;

    /**
     * Tells an empty list apart from a search that has not run yet.
     */
    searched: boolean;
}

function openRelatedItem(item: IArticle): void {
    openArticle(item._id, item._type === 'published' ? 'view' : 'edit');
}

function getProfileSchema(article: IArticle): {[field: string]: unknown} | null {
    if (article.profile == null) {
        return null;
    }

    return (sdApi.contentProfiles.get(article.profile)?.schema as {[field: string]: unknown}) ?? null;
}

/**
 * The standard item actions menu, the same one monitoring puts on every item. It renders itself
 * into a container appended to the body, so the narrow widget panel does not clip it.
 */
class StandardItemActions extends React.PureComponent<{item: IArticle}> {
    render(): JSX.Element {
        return (
            <ActionsMenu
                item={this.props.item}
                onActioning={() => {
                    // the actioning state greys out a monitoring row; there is nothing to grey here
                }}
                scopeApply={(callback) => {
                    ng.get('$rootScope').$applyAsync(callback);
                }}
                template={(toggle, stopEvent) => (
                    <div onClick={stopEvent} data-test-id="related-item-actions">
                        <button className="icn-btn" onClick={toggle} aria-label={gettext('Item actions')}>
                            <i className="icon-dots-vertical" />
                        </button>
                    </div>
                )}
            />
        );
    }
}

interface IItemActionsProps {
    item: IArticle;
    actions: React.ComponentProps<typeof Menu>['items'];
}

class RelatedItemActions extends React.PureComponent<IItemActionsProps> {
    render(): JSX.Element {
        return (
            <div
                onClick={(event) => event.stopPropagation()}
                data-test-id="related-item-actions"
            >
                <Menu items={this.props.actions}>
                    {(toggle) => (
                        <IconButton
                            icon="dots-vertical"
                            ariaValue={gettext('Item actions')}
                            onClick={(event) => {
                                toggle(event);
                            }}
                        />
                    )}
                </Menu>
            </div>
        );
    }
}

export class RelatedItemsWidget
    extends React.Component<IArticleSideWidgetComponentType<IRelatedItemsConfiguration>, IState> {
    private mounted: boolean;

    constructor(props: IArticleSideWidgetComponentType<IRelatedItemsConfiguration>) {
        super(props);

        this.state = {
            mode: 'loading',
            items: [],
            keyword: props.article.slugline ?? '',
            ...(props.initialState ?? {}),

            // a request in flight when the widget was unmounted can not be resumed
            searching: false,
            searched: false,
        };

        this.mounted = false;

        this.search = this.search.bind(this);
        this.associateMetadata = this.associateMetadata.bind(this);
        this.associateAsUpdate = this.associateAsUpdate.bind(this);
        this.getActionsForItem = this.getActionsForItem.bind(this);
        this.setStateIfMounted = this.setStateIfMounted.bind(this);
        this.previewItem = this.previewItem.bind(this);
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    setStateIfMounted(state: Partial<IState>, callback?: () => void): void {
        if (this.mounted) {
            this.setState(state as IState, callback);
        }
    }

    componentDidMount(): void {
        this.mounted = true;

        if (this.state.mode !== 'loading') {
            return;
        }

        ng.get('familyService').fetchRelatedItems(this.props.article)
            .then((response: IRestApiResponse<IArticle>) => {
                const relatedItems = response?._items ?? [];

                // the article itself matches its own event id, so a single result means "no relations"
                if (relatedItems.length > 1) {
                    this.setStateIfMounted({mode: 'existing-relations', items: relatedItems});
                } else {
                    this.startSearchMode();
                }
            }, () => {
                // a failed lookup must not leave the widget stuck on a blank loading state
                this.startSearchMode();
            });
    }

    componentDidUpdate(prevProps: IArticleSideWidgetComponentType<IRelatedItemsConfiguration>): void {
        if (this.state.mode === 'search' && prevProps.configuration !== this.props.configuration) {
            this.search();
        }
    }

    getConfiguration(): IRelatedItemsConfiguration {
        return this.props.configuration ?? DEFAULT_RELATED_ITEMS_CONFIGURATION;
    }

    startSearchMode(): void {
        this.setStateIfMounted({mode: 'search'}, () => {
            if (this.state.keyword.length < 1) {
                notify.error(gettext('Error: Slugline required.'));
            } else {
                this.search();
            }
        });
    }

    search(): void {
        const {keyword} = this.state;
        const {sluglineMatch, modificationDateAfter} = this.getConfiguration();

        if (!hasEnoughKeywords(keyword)) {
            return;
        }

        this.setState({searching: true});

        ng.get('familyService').fetchRelatableItems(
            keyword,
            sluglineMatch,
            this.props.article,
            getModificationDateAfterQueryValue(modificationDateAfter),
        ).then((response: IRestApiResponse<IArticle>) => {
            this.setStateIfMounted({items: response?._items ?? [], searching: false, searched: true});
        }, () => {
            this.setStateIfMounted({searching: false, searched: true});
        });
    }

    /**
     * authoring-react rebuilds the item from `fieldsData` on every save, so patching the item
     * alone would be silently discarded. Persisting and then replaying the patch through
     * `replaceAuthoringDataWithChanges` is what refreshes the rendered fields, same as macros do.
     */
    associateMetadata(target: IArticle): void {
        const {article} = this.props;
        const patch = getMetadataToCopy(target, getProfileSchema(article));

        // `patch` swallows rejections, so the editor would be updated and success reported
        // even when nothing was persisted
        sdApi.article.patchThrowing(article, patch, {patchDirectlyAndOverwriteAuthoringValues: true})
            .then(() => {
                dispatchInternalEvent('replaceAuthoringDataWithChanges', patch);
                notify.success(gettext('item metadata associated.'));
            }, (error) => {
                if (isHttpApiError(error)) {
                    notify.error(
                        gettext('Failed to associate metadata: {{message}}', {message: error._error.message}),
                    );
                } else {
                    notify.error(gettext('There is an error. Failed to associate metadata.'));
                }
            });
    }

    associateAsUpdate(target: IArticle): void {
        // the rewrite carries the article as it is on screen, unsaved edits included.
        // authoring-angular stubs `getLatestArticle` with an empty object, hence the fallback.
        const latestArticle = this.props.getLatestArticle?.();
        const update = latestArticle?._id == null ? this.props.article : latestArticle;

        ng.get('api').save('archive_rewrite', {}, {update: {...update}}, target)
            .then((newItem: IArticle) => {
                notify.success(gettext('Story is associated as update.'));
                openArticle(newItem._id, 'edit');
            }, (response) => {
                if (response?.data?._message != null) {
                    notify.error(
                        gettext('Failed to associate update: {{message}}', {message: response.data._message}),
                    );
                } else {
                    notify.error(gettext('There is an error. Failed to associate update.'));
                }
            });
    }

    /**
     * The list can hold items with no content profile, and `getContentProfile` throws for one,
     * synchronously, where a rejection handler would not catch it. Such an item is previewed with
     * the profile of the article being edited.
     */
    getProfileForPreview(item: IArticle): Promise<IContentProfileV2 | null> {
        if (item.profile == null) {
            return Promise.resolve(this.props.contentProfile ?? null);
        }

        return this.props.authoringStorage.getContentProfile(item, this.props.fieldsAdapter);
    }

    previewItem(item: IArticle): void {
        const {authoringStorage, fieldsAdapter, storageAdapter} = this.props;
        const adapted = getArticleAdapter().toAuthoringReact(item);

        this.getProfileForPreview(adapted).then((profile) => {
            if (profile == null) {
                notify.error(gettext('There is no content profile to preview this item with.'));
                return;
            }

            const fieldsData = getFieldsData(
                adapted,
                profile.header.merge(profile.content).toOrderedMap(),
                fieldsAdapter,
                authoringStorage,
                storageAdapter,
                adapted.language,
            );

            previewAuthoringEntity(adapted, profile, fieldsData, getArticleLabel(adapted));
        }, () => {
            notify.error(gettext('There is an error. Failed to open the preview.'));
        });
    }

    getActionsForItem(item: IArticle): React.ComponentProps<typeof Menu>['items'] {
        const actions = [];

        // `needEditable` already keeps the widget shut on a read-only item; this only guards
        // against the item turning read-only while the widget is open
        const canModify = this.props.readOnly !== true;

        if (canModify && canAssociateMetadata(item)) {
            actions.push({
                label: gettext('Associate metadata'),
                onClick: () => this.associateMetadata(item),
            });
        }

        if (canModify && this.canAssociateAsUpdate(item)) {
            actions.push({
                label: gettext('Associate as update'),
                onClick: () => this.associateAsUpdate(item),
            });
        }

        actions.push({
            label: gettext('Open'),
            onClick: () => openRelatedItem(item),
        });

        return actions;
    }

    getEmptyStateTitle(): string {
        if (this.state.searching) {
            return gettext('Searching');
        }

        if (this.state.mode === 'search' && !this.state.searched) {
            return gettext('Search for an item to relate');
        }

        return gettext('No items found');
    }

    canAssociateAsUpdate(target: IArticle): boolean {
        return canAssociateAsUpdate({
            currentItem: this.props.article,
            hasRewritePrivilege: sdApi.user.hasPrivilege('rewrite'),
            targetCanBeRewritten: sdApi.article.itemAction(target).re_write === true,
        });
    }

    render(): JSX.Element {
        const {mode, items, searching} = this.state;
        const searchMode = mode === 'search';

        // in search mode angular only lists items the current article could be an update of
        const itemsToDisplay = searchMode ? items.filter((item) => this.canAssociateAsUpdate(item)) : items;

        return (
            <AuthoringWidgetLayout
                // the list sits on its own background, which the body paints rather than the panel,
                // whose own would take the header with it
                bodyClassName="related-items-widget__body"
                header={(
                    <AuthoringWidgetHeading
                        widgetId={RELATED_ITEMS_WIDGET_ID}
                        widgetName={searchMode ? gettext('Relate an item') : getLabel()}
                        editMode={false}

                        // the settings only shape the search, which existing relations do not run
                        configurable={searchMode}
                    />
                )}
                body={(
                    <Spacer v gap="16" noWrap alignItems="stretch" data-test-id="related-items-widget">
                        {mode === 'loading' && <Loader overlay />}
                        {
                            searchMode && (
                                // the ui-framework input takes no key handler, so Enter is caught
                                // here, as it bubbles
                                <div
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            this.search();
                                        }
                                    }}
                                >
                                    <Spacer h gap="8" noWrap alignItems="center" justifyContent="start">
                                        <i className="icon-search" />

                                        <Input
                                            type="text"
                                            label={gettext('Search')}
                                            inlineLabel
                                            labelHidden
                                            placeholder={gettext('Search')}
                                            value={this.state.keyword}
                                            onChange={(value) => {
                                                this.setState({keyword: value});
                                            }}
                                            data-test-id="related-items-search-input"
                                        />

                                        <Button
                                            text={gettext('Search')}
                                            size="small"
                                            onClick={this.search}
                                            disabled={!hasEnoughKeywords(this.state.keyword) || searching}
                                            data-test-id="related-items-search-button"
                                        />
                                    </Spacer>
                                </div>
                            )
                        }

                        {
                            itemsToDisplay.length < 1 && mode !== 'loading' ? (
                                <div data-test-id="related-items-empty-state">
                                    <EmptyState
                                        title={this.getEmptyStateTitle()}
                                        size="small"
                                    />
                                </div>
                            ) : (
                                <ul className="boxed-list">
                                    {
                                        itemsToDisplay.map((item) => (
                                            <RelatedItem
                                                key={item._id}
                                                item={item}
                                                current={item._id === this.props.article._id}
                                                onClick={() => this.previewItem(item)}
                                                badge={
                                                    searchMode ? (
                                                        <span
                                                            title={gettext('Can be associated as an update')}
                                                            data-test-id="related-item-update-badge"
                                                            className="sd-margin-end--1"
                                                        >
                                                            <Badge text="U" type="success" shape="square" />
                                                        </span>
                                                    ) : undefined
                                                }
                                                actions={
                                                    searchMode ? (
                                                        <RelatedItemActions
                                                            item={item}
                                                            actions={this.getActionsForItem(item)}
                                                        />
                                                    ) : (
                                                        <StandardItemActions item={item} />
                                                    )
                                                }
                                            />
                                        ))
                                    }
                                </ul>
                            )
                        }
                    </Spacer>
                )}
            />
        );
    }
}

export function getRelatedItemsWidget(): IArticleSideWidget<IRelatedItemsConfiguration> {
    const relatedItemsWidget: IArticleSideWidget<IRelatedItemsConfiguration> = {
        _id: RELATED_ITEMS_WIDGET_ID,
        label: getLabel(),
        order: 7,
        icon: 'related',
        component: RelatedItemsWidget,
        isAllowed: (article) => isRelatedItemsWidgetAllowed(article, getProfileSchema(article)),
        needEditable: true,
        needUnlock: true,
        configuration: {
            component: RelatedItemsConfiguration,
            getInitialConfiguration: getStoredConfiguration,
            onSave: storeConfiguration,
        },
    };

    return relatedItemsWidget;
}
