import * as React from 'react';
import {IConfigComponentProps} from 'superdesk-api';
import {gettext} from 'core/utils';
import {IDropdownValue, IDropdownDataVocabulary} from '.';
import {Spacer} from 'core/ui/components/Spacer';
import {Dropdown} from './dropdown';
import {SelectFilterable} from 'core/ui/components/select-filterable';
import {authoringStorage} from 'apps/authoring-react/data-layer';

interface IState {
    previewValue: IDropdownValue | null;
}

type IDropdownConfig = IDropdownDataVocabulary;

export class ConfigFromVocabulary extends React.PureComponent<IConfigComponentProps<IDropdownConfig>, IState> {
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
        };

        return (
            <Spacer v gap="16" noWrap>
                <div>
                    <label className="form-label">{gettext('Select a vocabulary')}</label>

                    <SelectFilterable
                        items={
                            authoringStorage.getVocabularies().toArray()
                                .filter(({field_type}) => field_type == null)
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

                {
                    config.vocabularyId != null && (
                        <div>
                            <label className="form-label">{gettext('Configuration preview')}</label>

                            <Dropdown
                                config={config}
                                value={this.state.previewValue}
                                onChange={(val) => {
                                    this.setState({previewValue: val});
                                }}
                            />
                        </div>
                    )
                }
            </Spacer>
        );
    }
}
