import React from 'react';
import {RelativeDate} from 'core/datetime/relativeDate';
import {state as State} from 'apps/search/components/fields/state';
import {IArticle} from 'superdesk-api';
import {gettext} from 'core/utils';
import {TranslationsBody} from 'apps/authoring-react/article-widgets/translations/TranslationsBody';
import {AuthoringWorkspaceService} from '../authoring/services/AuthoringWorkspaceService';

interface IProps {
    item: IArticle;
    authoringWorkspace: AuthoringWorkspaceService;
}

export class TranslationsWidget extends React.Component<IProps> {
    render() {
        const {authoringWorkspace} = this.props;
        const listClassNames = 'sd-list-item__column sd-list-item__column--grow sd-list-item__column--no-border';

        return (
            <TranslationsBody
                item={this.props.item}
                wrapperTemplate={({children}) => (
                    <div className="widget sd-list-item-group sd-list-item-group--space-between-items sd-padding--1">
                        {children}
                    </div>
                )}
                translationTemplate={({translation, getTranslatedFromLanguage}) => (
                    <div
                        onClick={() => authoringWorkspace.popup(translation, 'edit')}
                        className="sd-list-item sd-shadow--z1"
                    >
                        <div className={listClassNames}>
                            <div className="sd-list-item__row">
                                <span className="label">{translation.language}</span>
                                <span className="sd-overflow-ellipsis sd-list-item--element-grow">
                                    {translation.headline}
                                </span>
                                <span style={{whiteSpace: 'nowrap'}}>
                                    <RelativeDate datetime={translation.versioncreated} />
                                </span>
                            </div>
                            <div className="sd-list-item__row">
                                <div className="sd-list-item--element-grow">
                                    {
                                        translation.translated_from == null
                                            ? (
                                                <span className="label label--primary label--hollow">
                                                    {gettext('Original')}
                                                </span>
                                            )
                                            : (
                                                <div className="flex-row sibling-spacer-4">
                                                    <span>{gettext('Translated from')}</span>
                                                    <span className="label label--hollow">
                                                        {getTranslatedFromLanguage()}
                                                    </span>
                                                </div>
                                            )
                                    }
                                </div>
                                <div>
                                    <State
                                        item={translation}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            />
        );
    }
}
