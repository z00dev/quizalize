var React = require('react');

var UserStore = require('createQuizApp/stores/UserStore');
var UserActions = require('createQuizApp/actions/UserActions');

var CQLink          = require('createQuizApp/components/utils/CQLink');


var CQPageTemplate = require('createQuizApp/components/CQPageTemplate');

require('./CQDashboardStyles');

var CQDashboard = React.createClass({

    getInitialState: function() {
        return {
            user: ''
        };
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this.onChange);
    },

    componentWillUnmount: function() {
        UserStore.removeChangeListener(this.onChange);
    },

    onChange: function(){
        console.log('onChange');
        this.setState({user: UserStore.getUser()});
    },

    render: function() {
        return (
            <CQPageTemplate className="container">
                <h2>
                    Hi there! What would you like to do?
                </h2>
                <br/>
                <div className="row">
                    <div className="row well">
                        <div className="quiz-preview">
                            <div className="row">
                                <div className="col-sm-6">

                                    <div className="border-block">
                                        <center>

                                            <h3>
                                                Make a classroom quiz in 60 seconds
                                            </h3>
                                        </center>
                                        <br/>
                                        <center>
                                            <CQLink href="/quiz/create" className="btn btn-primary btn-lg">
                                                Create a new quiz
                                            </CQLink>
                                        </center>

                                    </div>
                                </div>
                                <div className="col-sm-6">

                                    <div className="border-block">

                                        <center>

                                            <h3>
                                                Choose a pre-made quiz for your class
                                            </h3>
                                        </center>
                                        <br/>
                                        <center>
                                            <CQLink href="/quiz/public" className="btn btn-primary btn-lg btn-info">
                                                Choose a quiz
                                            </CQLink>
                                        </center>

                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </CQPageTemplate>
        );
    }

});

module.exports = CQDashboard;