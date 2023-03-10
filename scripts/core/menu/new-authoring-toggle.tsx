import React from 'react';
import {sdApi} from 'api';

interface IState {
    enabled: boolean;
}

export class NewAuthoringToggle extends React.PureComponent<{}, IState> {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
        }
    }

    componentDidMount(): void {
        const authoringNewEnable = sdApi.preferences.get('feature:authoring');
        
        Promise.all([
            authoringNewEnable,
        ]).then(([x]) => {
            console.log(x, 'did mount');
            this.setState({
                enabled: x.enabled
            })
        })
    }
    render() {
        const authoringNewEnable = sdApi.preferences.get('feature:authoring');

        //console.log(sdApi.preferences.get('authoringNewEnable'));
        console.log(this.state.enabled, 'render');
        

        return (
            <div>
                {/* {this.state.enabled} */}

                <button onClick={() => {
                    sdApi.preferences.update('feature:authoring', {})
                    const authoring = sdApi.preferences.get('feature:authoring');

                        authoring.save({
                            enabled: this.state.enabled,
                        }).then((res) => {
                            // this.props.onThemeChange({
                            //     default: JSON.parse(res.user_preferences[PREFERENCES_KEY].theme),
                            //     proofreading: JSON.parse(res.user_preferences[PREFERENCES_KEY].proofreadTheme),
                            // });
                            //console.log(res);
                            
                        });

                       
                }}>
                    disable
                </button>
            </div>
        );
    }
}
