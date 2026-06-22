import React from 'react';
import {Map} from 'immutable';
import {IContentProfileV2, IPropsSpacer} from 'superdesk-api';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';
import {getField} from 'apps/fields';
import {Alert} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {ErrorBoundary} from 'core/helpers/ErrorBoundary';

interface IProps {
    profile1: IContentProfileV2;
    profile2: IContentProfileV2;
    fieldsData1: Map<string, any>;
    fieldsData2: Map<string, any>;
    item1: any;
    item2: any;
    fieldPadding: number;
    gapBetweenFields?: IPropsSpacer['gap'];
}

function FieldLabel({name}: {name: string}) {
    return (
        <span className="field-label--base" style={{marginBottom: 20}}>
            {name}
        </span>
    );
}

export function ViewDifference(props: IProps) {
    // The diff is directional: walk the "to" version's fields and mark them against "from".
    const {
        profile1: fromProfile,
        profile2: toProfile,
        fieldsData1: fromFieldsData,
        fieldsData2: toFieldsData,
        item1: fromItem,
        item2: toItem,
        fieldPadding,
        gapBetweenFields,
    } = props;

    const fromFields = fromProfile.header.merge(fromProfile.content);
    const toFields = toProfile.header.merge(toProfile.content);

    // ErrorBoundary latches its error state and never resets on its own. Switching the compared
    // versions re-renders in place without remounting, so a field that threw for one version would
    // stay blank after switching. Keying the boundaries on the compared versions forces a remount
    // (and a fresh render attempt) whenever the selection changes.
    const versionKey = `${fromItem?._current_version}-${toItem?._current_version}`;

    return (
        <Spacer v gap={gapBetweenFields} noWrap>
            {
                toFields.map((field) => {
                    const fieldRenderer = getField(field.fieldType);

                    // field existed in the "from" version, show its difference
                    if (fromFields.has(field.id)) {
                        if (fieldRenderer.differenceComponent != null) {
                            return (
                                <div
                                    key={field.id}
                                    data-test-id="compare-field"
                                    data-test-value={field.id}
                                    style={{padding: fieldPadding}}
                                >
                                    <FieldLabel name={field.name} />

                                    <div>
                                        <ErrorBoundary key={versionKey}>
                                            <fieldRenderer.differenceComponent
                                                value1={fromFieldsData.get(field.id)}
                                                value2={toFieldsData.get(field.id)}
                                                config={field.fieldConfig}
                                            />
                                        </ErrorBoundary>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div
                                    key={field.id}
                                    data-test-id="compare-field"
                                    data-test-value={field.id}
                                    style={{padding: fieldPadding}}
                                >
                                    <div>
                                        <FieldLabel name={field.name} />
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

                                    <SpacerBlock v gap="16" />

                                    <div>
                                        <ErrorBoundary key={versionKey}>
                                            <fieldRenderer.previewComponent
                                                item={toItem}
                                                value={toFieldsData.get(field.id)}
                                                config={field.fieldConfig}
                                            />
                                        </ErrorBoundary>
                                    </div>
                                </div>
                            );
                        }
                    } else { // field did not exist in the "from" version - show as added
                        return (
                            <div
                                key={field.id}
                                data-test-id="compare-field"
                                data-test-value={field.id}
                                style={{padding: fieldPadding, backgroundColor: '#e6ffe6'}}
                            >
                                <FieldLabel name={field.name} />

                                <div>
                                    <ErrorBoundary key={versionKey}>
                                        <fieldRenderer.previewComponent
                                            item={toItem}
                                            value={toFieldsData.get(field.id)}
                                            config={field.fieldConfig}
                                        />
                                    </ErrorBoundary>
                                </div>
                            </div>
                        );
                    }
                }).toArray()
            }
            { // fields removed in the "to" version
                fromFields.filter((field) => toFields.has(field.id) !== true).map((field) => {
                    const fieldRenderer = getField(field.fieldType);

                    return (
                        <div
                            key={field.id}
                            data-test-id="compare-field"
                            data-test-value={field.id}
                            style={{padding: fieldPadding, backgroundColor: '#ffe6e6'}}
                        >
                            <FieldLabel name={field.name} />

                            <div>
                                <ErrorBoundary key={versionKey}>
                                    <fieldRenderer.previewComponent
                                        item={fromItem}
                                        value={fromFieldsData.get(field.id)}
                                        config={field.fieldConfig}
                                    />
                                </ErrorBoundary>
                            </div>
                        </div>
                    );
                }).toArray()
            }
        </Spacer>
    );
}
