import React from 'react';
import router from './../../../config/router';

import {
    GroupStore,
    MeStore
}  from './../../../stores';
import {
    GroupActions,
    QuizActions
} from './../../../actions';

import { AnalyticsActions } from './../../../actions';

type Props = {
    quizId: string;
};

type State = {
    newClassName: string;
    canSaveNewClass: boolean;
    groups: Array<Object>;
    groupsUsed: Array<Object>;
};

export default class CQViewClassList extends React.Component {

    props: Props;
    state: State;
    constructor(props: Props) {
        super(props);
        var initialState = this.getState();
        initialState.newClassName = '';
        initialState.canSaveNewClass = false;
        initialState.groupsUsed = [];
        initialState.user = MeStore.state;
        this.state = initialState;

        this.onChange = this.onChange.bind(this);
        this.getState = this.getState.bind(this);
        this._showGroupsList = this._showGroupsList.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.handleClassName = this.handleClassName.bind(this);
        this.handleNewClass = this.handleNewClass.bind(this);

    }

    componentDidMount() {
        GroupStore.addChangeListener(this.onChange);
    }

    componentWillUnmount() {
        GroupStore.removeChangeListener(this.onChange);
    }

    onChange(){
        this.setState(this.getState());
    }

    getState(){
        var groups = GroupStore.getGroups();
        var groupsContent = GroupStore.getGroupsContent();
        var quizId = this.props.quizId;
        QuizActions.loadQuiz(quizId).then( (quiz) => {
            if (quiz.payload.questions.length === 0) {
                swal({
                    title: "Error",
                    text: "You need at least one question in order to be able to play this quiz"
                },function() {
                    router.setRoute(`/quiz/create/${quiz.uuid}`);
                });
            }
            else if (!quiz.meta.name || quiz.meta.name.length === 0) {
                swal(
                    {   title: "Please specify a quiz name",
                        text: "Your students will be able to identify it easier",
                        type: "input",
                        showCancelButton: true,
                        closeOnConfirm: false,
                        closeOnCancel: false,
                        animation: "slide-from-top",
                        inputPlaceholder: "e.g. End of Unit Quiz"
                    },
                function(inputValue) {
                    if (inputValue === false) {
                        swal({
                                title: "Error",
                                text: "You will need to specifiy a quiz name to continue"
                            },function() {
                                router.setRoute("/quiz/user");
                            });
                        return false;
                    }
                    else if (inputValue === "") {
                        swal.showInputError("Please specify a quiz name to continue");
                        return false;
                    }
                    else {

                            quiz.meta.name = inputValue;
                            QuizActions.newQuiz(quiz).then( ()=> {
                                swal("Thanks!", "You can now use this quiz in your class");
                            });
                        }
                    });
            }
        });
        console.log('groupsContent', groups, groupsContent);
        // group code
        var groupsUsed = groups
            .filter( g => {
                var content = groupsContent.filter(c => c.contentId === this.props.quizId && c.groupCode === g.code);
                return content.length > 0;
            })
            .map(g => g.code);

        return { groups, groupsUsed };
    }

    _showGroupsList(){

        if (!this.state.groups) {
            return [{
                value: null,
                label: 'Loading',
                disabled: true
            }];
        }
        var groupList = this.state.groups.map(g => {
            return {value: g.code, label: g.name};
        });

        return groupList;

    }

    handleClick(classCode){
        var groupsUsed = [classCode];
        var newClassName = '';
        var canSaveNewClass = false;

        this.setState({ groupsUsed, newClassName, canSaveNewClass });
    }


    // handleClick: function(classCode, ev){
    //     // console.log("Here?",classCode,ev);
    //     // var isAssigning = ev.target.checked;
    //     // var groupsUsed = this.state.groupsUsed;
    //     // if (isAssigning){
    //     //     GroupActions.publishAssignment(this.props.quizId, classCode);
    //     //     groupsUsed.push(classCode);
    //     // } else {
    //     //     GroupActions.unpublishAssignment(this.props.quizId, classCode);
    //     //     groupsUsed.splice(groupsUsed.indexOf(classCode), 1);
    //     // }
    //     // this.setState({groupsUsed});

