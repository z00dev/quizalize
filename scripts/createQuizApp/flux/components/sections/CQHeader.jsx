var React = require('react');

var CQLink = require('createQuizApp/flux/components/utils/CQLink');
var UserStore = require('createQuizApp/flux/stores/UserStore');

require('./CQHeaderStyles');

var CQHeader = React.createClass({

    getInitialState: function() {
        console.log('UserStore.getUser', UserStore.getUser());
        return this.getState();
    },

    componentDidMount: function() {
        UserStore.addChangeListener(this.onChange);
    },

    componentWillUnmount: function() {
        UserStore.removeChangeListener(this.onChange);
    },

    onChange: function(){
        this.setState(this.getState());
    },

    getState: function(){
        console.log('UserStore.getUser', UserStore.getUser());
        var isLoggedIn = UserStore.getUser() !== false;
        return {
            isLoggedIn
        };
    },


    render: function() {

        var buttons = [];
        var loginButton;

        if (this.state.isLoggedIn){
            buttons.push((
                <li id="cq-quizzes" key='cq-quizzes'>
                    <CQLink href="/quiz/quizzes" className="btn btn-info navbar-btn">
                        Your quizzes
                    </CQLink>
                </li>));

                buttons.push((
                <li id="cq-assignments" key='cq-assignments'>
                    <CQLink href="/quiz/assignments" className="btn btn-info navbar-btn">
                        Your assignments
                    </CQLink>
                </li>
            ));

            loginButton = (<li>
                <CQLink href="/quiz/login/" className="btn btn-info navbar-btn">
                    Login
                </CQLink>
            </li>);
        } else {
            loginButton = (<li>
                <CQLink href="/quiz/login/" className="btn btn-info navbar-btn">
                    Logout
                </CQLink>
            </li>);
        }






        return (
            <nav className="navbar navbar-default cq-header">
                <div className="container-fluid">
                    <div className="navbar-header">
                        <a href="/quiz/">
                            <img src="/img/quizalize.png" className="cq-brand" alt=""/>
                            {this.state.user}
                        </a>
                    </div>
                    <div className="navbar-collapse collapse" id="navbar">
                        <ul className="nav navbar-nav navbar-right">

                            {buttons}

                            <li id="cq-publicQuizzes">
                                <CQLink href="/quiz/assignments" className="btn btn-info navbar-btn">
                                    Public quizzes
                                </CQLink>
                            </li>

                            <li id="cq-publicQuizzes">
                                <CQLink className="btn btn-info navbar-btn">
                                    ?
                                </CQLink>
                            </li>

                            {loginButton}


                        </ul>
                    </div>
                </div>
            </nav>

        );
    }

});

module.exports = CQHeader;
