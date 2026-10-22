import React from 'react';
import {IconButton, Label, Menu} from 'superdesk-ui-framework/react';
import {IArticle, IPackageItem, IVocabularyItem} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {SuperdeskReactComponent} from 'core/SuperdeskReactComponent';
import {addInternalWebsocketEventListener} from 'core/notification/notification';
import {ListItem, ListItemColumn, ListItemRow} from 'core/components/ListItem';
import {TypeIcon} from 'apps/search/components';
import {slugline as Slugline} from 'apps/search/components/fields/slugline';
import {headline as Headline} from 'apps/search/components/fields/headline';
import {state as State} from 'apps/search/components/fields/state';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {fullPreview} from 'apps/authoring/preview/fullPreviewMultiple';

const PACKAGE_STORY_LABELS_VOCABULARY_ID = 'package-story-labels';

function getPackageStoryLabels(): Array<IVocabularyItem> {
    return sdApi.vocabularies.getAll().get(PACKAGE_STORY_LABELS_VOCABULARY_ID)?.items ?? [];
}

/**
 * The version the package points to is shown, so a published package keeps showing what was published.
 */
export function getPackageItemRequest(packageItem: IPackageItem): {path: string; urlParams?: {version: number}} {
    const {location, residRef, _current_version} = packageItem;

    if (location == null || location === 'archive' || location === 'legal_archive') {
        return {
            path: `/${location ?? 'archive'}/${residRef}`,
            urlParams: _current_version == null ? undefined : {version: _current_version},
        };
    } else if (location === 'ingest') {
        return {path: `/ingest/${residRef}`};
    } else {
        return {path: `/archived/${residRef}:${_current_version}`};
    }
}

interface IProps {
    packageItem: IPackageItem;
    readOnly: boolean;
    onRemove?(): void;
    onLabelChange?(label: IVocabularyItem['qcode'] | null): void;
    backgroundColor?: string;
}

interface IState {
    item: IArticle | null;
    error: boolean;
}

export class PackageItemCard extends SuperdeskReactComponent<IProps, IState> {
    private removeListeners: Array<() => void> = [];

    constructor(props: IProps) {
        super(props);

        this.state = {
            item: null,
            error: false,
        };

        this.fetchItem = this.fetchItem.bind(this);
    }

    fetchItem() {
        const {path, urlParams} = getPackageItemRequest(this.props.packageItem);

        this.asyncHelpers.httpRequestJsonLocal<IArticle>({method: 'GET', path, urlParams})
            .then((item) => {
                this.setState({item, error: false});
            })
            .catch(() => {
                this.setState({error: true});
            });
    }

    componentDidMount() {
        this.fetchItem();

        const refetchIfThisItem = (itemId: string) => {
            if (itemId === this.props.packageItem.residRef) {
                this.fetchItem();
            }
        };

        this.removeListeners.push(
            addInternalWebsocketEventListener('item:lock', (message) => refetchIfThisItem(message.extra.item)),
            addInternalWebsocketEventListener('item:unlock', (message) => refetchIfThisItem(message.extra.item)),
            addInternalWebsocketEventListener('item:publish', (message) => refetchIfThisItem(message.extra?.item)),
        );
    }

    componentDidUpdate(prevProps: IProps) {
        const {residRef, location, _current_version} = this.props.packageItem;

        if (
            residRef !== prevProps.packageItem.residRef
            || location !== prevProps.packageItem.location
            || _current_version !== prevProps.packageItem._current_version
        ) {
            this.fetchItem();
        }
    }

    componentWillUnmount() {
        this.removeListeners.forEach((removeListener) => removeListener());
    }

