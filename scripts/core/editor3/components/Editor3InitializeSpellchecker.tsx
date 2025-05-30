import React from 'react';
import {getInitialSpellcheckerData, IEditorStore, initializeSpellchecker} from '../store';
import ng from 'core/services/ng';
import {setExternalOptions} from '../actions';

interface IProps {
    spellchecking: IEditorStore['spellchecking'];
    dispatch(action: any): void;
}

interface IState {
    loading: boolean;
}

export class Editor3InitializeSpellchecker extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            loading: true,
        };

        this.load = this.load.bind(this);
    }

    private load() {
        const spellcheck = ng.get('spellcheck');
        const language = this.props.spellchecking.language;

        spellcheck.getInitialSpellcheckerStatus(language).then((enabled) => {
            spellcheck.isAutoSpellchecker = enabled;

            if (enabled) {
                spellcheck.getDictionary(language).then((dict) => {
                    spellcheck.isActiveDictionary = !!dict.length;
                    spellcheck.setLanguage(language);
                    spellcheck.setSpellcheckerStatus(true);

                    initializeSpellchecker(this.props.dispatch, spellcheck).then(() => {
                        this.props.dispatch(setExternalOptions({
                            spellchecking: getInitialSpellcheckerData(spellcheck, language),
                        }));

                        this.setState({loading: false});
                    });
                });
            } else {
                this.setState({loading: false});
            }
        });
    }

    componentDidMount(): void {
        this.load();
    }

    componentDidUpdate(prevProps: Readonly<IProps>): void {
        if (this.props.spellchecking.language !== prevProps.spellchecking.language) {
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
