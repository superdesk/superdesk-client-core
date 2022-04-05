import * as React from 'react';
import {IConfigComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownConfigVocabulary} from '..';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {authoringStorage} from 'apps/authoring-react/data-layer';
import {sdApi} from 'api';

type IDropdownConfig = IDropdownConfigVocabulary;

export class ConfigFromVocabulary extends React.PureComponent<IConfigComponentProps<IDropdownConfig>> {
    constructor(props) {
        super(props);

        this.state = {
            previewValue: null,
        };
    }

    render() {
        const config: IDropdownConfig = this.props.config ?? {
            source: 'vocabulary',
            vocabularyId: null,
            multiple: false,
        };

        return (
            <div>
                <label className="form-label">{gettext('Select a vocabulary')}</label>

                <SelectFilterable
                    items={
                        authoringStorage.getVocabularies().toArray()
                            .filter(
                                (vocabulary) => !sdApi.vocabularies.isCustomFieldVocabulary(vocabulary),
                            )
                    }
                    value={authoringStorage.getVocabularies().get(this.props.config.vocabularyId)}
                    onChange={(vocabulary) => {
                        this.props.onChange({
                            ...config,
                            vocabularyId: vocabulary._id,
                        });
                    }}
                    getLabel={(item) => item?.display_name}
                    zIndex={1050}
                />
            </div>
        );
    }
}
