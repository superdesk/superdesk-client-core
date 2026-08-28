import React from 'react';
import classNames from 'classnames';
import {noop} from 'lodash';
import {Input} from 'superdesk-ui-framework';
import {Loader, TreeSelect} from 'superdesk-ui-framework/react';
import {InputWrapper} from 'superdesk-ui-framework/react/components/Form';
import {gettext} from 'core/utils';
import {IInputType} from '../interfaces/input-types';

export interface ISelectAsyncOption {
    id: string;
    label: string;
}

/**
 * `component_parameters` of a `GenericFormFieldType.selectAsync`
 * or `GenericFormFieldType.selectMultipleAsync` field.
 */
export interface ISelectAsyncParameters {
    /**
     * Called with the values of the form being edited. Rejecting is a supported outcome: the field
     * then degrades so the stored value stays readable and saveable while the options are out of
     * reach.
     */
    getOptions: (formValues: {readonly [key: string]: any}) => Promise<Array<ISelectAsyncOption>>;

    /**
     * Fields whose change re-runs `getOptions`. Values picked since the field mounted are dropped
     * when the refreshed options no longer offer them; the values the field mounted with are kept.
     */
    dependentFields?: Array<string>;
}

type IProps = IInputType<any>;

interface IState {
    options: Array<ISelectAsyncOption> | null;
    loading: boolean;
}

function getParameters(props: IProps): ISelectAsyncParameters {
    return props.formField.component_parameters as ISelectAsyncParameters;
}

function getOptionsUnavailableMessage(): string {
    return gettext('The list of options could not be loaded');
}

function getOptionsLoadingMessage(): string {
    return gettext('Loading options...');
}

