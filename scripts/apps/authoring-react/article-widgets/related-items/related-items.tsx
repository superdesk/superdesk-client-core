import React from 'react';
import {Button, Input, Loader, Option, Select} from 'superdesk-ui-framework/react';
import {IArticle, IArticleSideWidget, IArticleSideWidgetComponentType, IRestApiResponse} from 'superdesk-api';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';
import ng from 'core/services/ng';
import {sdApi} from 'api';
import {dispatchInternalEvent} from 'core/internal-events';
import {isHttpApiError} from 'core/helpers/network';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {AuthoringWidgetHeading} from 'apps/dashboard/widget-heading';
import {AuthoringWidgetLayout} from 'apps/dashboard/widget-layout';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {Spacer} from 'core/ui/components/Spacer';
import {
    canAssociateAsUpdate,
    canAssociateMetadata,
    DEFAULT_MODIFICATION_DATE_AFTER,
    DEFAULT_SLUGLINE_MATCH,
    getMetadataToCopy,
    getModificationDateAfterQueryValue,
    hasEnoughKeywords,
    IModificationDateAfter,
    ISluglineMatch,
    isRelatedItemsWidgetAllowed,
    MODIFICATION_DATE_AFTER_STORAGE_KEY,
    RELATED_ITEMS_WIDGET_ID,
    SLUGLINE_MATCH_STORAGE_KEY,
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
    sluglineMatch: ISluglineMatch;
    modificationDateAfter: IModificationDateAfter;
    searching: boolean;
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

export class RelatedItemsWidget extends React.Component<IArticleSideWidgetComponentType, IState> {
    private mounted: boolean;

    constructor(props: IArticleSideWidgetComponentType) {
        super(props);

        this.state = {
            mode: 'loading',
            items: [],
            keyword: props.article.slugline ?? '',
            sluglineMatch: sdApi.localStorage.getItem(SLUGLINE_MATCH_STORAGE_KEY) ?? DEFAULT_SLUGLINE_MATCH,
            modificationDateAfter:
                sdApi.localStorage.getItem(MODIFICATION_DATE_AFTER_STORAGE_KEY) ?? DEFAULT_MODIFICATION_DATE_AFTER,
            ...(props.initialState ?? {}),

            // a request in flight when the widget was unmounted can not be resumed
            searching: false,
        };

        this.mounted = false;

        this.search = this.search.bind(this);
        this.associateMetadata = this.associateMetadata.bind(this);
        this.associateAsUpdate = this.associateAsUpdate.bind(this);
        this.getActionsForItem = this.getActionsForItem.bind(this);
        this.setStateIfMounted = this.setStateIfMounted.bind(this);
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
        const {keyword, sluglineMatch, modificationDateAfter} = this.state;

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
            this.setStateIfMounted({items: response?._items ?? [], searching: false});
        }, () => {
            this.setStateIfMounted({searching: false});
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

    getActionsForItem(item: IArticle): React.ComponentProps<typeof ArticleItemConcise>['actionsMenu'] {
        if (this.state.mode !== 'search') {
            return [
                {
                    label: gettext('Open'),
                    onClick: () => openRelatedItem(item),
                },
            ];
        }

        const actions = [];

        // angular declares `needEditable` and `needUnlock`, which lock the whole widget
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
                header={(
                    <AuthoringWidgetHeading
                        widgetId={RELATED_ITEMS_WIDGET_ID}
                        widgetName={searchMode ? gettext('Relate an item') : getLabel()}
                        editMode={false}
                    />
                )}
                body={(
                    <Spacer v gap="16" noWrap alignItems="stretch" data-test-id="related-items-widget">
                        {mode === 'loading' && <Loader overlay />}
                        {
                            searchMode && (
                                <Spacer v gap="8" noWrap alignItems="stretch">
                                    <Input
                                        type="text"
                                        label={gettext('Search')}
                                        inlineLabel
                                        labelHidden
                                        value={this.state.keyword}
                                        onChange={(value) => {
                                            this.setState({keyword: value});
                                        }}
                                        data-test-id="related-items-search-input"
                                    />

                                    <Button
                                        text={gettext('Search')}
                                        onClick={this.search}
                                        disabled={!hasEnoughKeywords(this.state.keyword) || searching}
                                        data-test-id="related-items-search-button"
                                    />

                                    <Select
                                        label={gettext('Slugline Match')}
                                        value={this.state.sluglineMatch}
                                        onChange={(value: ISluglineMatch) => {
                                            sdApi.localStorage.setItem(SLUGLINE_MATCH_STORAGE_KEY, value);
                                            this.setState({sluglineMatch: value}, this.search);
                                        }}
                                        data-test-id="related-items-slugline-match"
                                    >
                                        <Option value="EXACT">{gettext('Exact')}</Option>
                                        <Option value="ANY">{gettext('Match Any')}</Option>
                                        <Option value="PREFIX">{gettext('Match Prefix')}</Option>
                                    </Select>

                                    <Select
                                        label={gettext('Last Updated')}
                                        value={this.state.modificationDateAfter}
                                        onChange={(value: IModificationDateAfter) => {
                                            sdApi.localStorage.setItem(MODIFICATION_DATE_AFTER_STORAGE_KEY, value);
                                            this.setState({modificationDateAfter: value}, this.search);
                                        }}
                                        data-test-id="related-items-last-updated"
                                    >
                                        <Option value="now-6h">{gettext('6 Hours')}</Option>
                                        <Option value="now-12h">{gettext('12 Hours')}</Option>
                                        <Option value="today">{gettext('Today')}</Option>
                                        <Option value="now-24h">{gettext('24 Hours')}</Option>
                                        <Option value="now-48h">{gettext('48 Hours')}</Option>
                                    </Select>
                                </Spacer>
                            )
                        }

                        <Spacer v gap="4" noWrap alignItems="stretch">
                            {
                                itemsToDisplay.map((item) => (
                                    <div
                                        key={item._id}
                                        data-test-id="related-item"
                                        data-test-value={item.slugline ?? item.headline}
                                    >
                                        <ArticleItemConcise
                                            article={item}
                                            actionsMenu={this.getActionsForItem(item)}
                                        />
                                    </div>
                                ))
                            }
                        </Spacer>
                    </Spacer>
                )}
            />
        );
    }
}

export function getRelatedItemsWidget(): IArticleSideWidget {
    const relatedItemsWidget: IArticleSideWidget = {
        _id: RELATED_ITEMS_WIDGET_ID,
        label: getLabel(),
        order: 7,
        icon: 'related',
        component: RelatedItemsWidget,
        isAllowed: (article) => isRelatedItemsWidgetAllowed(article, getProfileSchema(article)),
    };

    return relatedItemsWidget;
}