    render() {
        const {packageItem, readOnly, onRemove, onLabelChange, backgroundColor} = this.props;
        const {item, error} = this.state;

        // until the item loads, or if it can't be loaded, the copy of its metadata in the ref is shown
        const article: Partial<IArticle> = item ?? {
            _id: packageItem.residRef,
            type: packageItem.type,
            headline: packageItem.headline,
            slugline: packageItem.slugline,
        };

        const storyLabels = getPackageStoryLabels();
        const storyLabel = storyLabels.find(({qcode}) => qcode === packageItem.label);
        const isLocked = item?.lock_user != null;

        const actions: React.ComponentProps<typeof Menu>['items'] = [];

        if (item != null) {
            actions.push(
                {
                    label: gettext('Preview'),
                    onClick: () => {
                        fullPreview.previewItems([item]);
                    },
                },
                {
                    label: gettext('Open'),
                    onClick: () => {
                        openArticle(item._id, 'edit');
                    },
                },
                {
                    label: gettext('Open in new window'),
                    onClick: () => {
                        openArticle(item._id, 'edit-new-window');
                    },
                },
            );
        }

        if (!readOnly && onLabelChange != null && storyLabels.length > 0) {
            actions.push({
                label: gettext('Set label'),
                children: [
                    {
                        label: gettext('No label'),
                        onClick: () => onLabelChange(null),
                        disabled: packageItem.label == null,
                    },
                    ...storyLabels.map((label) => ({
                        label: label.name,
                        onClick: () => onLabelChange(label.qcode),
                        disabled: label.qcode === packageItem.label,
                    })),
                ],
            });
        }

        return (
            <div
                style={{backgroundColor, flexGrow: 1, minWidth: 0}}
                data-test-id="package-items"
                data-test-value={packageItem.slugline || item?.slugline || ''}
            >
                <ListItem noBackground={backgroundColor != null}>
                    <ListItemColumn>
                        <div className="list-field type-icon">
                            <TypeIcon
                                type={article.type}
                                highlight={item?.highlight}
                                contentProfileId={item?.profile}
                            />
                        </div>
                    </ListItemColumn>

                    <ListItemColumn noBorder ellipsisAndGrow>
                        {
                            article.slugline ? (
                                <ListItemRow>
                                    <ListItemColumn ellipsisAndGrow>
                                        <Slugline item={article as IArticle} />
                                    </ListItemColumn>
                                </ListItemRow>
                            ) : null
                        }
                        <ListItemRow>
                            <ListItemColumn ellipsisAndGrow>
                                {
                                    article.headline
                                        ? <Headline item={article as IArticle} />
                                        : <span>{gettext('Blank headline received')}</span>
                                }
                            </ListItemColumn>
                        </ListItemRow>
                        {
                            error && (
                                <ListItemRow>
                                    <span className="sd-text--critical" data-test-id="package-item-error">
                                        {gettext('Problems occurred while fetching data.')}
                                    </span>
                                </ListItemRow>
                            )
                        }
                    </ListItemColumn>

                    <ListItemColumn>
                        <ListItemRow justifyContent="flex-end">
                            {
                                storyLabel != null && (
                                    <span data-test-id="package-item-label" data-test-value={storyLabel.qcode}>
                                        <Label
                                            text={gettext('label: {{name}}', {name: storyLabel.name})}
                                            type="primary"
                                        />
                                    </span>
                                )
                            }
                            {
                                isLocked && (
                                    <span data-test-id="package-item-locked">
                                        <Label text={gettext('Locked')} type="alert" />
                                    </span>
                                )
                            }
                            {
                                item != null && (
                                    <span data-test-id="package-item-state" data-test-value={item.state}>
                                        <State item={item} />
                                    </span>
                                )
                            }
                        </ListItemRow>
                    </ListItemColumn>

                    {
                        actions.length > 0 && (
                            <ListItemColumn>
                                <span data-test-id="package-item-actions">
                                    <Menu items={actions}>
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
                                </span>
                            </ListItemColumn>
                        )
                    }

                    {
                        !readOnly && onRemove != null && (
                            <ListItemColumn>
                                <span data-test-id="package-item-remove">
                                    <IconButton
                                        icon="remove-sign"
                                        ariaValue={gettext('Remove')}
                                        onClick={onRemove}
                                    />
                                </span>
                            </ListItemColumn>
                        )
                    }
                </ListItem>
            </div>
        );
    }
}