function getSelectAsync(allowMultiple: boolean) {
    return class SelectAsync extends React.Component<IProps, IState> {
        /**
         * Bumped for every fetch and once more on unmount. A fetch captures it and gives up when it
         * is no longer the latest: `getOptions` calls started for successive values of a dependent
         * field can resolve out of order, and the slower earlier one would otherwise leave the field
         * offering the options of the value that is no longer selected.
         */
        private latestFetchSequence: number;

        /**
         * The values the field mounted with, which are the ones the item holds.
         */
        private storedIds: Array<string>;

        constructor(props: IProps) {
            super(props);

            this.state = {
                options: null,
                loading: true,
            };

            this.latestFetchSequence = 0;
            this.fetchOptions = this.fetchOptions.bind(this);
            this.storedIds = this.getSelectedIds();
        }

        componentDidMount() {
            this.fetchOptions(false);
        }

        componentWillUnmount() {
            this.latestFetchSequence++;
        }

        componentDidUpdate(prevProps: IProps) {
            const dependentFields = getParameters(this.props).dependentFields ?? [];

            if (dependentFields.some((field) => prevProps.formValues[field] !== this.props.formValues[field])) {
                this.fetchOptions(true);
            }
        }

        /**
         * A value the options do not offer is kept whenever it is one of the values the field
         * mounted with, on the initial fetch and after a dependent field changed alike: it is what
         * the item holds, and dropping it writes an empty field back to the server the next time
         * the form is saved. Only a value picked since the field mounted is dropped, because it
         * was picked from the options of the previous state of the dependent field.
         */
        fetchOptions(dropValuesMissingFromOptions: boolean) {
            const sequence = ++this.latestFetchSequence;

            this.setState({loading: true});

            getParameters(this.props).getOptions(this.props.formValues)
                .catch(() => null)
                .then((options: Array<ISelectAsyncOption> | null) => {
                    if (sequence !== this.latestFetchSequence) {
                        return;
                    }

                    this.setState({options, loading: false});

                    if (dropValuesMissingFromOptions && options != null) {
                        const selectedIds = this.getSelectedIds();
                        const keptIds = selectedIds.filter(
                            (id) => this.storedIds.includes(id) || options.some((option) => option.id === id),
                        );

                        if (keptIds.length !== selectedIds.length) {
                            this.emitChange(keptIds);
                        }
                    }
                });
        }

        getSelectedIds(): Array<string> {
            const {value} = this.props;

            if (allowMultiple) {
                return Array.isArray(value) ? value : [];
            }

            return typeof value === 'string' && value.length > 0 ? [value] : [];
        }

        emitChange(ids: Array<string>) {
            this.props.onChange(allowMultiple ? ids : (ids[0] ?? ''));
        }

        toOption(id: string): ISelectAsyncOption {
            return (this.state.options ?? []).find((option) => option.id === id) ?? {id, label: id};
        }

        /**
         * Stands in for the picker while `getOptions` is in flight, on the first fetch and on
         * every refetch. It carries no control at all, so there is nothing to click, nothing to
         * type into and no value that can be changed before the options that define it are known.
         */
        renderLoading(): JSX.Element {
            const {field, label, required} = this.props.formField;

            return (
                <div className={classNames('d-flex', 'flex-col')}>
                    <InputWrapper
                        label={label}
                        labelHidden={!label}
                        required={required}
                        disabled
                        fullWidth
                        invalid={this.props.issues[0] != null}
                        error={this.props.issues[0]}
                        info={getParameters(this.props).info}
                    >
                        <Loader overlay={false} />
                    </InputWrapper>
                    <div
                        className="sd-input__message"
                        data-test-id={`gform-loading--${field}`}
                    >
                        {getOptionsLoadingMessage()}
                    </div>
                </div>
            );
        }

        render() {
            const {field, label, required} = this.props.formField;

            if (this.state.loading) {
                /*
                    A preview shows values, never controls. Rendering nothing until the options
                    arrive keeps it from flashing the raw ids before they resolve to labels.
                */
                return this.props.previewOutput ? null : this.renderLoading();
            }

            const selectedOptions = this.getSelectedIds().map((id) => this.toOption(id));

            if (this.props.previewOutput) {
                return (
                    <div data-test-id={`gform-output--${field}`}>
                        {selectedOptions.map(({label: optionLabel}) => optionLabel).join(', ')}
                    </div>
                );
            }

            const extraIssueElements = (this.props.issues ?? []).slice(1).map((issue, i) => (
                <div key={i} className="sd-input__message">{issue}</div>
            ));

            if (this.state.options == null) {
                return (
                    <div className={classNames('d-flex', 'flex-col')}>
                        {
                            /*
                                A single value is a free-form identifier that can be typed from
                                memory, so it stays editable. A list of them is not worth
                                hand-editing, so it is only displayed and saved back untouched.
                            */
                            allowMultiple ? (
                                <TreeSelect
                                    kind="synchronous"
                                    readOnly
                                    allowMultiple
                                    fullWidth
                                    label={label}
                                    labelHidden={!label}
                                    required={required}
                                    error={this.props.issues[0]}
                                    getId={(option: ISelectAsyncOption) => option.id}
                                    getLabel={(option: ISelectAsyncOption) => option.label}
                                    getOptions={() => []}
                                    value={selectedOptions}
                                    onChange={noop}
                                    data-test-id={`gform-input--${field}`}
                                />
                            ) : (
                                <Input
                                    type="text"
                                    value={this.props.value ?? ''}
                                    onChange={(nextValue) => this.props.onChange(nextValue)}
                                    label={label}
                                    labelHidden={!label}
                                    required={required}
                                    disabled={this.props.disabled}
                                    error={this.props.issues[0]}
                                    data-test-id={`gform-input--${field}`}
                                />
                            )
                        }
                        <div
                            className="sd-input__message"
                            data-test-id={`gform-message--${field}`}
                        >
                            {getOptionsUnavailableMessage()}
                        </div>
                        {extraIssueElements}
                    </div>
                );
            }

            const options = this.state.options;

            return (
                <div className={classNames('d-flex', 'flex-col')}>
                    <TreeSelect
                        // the options are read once, when the tree select is constructed
                        key={options.map(({id}) => id).join(',')}
                        kind="synchronous"
                        allowMultiple={allowMultiple}
                        fullWidth
                        searchPlaceholder={gettext('Search')}
                        label={label}
                        labelHidden={!label}
                        required={required}
                        disabled={this.props.disabled}
                        error={this.props.issues[0]}
                        getId={(option: ISelectAsyncOption) => option.id}
                        getLabel={(option: ISelectAsyncOption) => option.label}
                        getOptions={() => options.map((option) => ({value: option}))}
                        value={selectedOptions}
                        onChange={(nextOptions: Array<ISelectAsyncOption>) => {
                            this.emitChange(nextOptions.map(({id}) => id));
                        }}
                        data-test-id={`gform-input--${field}`}
                    />
                    {extraIssueElements}
                </div>
            );
        }
    };
}

export const SelectAsync = getSelectAsync(false);

export const SelectMultipleAsync = getSelectAsync(true);
