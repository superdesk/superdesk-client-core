import React, {RefObject} from 'react';
import {
    IAuthoringFieldV2,
    IAuthoringSectionTheme,
    IFieldsV2,
    IVocabularyItem,
    IAuthoringValidationErrors,
} from 'superdesk-api';
import {Map} from 'immutable';
import {IToggledFields} from '../authoring-react';
import {AuthoringSectionField} from './authoring-section-field';
import {IGetFieldContainerOptions} from './get-field-container';

export interface IPropsAuthoringSection<T> {
    fieldRefs: {[fieldId: string]: RefObject<HTMLDivElement>};
    language: string;
    fieldsData: Map<string, unknown>;
    fields: IFieldsV2;
    onChange(fieldId: string, value: unknown): void;
    reinitialize(item: T): void;
    readOnly: boolean;
    userPreferencesForFields: {[fieldId: string]: unknown};
    useHeaderLayout?: boolean;
    toggledFields: IToggledFields;
    toggleField(fieldId: string): void;
    setUserPreferencesForFields(userPreferencesForFields: {[fieldId: string]: unknown}): void;
    getVocabularyItems(vocabularyId: string): Array<IVocabularyItem>;
    validationErrors: IAuthoringValidationErrors;
    padding?: string | number;
    uiTheme?: IAuthoringSectionTheme;
    item: T;
    computeLatestEntity(options?: {preferIncomplete?: boolean}): any;
    fieldTemplate: IGetFieldContainerOptions['fieldTemplate'];
}

function groupItemsToRows<T>(items: Array<T>, getWidth: (item: T) => number) {
    const itemGroups: Array<Array<T>> = [
        [],
    ];

    let rowWidth = 0; // percent


    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        const itemWidth = getWidth(item);
        const fitOnThisRow = rowWidth + itemWidth <= 100;

        if (fitOnThisRow) {
            rowWidth = rowWidth + itemWidth;
        } else {
            itemGroups.push([]);
            if (itemWidth === 100) {
                rowWidth = 100;
            } else {
                rowWidth = 0;
            }
        }

        const lastGroup = itemGroups[itemGroups.length - 1];

        lastGroup.push(item);

        const isLastItem = i === items.length - 1;

        // if row is full after pushing - add a new one
        if (rowWidth === 100 && !isLastItem) {
            itemGroups.push([]);
            rowWidth = 0;
        }
    }

    return itemGroups;
}

/**
 * Percentage of the row the field asks for. A field with no configured width takes the whole row:
 * `getContentProfile` defaults it that way too, but profiles built in code (packages, the
 * description field on media items) leave it unset.
 */
function getFieldWidth(field: IAuthoringFieldV2): number {
    return field.fieldConfig.width ?? 100;
}

/**
 * A variable is needed in order to use the same object reference
 * and allow PureComponent to skip re-renders.
 */
const defaultUserPreferences = {};

export class AuthoringSection<T> extends React.PureComponent<IPropsAuthoringSection<T>> {
    constructor(props: IPropsAuthoringSection<T>) {
        super(props);

        this.onEditorPreferencesChange = this.onEditorPreferencesChange.bind(this);
    }

    onEditorPreferencesChange(fieldId: string, preferences: unknown) {
        this.props.setUserPreferencesForFields({
            ...(this.props.userPreferencesForFields ?? {}),
            [fieldId]: preferences,
        });
    }

    render() {
        const {toggledFields} = this.props;
        const themeApplies: boolean
            = this.props.fields.find((field) => this.props.uiTheme?.fieldTheme[field.id] != null) != null;
        const grouped = groupItemsToRows(this.props.fields.toArray(), getFieldWidth);

        return (
            <div
                className="authoring-section"
                style={{
                    backgroundColor: themeApplies ? this.props.uiTheme.backgroundColor : undefined,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: this.props.useHeaderLayout === true ? 'var(--gap-1-5)' : 'var(--gap-4)',
                    padding: this.props.padding,
                }}
            >
                {
                    grouped.map((group, index) => (
                        <div key={index} style={{display: 'flex', gap: 'var(--gap-1-5)'}}>
                            {
                                group.map((field) => {
                                    const canBeToggled = toggledFields[field.id] != null;
                                    const toggledOn = toggledFields[field.id];

                                    // the configured width is a basis rather than a fixed width, so
                                    // fields fill a row the widths leave short, as
                                    // authoring-angular's `sd-width` does
                                    return (
                                        <div
                                            key={field.id}
                                            style={{flex: `1 1 ${getFieldWidth(field)}%`}}
                                        >
                                            <AuthoringSectionField
                                                fieldRef={this.props.fieldRefs[field.id]}
                                                uiTheme={themeApplies ? this.props.uiTheme : undefined}
                                                field={field}
                                                fieldsData={this.props.fieldsData}
                                                onChange={this.props.onChange}
                                                reinitialize={this.props.reinitialize}
                                                readOnly={this.props.readOnly}
                                                language={this.props.language}
                                                canBeToggled={canBeToggled}
                                                toggledOn={toggledOn}
                                                toggleField={this.props.toggleField}
                                                editorPreferences={
                                                    this.props.userPreferencesForFields[field.id]
                                                        ?? defaultUserPreferences
                                                }
                                                onEditorPreferencesChange={this.onEditorPreferencesChange}
                                                useHeaderLayout={this.props.useHeaderLayout}
                                                getVocabularyItems={this.props.getVocabularyItems}
                                                validationError={this.props.validationErrors[field.id]}
                                                item={this.props.item}
                                                computeLatestEntity={this.props.computeLatestEntity}
                                                fieldTemplate={this.props.fieldTemplate}
                                            />
                                        </div>
                                    );
                                })
                            }
                        </div>
                    ))
                }
            </div>
        );
    }
}
