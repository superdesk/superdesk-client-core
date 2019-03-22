import React from 'react';
import classNames from 'classnames';
import {connectServices} from 'core/helpers/ReactRenderAsync';
import {IInputType} from '../interfaces/input-types';
import {IRestApiResponse} from 'types/RestApi';
import {IDesk} from 'superdesk-interfaces/Desk';
import {IStage} from 'superdesk-interfaces/Stage';
import {IMacro} from 'superdesk-interfaces/Macro';

interface IProps extends IInputType<string> {
    api?: any;
}

interface IState {
    desks: Array<IDesk>;
    stages: Array<IStage>;
    macros: Array<IMacro>;
}

export class DeskStageMacroComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            desks: null,
            stages: null,
            macros: null,
        };

        this.fetchItems = this.fetchItems.bind(this);
    }
    fetchItems(): void {
        const {deskField} = this.props.formField.component_parameters;
        const selectedDesk = this.props.formValues[deskField];

        Promise.all([
            this.props.api('desks').query({max_results: 200}),
            selectedDesk == null
                ? Promise.resolve(null)
                : this.props.api('stages').query({where: {desk: selectedDesk}, max_results: 200}),
            selectedDesk == null
                ? Promise.resolve(null)
                : this.props.api('macros').query({desk: selectedDesk, backend: true, max_results: 200}),
        ]).then((res) => {
            const desks: IRestApiResponse<IDesk> = res[0];
            const stages: IRestApiResponse<IStage> = res[1];
            const macros: IRestApiResponse<IMacro> = res[2];

            this.setState({
                desks: desks._items,
                stages: stages == null ? null : stages._items,
                macros: macros == null ? null : macros._items,
            });
        });
    }
    componentDidMount() {
        this.fetchItems();
    }
    render() {
        if (this.props.previewOuput) {
            throw new Error('Operation not supported');
        }

        const {deskField, stageField, macroField} = this.props.formField.component_parameters;
        const selectedDesk = this.props.formValues[deskField];
        const deskSelected: boolean = typeof selectedDesk === 'string' && selectedDesk !== '';

        const deskIssues = this.props.allIssues[deskField] || [];
        const stageIssues = this.props.allIssues[stageField] || [];
        const macroIsssues = this.props.allIssues[macroField] || [];

        return (
            <div>
                <div
                    className={
                        classNames('sd-line-input', {'sd-line-input--invalid': deskIssues.length > 0})
                    }
                >
                    <label className="sd-line-input__label">{gettext('Desk')}</label>
                    <select
                        disabled={this.props.disabled || this.state.desks == null}
                        value={this.props.formValues[deskField]}
                        className="sd-line-input__select"
                        onChange={(event) => {
                            const deskId = event.target.value;

                            this.setState({stages: null, macros: null});
                            this.props.onChange(event.target.value, deskField === '' ? undefined : deskField);

                            if (deskId !== '') {
                                this.fetchItems();
                            }
                        }}
                    >
                        <option value={null} />
                        {
                            this.state.desks == null
                                ? null
                                : this.state.desks.map(({_id, name}, i) => (
                                    <option key={i} value={_id}>{name}</option>
                                ))
                        }
                    </select>
                    {
                        deskIssues.map((str, i) => (
                            <div key={i} className="sd-line-input__message">{str}</div>
                        ))
                    }
                </div>

                <div
                    className={
                        classNames('sd-line-input', {'sd-line-input--invalid': stageIssues.length > 0})
                    }
                >
                    <label className="sd-line-input__label">{gettext('Stage')}</label>
                    <select
                        disabled={this.props.disabled || this.state.stages == null}
                        value={this.props.formValues[stageField]}
                        className="sd-line-input__select"
                        onChange={(event) => {
                            this.props.onChange(event.target.value, stageField);
                        }}
                    >
                        <option value="">{deskSelected ? '' : gettext('Select a desk first')}</option>
                        {
                            this.state.stages == null
                                ? null
                                : this.state.stages.map(({_id, name}, i) => (
                                    <option key={i} value={_id}>{name}</option>
                                ))
                        }
                    </select>
                    {
                        stageIssues.map((str, i) => (
                            <div key={i} className="sd-line-input__message">{str}</div>
                        ))
                    }
                </div>

                <div
                    className={
                        classNames('sd-line-input', {'sd-line-input--invalid': macroIsssues.length > 0})
                    }
                >
                    <label className="sd-line-input__label">{gettext('Macro')}</label>
                    <select
                        disabled={this.props.disabled || this.state.macros == null}
                        value={this.props.formValues[macroField || '']}
                        className="sd-line-input__select"
                        onChange={(event) => {
                            this.props.onChange(event.target.value, macroField);
                        }}
                    >
                        <option value="">{deskSelected ? '' : gettext('Select a desk first')}</option>
                        {
                            this.state.macros == null
                                ? null
                                : this.state.macros.map(({label}, i) => (
                                    <option key={i} value={label}>{label}</option>
                                ))
                        }
                    </select>
                    {
                        macroIsssues.map((str, i) => (
                            <div key={i} className="sd-line-input__message">{str}</div>
                        ))
                    }
                </div>

                {
                    this.props.issues.map((str, i) => (
                        <div key={i} className="sd-line-input__message">{str}</div>
                    ))
                }
            </div>
        );
    }
}

export const DeskStageMacro = connectServices<IProps>(
    DeskStageMacroComponent,
    ['api'],
);
