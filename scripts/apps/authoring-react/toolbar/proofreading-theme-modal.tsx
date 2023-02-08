import React from 'react';
import classNames from 'classnames';
import {Button, ButtonGroup, Modal, Select, Option, RadioButtonGroup} from 'superdesk-ui-framework/react';

interface IProps {
    onHide(): void;
}

interface IBackgroundColor {
    name?: string,
    color?: string,
}

interface IState {
    leftSideValue: IBackgroundColor;
    rightSideValue: IBackgroundColor;
    colorSwatchArray: Array<IBackgroundColor>;
}

export class ProofreadingThemeModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            leftSideValue: {},
            rightSideValue: {},
            colorSwatchArray: [
                {name: 'default', color: '#ffffff'},
                {name: 'dark', color: '#1b1e19'},
                {name: 'blue', color: '#1b4473f2'},
                {name: 'turquoise', color: '#00ced1'},
                {name: 'military', color: '#959f60'},
                {name: 'natural', color: '#efe9c5'},
            ],
        }
    }

    //sd-editor--theme-default ----------------------------------- #ffffff
    //sd-editor--theme-dark ------- rgba(27, 30, 25, 1) ---------- #1b1e19
    //sd-editor--theme-turquoise -- rgba(0, 206, 209, 1) --------- #00ced1
    //sd-editor--theme-military --- rgba(149, 159, 96, 1) -------- #959f60
    //sd-editor--theme-natural ---- rgba(239, 233, 197, 1) ------- #efe9c5
    //sd-editor--theme-blue ------- rgba(27, 68, 115, 0.95) ------ #1b4473f2

    render() {

        return (
            <Modal
                zIndex={1050}
                visible
                onHide={this.props.onHide}
                headerTemplate={'Configure Editor themes'}
                footerTemplate={
                    <ButtonGroup align="end">
                        <Button text='Cancel' onClick={() => false}/>
                        <Button type='primary' text='Save' onClick={() => {}}/>
                    </ButtonGroup>
                }
                contentPadding={'none'}
            >
                <div className="">
                    <div className="sd-column-box--2">
                        <div className="sd-column-box__main-column sd-column-box__main-column--left sd-column-box__main-column--padded" style={{flex: '1 1 50%'}}>

                            <h2 className="modal__body-heading"
                                style={{
                                    fontSize: '1.8rem',
                                    //fontWeight: '400',
                                    marginBottom: '2rem',
                                    lineHeight: '100%',
                                }}
                            >
                                <span className="badge badge--success"
                                    style={{
                                        verticalAlign: 'bottom',
                                        marginRight: '0.6rem',
                                    }}
                                >
                                    &nbsp;
                                </span>
                                Default Theme
                            </h2>

                            <div className="form__row">
                                <Select
                                    label='Font'
                                    value='Option 1'
                                    onChange={(value) => false}>
                                    <Option>Option 1</Option>
                                    <Option>Option 2</Option>
                                </Select>
                            </div>

                            <ColorSwatch options={this.state.colorSwatchArray} onChange={(item: IBackgroundColor) => this.setState({leftSideValue: item})} />

                            <div className={`
                                theme-preview
                                sd-editor--theme-${this.state.leftSideValue.name}
                                sd-editor--headline-large
                                sd-editor--theme-{{themePref.theme}}
                                sd-editor--font-{{themePref.font}}
                                sd-editor--headline-{{themePref.headline}}
                                sd-editor--abstract-{{themePref.abstract}}
                                sd-editor--body-{{themePref.body}}`
                                }
                            >
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">'Headline'</label>
                                    <div className="theme-preview__text-field text-field__headline">
                                        'This is the headline'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup group={{align: 'end'}} options={[
                                            {value:'M', label:'M'},
                                            {value:'S', label:'S'},
                                            {value:'L', label:'L'},
                                        ]} value={'M'} onChange={(value) => false } />
                                    </div>

                                </div>
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">'Abstract'</label>
                                    <div className="theme-preview__text-field text-field__abstract">
                                        'Abstract example'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup group={{align: 'end'}} options={[
                                            {value:'M', label:'M'},
                                            {value:'S', label:'S'},
                                            {value:'L', label:'L'},
                                        ]} value={'M'} onChange={(value) => false } />
                                    </div>
                                </div>
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">'Body'</label>
                                    <div className="theme-preview__text-field text-field__body">
                                        'Body text example'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup group={{align: 'end'}} options={[
                                            {value:'M', label:'M'},
                                            {value:'S', label:'S'},
                                            {value:'L', label:'L'},
                                        ]} value={'M'} onChange={(value) => false } />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sd-column-box__main-column sd-column-box__main-column--right sd-column-box__main-column--padded"  style={{flex: '1 1 50%'}}>

                            <h2 className="modal__body-heading"
                                style={{
                                    fontSize: '1.8rem',
                                    //fontWeight: '400',
                                    marginBottom: '2rem',
                                    lineHeight: '100%',
                                }}
                            >
                                    <span className="badge badge--success"
                                    style={{
                                        verticalAlign: 'bottom',
                                        marginRight: '0.6rem',
                                    }}
                                    >
                                        &nbsp;
                                    </span>
                                    Default Theme
                            </h2>

                            <div className="form__row">
                                <Select
                                    label='Font'
                                    value='Option 1'
                                    onChange={(value) => false}>
                                    <Option>Option 1</Option>
                                    <Option>Option 2</Option>
                                </Select>
                            </div>

                            <ColorSwatch options={this.state.colorSwatchArray} onChange={(item: IBackgroundColor) => this.setState({rightSideValue: item})} />

                            <div className={`
                                theme-preview
                                sd-editor--theme-${this.state.rightSideValue.name}
                                sd-editor--theme-{{themePref.theme}}
                                sd-editor--font-{{themePref.font}}
                                sd-editor--headline-{{themePref.headline}}
                                sd-editor--abstract-{{themePref.abstract}}
                                sd-editor--body-{{themePref.body}}`
                                }
                            >
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">'Headline'</label>
                                    <div className="theme-preview__text-field text-field__headline">
                                        'This is the headline'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup group={{align: 'end'}} options={[
                                            {value:'M', label:'M'},
                                            {value:'S', label:'S'},
                                            {value:'L', label:'L'},
                                        ]} value={'M'} onChange={(value) => false } />
                                    </div>
                                </div>
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">'Abstract'</label>
                                    <div className="theme-preview__text-field text-field__abstract">
                                        'Abstract example'. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Phasellus ullamcorper…
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup group={{align: 'end'}} options={[
                                            {value:'M', label:'M'},
                                            {value:'S', label:'S'},
                                            {value:'L', label:'L'},
                                        ]} value={'M'} onChange={(value) => false } />
                                    </div>
                                </div>
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">'Body'</label>
                                    <div className="theme-preview__text-field text-field__body">
                                        'Body text example'. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Phasellus ullamcorper…
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup group={{align: 'end'}} options={[
                                            {value:'M', label:'M'},
                                            {value:'S', label:'S'},
                                            {value:'L', label:'L'},
                                        ]} value={'M'} onChange={(value) => false } />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            )
    }
}


interface IPropsColorSwatch {
    options: Array<IBackgroundColor>;
    onChange(value: IBackgroundColor): void;
}

interface IStateColorSwatch {
    active: string;
}

export class ColorSwatch extends React.Component<IPropsColorSwatch, IStateColorSwatch> {
    constructor(props: IPropsColorSwatch) {
        super(props);
        this.state = {
            active: '',
        }

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(item: any) {
        this.setState({
            active: item.color,
        });
        this.props.onChange(item);
    }

    render() {
        return (
            <div className="color-swatch__list">
            {
                this.props.options.map((item: any, index: number) => {
                    return <div className={`color-swatch ${this.state.active === item.color ? 'color-swatch--selected' : ''}`} key={index}>
                            <span className="color-swatch__inner"  style={{backgroundColor: `${item.color}`}} onClick={() => this.handleChange(item)}>a</span>
                    </div>
                })
            }
            </div>
        );
    }
}
