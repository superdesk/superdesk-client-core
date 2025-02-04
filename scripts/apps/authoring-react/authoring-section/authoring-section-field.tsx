import React, {RefObject} from 'react';
import {IAuthoringFieldV2, IAuthoringSectionTheme, IFieldsData} from 'superdesk-api';
import {getField} from 'apps/fields';
import {getFieldContainer, IGetFieldContainerOptions} from './get-field-container';
import {IPropsAuthoringSection} from './authoring-section';
import memoizeOne from 'memoize-one';
import {shallowEqualObjects} from 'shallow-equal';

interface IProps<T> {
    field: IAuthoringFieldV2;
    fieldsData: IFieldsData;
    onChange: IPropsAuthoringSection<T>['onChange'];
    reinitialize(item: T): void;
    readOnly: boolean;
    language: string;
    canBeToggled: boolean;
    toggledOn: boolean;
    toggleField: IPropsAuthoringSection<T>['toggleField'];
    editorPreferences: unknown;
    onEditorPreferencesChange: (fieldId: string, preferences: unknown) => void;
    useHeaderLayout: IPropsAuthoringSection<T>['useHeaderLayout'];
    getVocabularyItems: IPropsAuthoringSection<T>['getVocabularyItems'];
    validationError?: string;
    uiTheme?: IAuthoringSectionTheme;
    fieldRef: RefObject<HTMLDivElement>;
    item: T;
    computeLatestEntity(options?: {preferIncomplete?: boolean}): any;
    fieldTemplate: IGetFieldContainerOptions['fieldTemplate'];
}

export class AuthoringSectionField<T> extends React.PureComponent<IProps<T>> {
    private getFieldContainer: typeof getFieldContainer;

    constructor(props: IProps<T>) {
        super(props);

        this.getFieldContainer = memoizeOne(getFieldContainer, ([a], [b]) => shallowEqualObjects(a, b));
    }

    render() {
        const {field, fieldsData, canBeToggled, toggledOn} = this.props;
        const FieldEditorConfig = getField(field.fieldType);

        const Container = this.getFieldContainer({
            useHeaderLayout: this.props.useHeaderLayout,
            canBeToggled: canBeToggled,
            field: field,
            toggledOn: toggledOn,
            toggleField: this.props.toggleField,
            validationError: this.props.validationError,
            fieldTemplate: this.props.fieldTemplate,
        });

        return (
            <div ref={this.props.fieldRef} data-test-id="authoring-field" data-test-value={field.id}>
                {canBeToggled && toggledOn === false ? (
                    <Container key={field.id} />
                ) : (
                    <FieldEditorConfig.editorComponent
                        uiTheme={this.props.uiTheme == null ? undefined : {
                            backgroundColor: this.props.uiTheme.backgroundColor,
                            backgroundColorSecondary: this.props.uiTheme.backgroundColorSecondary,
                            textColor: this.props.uiTheme.textColor,
                            fontSize: this.props.uiTheme.fieldTheme[field.id]?.fontSize,
                            fontFamily: this.props.uiTheme.fontFamily,
                        }}
                        key={field.id}
                        editorId={field.id}
                        container={Container}
                        language={this.props.language}
                        value={fieldsData.get(field.id)}
                        fieldsData={fieldsData}
                        onChange={(val) => {
                            this.props.onChange(field.id, val);
                        }}
                        reinitialize={this.props.reinitialize}
                        readOnly={this.props.readOnly}
                        config={field.fieldConfig}
                        fieldId={field.id}
                        editorPreferences={this.props.editorPreferences}
                        onEditorPreferencesChange={(fieldPreferences) => {
                            this.props.onEditorPreferencesChange(field.id, fieldPreferences);
                        }}
                        getVocabularyItems={this.props.getVocabularyItems}
                        item={this.props.item}
                        computeLatestEntity={this.props.computeLatestEntity}
                    />
                )}
            </div>
        );
    }
}