    //     // console.log('classCode', classCode, ev.target.checked);
    // },

    handleDone() {
        GroupActions.publishAssignment(this.props.quizId, this.state.groupsUsed[0])
            .then((response) =>{
                AnalyticsActions.sendEvent('class', 'assign', response.groupCode);
                AnalyticsActions.sendIntercomEvent('assign_class', {uuid: response.groupCode});
                router.setRoute(`/quiz/published/${response.content.uuid}/${response.groupCode}/info`);
            });
    }

    handleClassName(ev){
        console.log('handleClassName', ev.target.value);
        this.setState({
            newClassName: ev.target.value,
            canSaveNewClass: ev.target.value.length > 0,
            groupsUsed: []
        });
    }

    handleNewClass(ev){
        ev.preventDefault();

        var className = this.state.newClassName;
        if (className.length > 0) {

            GroupActions.publishNewAssignment(this.props.quizId, className)
                .then((response) =>{
                    AnalyticsActions.sendIntercomEvent('new_class', {uuid: response.groupCode, name: className});
                    AnalyticsActions.sendIntercomEvent('assign_class', {uuid: response.groupCode, name: className});
                    router.setRoute(`/quiz/published/${response.content.uuid}/${response.groupCode}/info`);
                });
            this.setState({
                newClassName: '',
                canSaveNewClass: false
            });
        }
    }
    handleViewInfo(){
        AnalyticsActions.sendEvent('assign_class', 'watch_info');
        AnalyticsActions.sendIntercomEvent('assign_class', {watch_info: true});
    }

    render() {
        var newTitle = "Create a new class";
        var existingClasses = (() => {
            if (this._showGroupsList().length > 0) {
                newTitle = "...or create a new class";
                return (<div>
                    <h4>Your current classes:</h4>
                    <ul className="list-unstyled">
                        {this._showGroupsList().map( (classN) => {
                            return (
                                <li key={classN.value}>
                                    <input type="radio"
                                        name="classSelection"
                                        id={classN.value}
                                        checked={this.state.groupsUsed.indexOf(classN.value) !== -1}
                                        onChange={this.handleClick.bind(this, classN.value)}
                                        />
                                    <label htmlFor={classN.value}>
                                        &nbsp;{classN.label}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                    <button className="btn btn-primary cq-viewclass__done"
                        disabled={this.state.groupsUsed.length === 0}
                        onClick={this.handleDone}>
                        Done - Use this class
                    </button>
                </div>);
            }
        });


        return (
            <div className='cq-viewclass'>
                <h3>
                    Set as a class game (or homework)
                </h3>
                <div className="cq-viewclass__list">
                    {existingClasses()}
                    <h4>{newTitle}</h4>
                    <form className="cq-viewclass__new" onSubmit={this.handleNewClass}>
                        <input
                            id='newClassBox'
                            type="text"
                            className=""
                            value={this.state.newClassName}
                            onChange={this.handleClassName}
                            placeholder="New class name"/>
                        <button className={this.state.canSaveNewClass ? "cq-viewclass__save--enabled" : "cq-viewclass__save--disabled"}
                            id='createNewClass'
                            type="submit"
                            disabled={!this.state.canSaveNewClass}>
                            Continue
                        </button>
                    </form>
                </div>
                <div className="cq-viewclass__extra">
                    <p>
                        <a href="https://youtu.be/jmgMbEzkRUA?t=1m43s" target="_blank" onClick={this.handleViewInfo}>
                            See how to play and what you'll need…
                        </a>
                    </p>
                </div>
            </div>
        );
    }

}

CQViewClassList.propTypes = {
    quizId: React.PropTypes.string.isRequired
};
