import * as React from 'react';
import {OrderedMap} from 'immutable';
import {getTagsListComponent} from './tag-list';
import {toClientFormat} from './adapter';
import {IArticle, ISuperdesk} from 'superdesk-api';
import {getGroups} from './groups';

import {getExistingTags} from './data-transformations';

import {getAutoTaggingData, hasConfig} from './auto-tagging';

interface IProps {
    article: IArticle;
}

export function getHeaderAutoTaggingComponent(superdesk: ISuperdesk) {
    const {gettext} = superdesk.localization;
    const TagListComponent = getTagsListComponent(superdesk);
    const groupLabels = getGroups(superdesk);

    return class HeaderAutoTagging extends React.PureComponent<IProps> {
        private semaphoreFields = superdesk.instance.config.semaphoreFields ?? {entities: {}, others: {}};

        render() {
            const existingTags = getExistingTags(this.props.article);
            const resClient = toClientFormat(existingTags);
            const data = {original: {analysis: resClient}, changes: {analysis: resClient}};

            const {entitiesGroupedAndSorted, othersGrouped} = getAutoTaggingData(data, this.semaphoreFields);

            const savedTags = data.original.analysis.keySeq().toSet();

            let allGrouped = OrderedMap<string, JSX.Element>();

            othersGrouped.forEach((tags, groupId) => {
                if (tags != null && groupId != null) {
                    allGrouped = allGrouped.set(groupId,
                        <div>
                            <div
                                className="form-label"
                                style={{display: 'block', marginBottom: '5px', marginTop: '10px' }}
                                >
                                    {gettext('Subjects')}
                            </div>
                            <TagListComponent
                                savedTags={savedTags}
                                tags={tags.toMap()}
                                readOnly={true}
                                inline={false}
                                onRemove={() => true}
                            />
                        </div>,
                    );
                }
            });

            if (entitiesGroupedAndSorted.size > 0) {
                allGrouped = allGrouped.set('entities',
                    <div>
                        {entitiesGroupedAndSorted.map((tags, key) => (
                            <div key={key}>
                                <div
                                    className="form-label"
                                    style={{display: 'block', marginBottom: '5px', marginTop: '10px' }}
                                >
                                    {groupLabels.get(key).plural}
                                </div>
                                <TagListComponent
                                    savedTags={savedTags}
                                    tags={tags.toMap()}
                                    readOnly={true}
                                    inline={true}
                                    onRemove={() => true}
                                />
                            </div>
                        )).toArray()}
                    </div>,
                );
            }

            const allGroupedAndSortedByConfig = allGrouped
                .filter((_, key) => hasConfig(key, this.semaphoreFields.others))
                .sortBy((_, key) => this.semaphoreFields.others[key].order,
                    (a, b) => a - b);

            const allGroupedAndSortedNotInConfig = allGrouped
                .filter((_, key) => !hasConfig(key, this.semaphoreFields.others));

            const allGroupedAndSorted = allGroupedAndSortedNotInConfig
                .concat(allGroupedAndSortedByConfig);

            return (
                allGroupedAndSorted.map((item) => item).toArray()
            );
        }
    };
}
