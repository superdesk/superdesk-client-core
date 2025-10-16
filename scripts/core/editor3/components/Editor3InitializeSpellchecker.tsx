import React from 'react';
import {getInitialSpellcheckerData, IEditorStore, initializeSpellchecker} from '../store';
import ng from 'core/services/ng';
import {setExternalOptions} from '../actions';

interface IProps {
    spellchecking: IEditorStore['spellchecking'];
    limitConfig: IEditorStore['limitConfig'];
    softLimitConfig: IEditorStore['softLimitConfig'];
    dispatch(action: any): void;
}

interface IState {
    loading: boolean;
}

export class Editor3InitializeSpellchecker extends React.PureComponent<IProps, IState> {
    private statusWasLoaded: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
        };

        this.load = this.load.bind(this);
        this.handleDecoratorUpdate = this.handleDecoratorUpdate.bind(this);

        this.statusWasLoaded = false;
    }

    private getSpellcheckerStatus(language: string): Promise<boolean> {
        const spellcheck = ng.get('spellcheck');

        if (this.statusWasLoaded) {
            return Promise.resolve(this.props.spellchecking.enabled);
        } else {
            return spellcheck.getInitialSpellcheckerStatus(language).then((status) => {
                this.statusWasLoaded = true;

                return status;
            });
        }
    }

    private handleDecoratorUpdate(options: {enable: boolean, language: string}): void {
        const {enable, language} = options;

        this.props.dispatch(setExternalOptions({
            spellchecking: getInitialSpellcheckerData(enable ? ng.get('spellcheck') : null, language),
            limitConfig: this.props.limitConfig,
            softLimitConfig: this.props.softLimitConfig,
        }));

        this.setState({loading: false});
    }

    private load() {
        const spellcheck = ng.get('spellcheck');
        const language = this.props.spellchecking.language;

        if (language == null) {
            this.setState({loading: false});
            return;
        }

        this.getSpellcheckerStatus(language).then((enabled) => {
            spellcheck.isAutoSpellchecker = enabled;

            if (enabled) {
                spellcheck.getDictionary(language).then((dict) => {
                    spellcheck.isActiveDictionary = !!dict.length;
                    spellcheck.setLanguage(language);
                    spellcheck.setSpellcheckerStatus(true);

                    initializeSpellchecker(this.props.dispatch, spellcheck).then(() => {
                        this.handleDecoratorUpdate({enable: true, language});
                    });
                });
            } else {
                // update redux store to mark spellchecker as disabled
                this.handleDecoratorUpdate({enable: false, language});
            }
        });
    }

    componentDidMount(): void {
        this.load();
    }

    componentDidUpdate(prevProps: Readonly<IProps>): void {
        if (
            this.props.spellchecking.language !== prevProps.spellchecking.language
            || this.props.spellchecking.enabled !== prevProps.spellchecking.enabled
        ) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({loading: true}, this.load);
        }
    }

    render() {
        if (this.state.loading) {
            return null;
        } else {
            return this.props.children;
        }
    }
}
