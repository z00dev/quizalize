var React = require('react');
var router = require('createQuizApp/config/router');

var CQPageTemplate = require('createQuizApp/components/CQPageTemplate');
var CQLink = require('createQuizApp/components/utils/CQLink');

var CQAppGrid = require('./CQAppGrid');
var CQViewQuizList = require('createQuizApp/components/views/CQViewQuizList');
var CQViewQuizFilter = require('createQuizApp/components/views/CQViewQuizFilter');
var CQViewQuizDetails = require('createQuizApp/components/views/CQViewQuizDetails');


var TransactionActions = require('createQuizApp/actions/TransactionActions');
var AppActions = require('createQuizApp/actions/AppActions');

var QuizStore  = require('createQuizApp/stores/QuizStore');
var AppStore = require('createQuizApp/stores/AppStore');
var UserStore = require('createQuizApp/stores/UserStore');


var CQPublic = React.createClass({

    getInitialState: function() {
        var newState =  this.getState();
        newState.showApps = true;
        newState.showQuizzes = true;
        newState.user = UserStore.getUser();
        return newState;
    },

    componentDidMount: function() {
        AppActions.searchPublicApps();
        QuizStore.addChangeListener(this.onChange);
        AppStore.addChangeListener(this.onChange);
    },

    componentWillUnmount: function() {
        QuizStore.removeChangeListener(this.onChange);
        AppStore.removeChangeListener(this.onChange);
    },

    getState: function(){
        var quizzes = QuizStore.getPublicQuizzes();
        var newState = { quizzes };
        return newState;

    },

    onChange: function(){
        this.setState(this.getState());
    },

    handlePreview: function(quiz){
        sessionStorage.setItem('mode', 'teacher');
        window.open(`/app#/play/public/${quiz.uuid}`);
        // window.location.href = `/app#/play/public/${quiz.uuid}`;

    },

    handleSet: function(quiz){
        router.setRoute(`/quiz/published/${quiz.uuid}`);
    },

    handleBuy: function(quiz){
        if (!this.state.user) {
            swal({
                title: 'You need to be logged in',
                text: `In order to buy this item you need to log into Quizalize`,
                type: 'info',
                confirmButtonText: 'Log in',
                showCancelButton: true
            }, function(isConfirm){
                if (isConfirm){
                    router.setRoute(`/quiz/login?redirect=${window.encodeURIComponent('/quiz/public')}`);
                }
            });
        } else {

            TransactionActions.buyQuiz(quiz);
        }
    },

    handleViewChange: function(options){
        switch (options){
            case 'all':
                this.setState({
                    showApps: true,
                    showQuizzes: true
                });
                break;

            case 'quizzes':
                this.setState({
                    showApps: false,
                    showQuizzes: true
                });
                break;
            case 'apps':
                this.setState({
                    showApps: true,
                    showQuizzes: false
                });
        }
    },

    handleDetails: function(quiz){
        this.setState({quizDetails: quiz.uuid});
    },

    handleDetailsClose: function(){
        this.setState({quizDetails: undefined});
    },

    render: function() {

        var appGrid, quizList, quizDetails;
        if (this.state.showApps) {
            appGrid = (<CQAppGrid/>);
        }

        if (this.state.quizDetails) {
            quizDetails = (<CQViewQuizDetails
                onClose={this.handleDetailsClose}
                quizId={this.state.quizDetails}/>);
        }


        if (this.state.showQuizzes) {

            var numOfQuizzes = this.state.showApps ? 12 : 16;

            quizList = (
                <CQViewQuizList
                    isQuizInteractive={true}
                    isPaginated={true}

                    onQuizClick={this.handleDetails}
                    quizzes={this.state.quizzes}
                    className="cq-public__list"
                    sortBy="time">

                    <span className='cq-public__button' onClick={this.handlePreview}>
                        Preview
                    </span>
                    <span className='cq-public__button' onClick={this.handleBuy}>
                        Free
                    </span>

                </CQViewQuizList>
            );
        }
        return (
            <CQPageTemplate className="container cq-public">
                {quizDetails}
                <CQViewQuizFilter appEnabled={true} onViewChange={this.handleViewChange} allTopics={true}/>

                {appGrid}
                {quizList}

            </CQPageTemplate>
        );
    }

});

module.exports = CQPublic;
