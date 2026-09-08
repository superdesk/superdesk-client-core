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
     * Rejecting is supported: the field degrades so the stored value stays readable and saveable.
     * Not called for a preview, which shows the stored ids, so a listing that costs a request is
     * only paid for by a form that can act on it.
     */
    getOptions: (formValues: {readonly [key: string]: any}) => Promise<Array<ISelectAsyncOption>>;

    /** Fields whose change re-runs `getOptions`. */
    dependentFields?: Array<string>;

    /** Hint shown below the field while it has no error. */
    info?: string;
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
         * Bumped per fetch and on unmount. Fetches for successive values of a dependent field can
         * resolve out of order, so one that is no longer the latest discards its result.
         */
        private latestFetchSequence: number;

        /** The values the field mounted with, which are the ones the item holds. */
        private storedIds: Array<string>;

        constructor(props: IProps) {
            super(props);

            this.state = {
                options: null,
                loading: props.previewOutput !== true,
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
         * A stored value the options no longer offer is kept, since dropping it would write an
         * empty field back on the next save. Only values picked since mounting are dropped.
         */
        fetchOptions(dropValuesMissingFromOptions: boolean) {
            if (this.props.previewOutput) {
                return;
            }

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
         * Replaces the picker while `getOptions` is in flight. It carries no control, so nothing
         * can be changed before the options that define it are known.
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

            if (this.props.previewOutput) {
                return (
                    <div data-test-id={`gform-output--${field}`}>
                        {this.getSelectedIds().map((id) => this.toOption(id).label).join(', ')}
                    </div>
                );
            }

            if (this.state.loading) {
                return this.renderLoading();
            }

            const selectedOptions = this.getSelectedIds().map((id) => this.toOption(id));

            const extraIssueElements = (this.props.issues ?? []).slice(1).map((issue, i) => (
                <div key={i} className="sd-input__message">{issue}</div>
            ));

            if (this.state.options == null) {
                return (
                    <div className={classNames('d-flex', 'flex-col')}>
                        {
                            /*
                                A single id can be typed from memory, so it stays editable.
                                A list of them is not worth hand-editing, so it is read only.
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
                                    disabled={this.props.disabled}
                                    error={this.props.issues[0]}
                                    info={getParameters(this.props).info}
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
                                    info={getParameters(this.props).info}
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
                        info={getParameters(this.props).info}
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
