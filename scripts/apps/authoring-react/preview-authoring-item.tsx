import React from 'react';
import {Map} from 'immutable';
import {IContentProfileV2} from 'superdesk-api';
import {Spacer} from 'core/ui/components/Spacer';
import {getField} from 'apps/fields';

interface IProps {
    item: any;
    profile: IContentProfileV2;
    fieldsData: Map<string, any>;
    fieldPadding?: number;
}

export class PreviewAuthoringItem extends React.PureComponent<IProps> {
    render() {
        const {profile, fieldsData, fieldPadding} = this.props;
        const allFields = profile.header.merge(profile.content);

        return (
            <Spacer v gap="16" noWrap>
                {
                    allFields.map((field) => {
                        const FieldEditorConfig = getField(field.fieldType);

                        return (
                            <div key={field.id} style={{width: '100%', padding: fieldPadding ?? 0}}>
                                <span
                                    className="field-label--base"
                                    style={{marginBottom: 20}}
                                >
                                    {field.name}
                                </span>

                                <div>
                                    <FieldEditorConfig.previewComponent
                                        item={this.props.item}
                                        value={fieldsData.get(field.id)}
                                        config={field.fieldConfig}
                                    />
                                </div>
                            </div>
                        );
                    }).toArray()
                }
            </Spacer>
        );
    }
}
