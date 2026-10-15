import React from 'react';
import classNames from 'classnames';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {sdApi} from 'api';
import {TypeIcon} from 'apps/search/components';
import {TimeElem} from 'apps/search/components/TimeElem';
import {getStateLabel} from 'apps/search/components/fields/state';

interface IProps {
    item: IArticle;

    // the article being edited: ringed rather than filled in, so it does not read as a selection
    current?: boolean;

    // rendered on the slugline row, before the slugline
    badge?: React.ReactNode;

    // rendered at the top right of the card
    actions?: React.ReactNode;

    onClick(): void;
}

/**
 * Mirrors the card authoring-angular renders in the same panel; the `boxed-list` classes carry
 * the layout.
 */
export class RelatedItem extends React.PureComponent<IProps> {
    render(): JSX.Element {
        const {item, badge, actions, onClick} = this.props;
        const deskName = item.task?.desk == null ? null : sdApi.desks.getDeskById(item.task.desk)?.name;
        const stageName = item.task?.stage == null ? null : sdApi.desks.getStageById(item.task.stage)?.name;
        const genres = (item.genre ?? []).map((genre) => genre.name).join(', ');

        return (
            <li
                className={classNames(
                    'boxed-list__item',
                    'boxed-list__item--clickable',
                    'boxed-list__item--comfortable',
                    {'boxed-list__item--selected': this.props.current === true},
                )}
                data-test-id="related-item"
                data-test-value={item.slugline ?? item.headline}
            >
                <div className="boxed-list__item-media" onClick={onClick}>
                    <TypeIcon
                        type={item.type}
                        highlight={item.highlight}
                        contentProfileId={item.profile}
                    />
                </div>

                <div
                    className="boxed-list__item-content"
                    data-test-id="related-item-content"
                    role="button"
                    tabIndex={0}
                    onClick={onClick}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            // space would scroll the panel
                            event.preventDefault();

                            onClick();
                        }
                    }}
                >
                    <div className="boxed-list__item-content-row boxed-list__item-content-row--fixed">
                        {badge}

                        <span
                            className="sd-text__slugline sd-overflow-ellipsis"
                            title={item.slugline}
                            data-test-id="field--slugline"
                        >
                            {item.slugline}
                        </span>

                        <span className="sd-text__date-time sd-text__date-time--small ml-auto">
                            <TimeElem date={item.versioncreated} />
                        </span>
                    </div>

                    <div className="boxed-list__item-content-row">
                        <span>{item.headline || item.type}</span>
                    </div>

                    {
                        item.anpa_take_key == null ? null : (
                            <div className="boxed-list__item-content-row">
                                <span>{item.anpa_take_key}</span>
                            </div>
                        )
                    }

                    <div className="boxed-list__item-content-row">
                        <span className={`state-label state-${item.state}`}>{getStateLabel(item)}</span>

                        {
                            item.flags?.marked_for_legal === true && (
                                <span className="state-label legal">{gettext('Legal')}</span>
                            )
                        }

                        {
                            item.flags?.marked_for_sms === true && (
                                <span className="state-label sms">{gettext('Sms')}</span>
                            )
                        }

                        {
                            item.rewritten_by != null && (
                                <span className="state-label updated">{gettext('Updated')}</span>
                            )
                        }
                    </div>

                    {
                        deskName == null && stageName == null ? null : (
                            <div className="boxed-list__item-content-row">
                                {
                                    deskName == null ? null : (
                                        <span data-test-id="related-item-desk">
                                            <span className="sd-text__italic">{gettext('desk:')} </span>
                                            {deskName}
                                        </span>
                                    )
                                }

                                {
                                    stageName == null ? null : (
                                        <span className="ml-auto" data-test-id="related-item-stage">
                                            <span className="sd-text__italic">{gettext('stage:')} </span>
                                            {stageName}
                                        </span>
                                    )
                                }
                            </div>
                        )
                    }

                    {
                        genres.length < 1 ? null : (
                            <div className="boxed-list__item-content-row">
                                <span>
                                    <span className="sd-text__italic">{gettext('genre:')} </span>
                                    {genres}
                                </span>
                            </div>
                        )
                    }
                </div>

                {
                    actions == null ? null : (
                        <div className="boxed-list__static-actions">
                            {actions}
                        </div>
                    )
                }
            </li>
        );
    }
}
