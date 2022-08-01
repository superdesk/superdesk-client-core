import * as React from 'react';
import {mapObject} from '../utils';

// null means validation was successful and no errors were found
export type IValidationResult = string | null;

export type CreateValidators<T> = {
    [Property in keyof T]: (value: T[Property]) => IValidationResult;
};

export type IValidatorsForType<T> = {
    [Property in keyof T]: (value: T[Property]) => IValidationResult;
};

export type IValidationResults<T> = {
    [Property in keyof T]: IValidationResult;
};

export type IRefsForInputs<T> = {
    [Property in keyof T]: React.RefObject<any>;
};

export interface IPropsValidationHoc<T> {
    validators: IValidatorsForType<T>;
    children(
        validate: (item: T) => boolean,
        result: IValidationResults<T>,

        /**
         * Only applicable when `dynamic` is set to true.
         *
         * Provided refs have to be set on each input element
         * and are used to prevent validating data that hasn't been entered yet.
         * (so there are no error messages shown when inputs are rendered for the first time)
         */
        refsForInputs: IRefsForInputs<T>,
    ): JSX.Element;

    /**
     * Must be set as true if not all field inputs are visible at once.
     * i.e. some inputs may be shown/hidden depending on values of other inputs.
     */
    dynamic?: boolean;
}

interface IState<T> {
    validationResult: IValidationResults<T>;
}

export class WithValidation<T> extends React.PureComponent<IPropsValidationHoc<T>, IState<T>> {
    private trackVisibility: {[Property in keyof IValidatorsForType<T>]: React.RefObject<any>};

    constructor(props: IPropsValidationHoc<T>) {
        super(props);

        this.validate = this.validate.bind(this);

        this.state = {
            validationResult: mapObject(props.validators, () => null),
        };

        this.trackVisibility = mapObject(props.validators, () => React.createRef());
    }

    private validate(item: T): boolean {
        const showBaseProperties = Object.keys(this.props.validators);

        const validationResults: IState<T>['validationResult'] = mapObject(this.props.validators, () => null);

        for (const property of showBaseProperties as Array<keyof T>) {
            if (this.props.dynamic === true && this.trackVisibility[property].current == null) {
                continue;
            }

            const validator = this.props.validators[property];

            validationResults[property] = validator(item[property]);
        }

        this.setState({validationResult: validationResults});

        const allValid = Object.values(validationResults).every((result) => result == null);

        return allValid;
    }

    render() {
        return this.props.children(this.validate, this.state.validationResult, this.trackVisibility);
    }
}
