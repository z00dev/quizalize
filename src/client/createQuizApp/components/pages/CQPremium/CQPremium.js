import React from 'react';

import CQPageTemplate from './../../../components/CQPageTemplate';
import CQSettingsSubscriptions from './../../../components/pages/CQSettings/CQSettingsSubscriptions';

import MeStore from './../../../stores/MeStore';

class CQPremium extends React.Component {

    constructor(props){
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
        MeStore.addChangeListener(this.onChange);
    }

    componentWillUnmount() {
        MeStore.removeChangeListener(this.onChange);
    }

    onChange(){
        this.forceUpdate();
    }

    render () {
        return (
            <CQPageTemplate>
                asdf
                <CQSettingsSubscriptions user={MeStore.state}/>
            </CQPageTemplate>
        );
    }
}

export default CQPremium;