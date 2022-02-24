import React from 'react';
import {Map} from 'immutable';
import {IContentProfileV2, IArticle} from 'superdesk-api';
import {Spacer, SpacerInline} from 'core/ui/components/Spacer';
import {getField} from 'apps/fields';
import {Alert} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps {
    article1: IArticle;
    article2: IArticle;
    profile1: IContentProfileV2;
    profile2: IContentProfileV2;
    fieldsData1: Map<string, any>;
    fieldsData2: Map<string, any>;
    fieldPadding: number;
}

export class ViewDifference extends React.PureComponent<IProps> {
    render() {
        const {
            article1,
            article2,
            profile1,
            profile2,
            fieldsData1,
            fieldsData2,
            fieldPadding,
        } = this.props;

        const allFields1 = profile1.header.merge(profile1.content);
        const allFields2 = profile2.header.merge(profile2.content);

        return (
            <Spacer v gap="8">
                {
                    allFields2.map((field) => {
                        const FieldEditorConfig = getField(field.fieldType);

                        // field is present in previous version, show diff
                        if (allFields1.has(field.id)) {
                            if (FieldEditorConfig.differenceComponent != null) {
                                return (
                                    <div key={field.id} style={{padding: fieldPadding}}>
                                        <span
                                            className="field-label--base"
                                            style={{marginBottom: 20}}
                                        >
                                            {field.name}
                                        </span>

                                        <FieldEditorConfig.differenceComponent
                                            value1={fieldsData1.get(field.id)}
                                            value2={fieldsData2.get(field.id)}
                                            config={field.fieldConfig}
                                        />
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={field.id} style={{padding: fieldPadding}}>
                                        <div>
                                            <span
                                                className="field-label--base"
                                                style={{marginBottom: 20}}
                                            >
                                                {field.name}
                                            </span>
                                        </div>

                                        <Alert type="warning" style="hollow" size="small" margin="none">
                                            {
                                                gettext(
                                                    'Difference view for "{{type}}" fields'
                                                    + ' is not implemented.'
                                                    + ' Latter version is being displayed.',
                                                    {type: field.fieldType},
                                                )
                                            }
                                        </Alert>

                                        <SpacerInline v gap="16" />

                                        <FieldEditorConfig.previewComponent
                                            item={article2}
                                            value={fieldsData2.get(field.id)}
                                            config={field.fieldConfig}
                                        />
                                    </div>
                                );
                            }
                        } else { // field is not present in previous version - show as added
                            return (
                                <div
                                    key={field.id}
                                    style={{padding: fieldPadding, backgroundColor: '#e6ffe6'}}
                                >
                                    <span
                                        className="field-label--base"
                                        style={{marginBottom: 20}}
                                    >
                                        {field.name}
                                    </span>

                                    <FieldEditorConfig.previewComponent
                                        item={article2}
                                        value={fieldsData2.get(field.id)}
                                        config={field.fieldConfig}
                                    />
                                </div>
                            );
                        }
                    }).toArray()
                }

                { // show removed fields
                    allFields1.filter((field) => allFields2.has(field.id) !== true).map((field) => {
                        const FieldEditorConfig = getField(field.fieldType);

                        return (
                            <div
                                key={field.id}
                                style={{padding: fieldPadding, backgroundColor: '#ffe6e6'}}
                            >
                                <span
                                    className="field-label--base"
                                    style={{marginBottom: 20}}
                                >
                                    {field.name}
                                </span>

                                <FieldEditorConfig.previewComponent
                                    item={article1}
                                    value={fieldsData1.get(field.id)}
                                    config={field.fieldConfig}
                                />
                            </div>
                        );
                    }).toArray()
                }
            </Spacer>
        );
    }
}
