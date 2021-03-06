/* @flow */
import React from 'react';
import CQLatexString from 'react-latex';
import {router} from './../../../config/';

import CQEditNormal from './CQEditNormal';

import type {QuizComplete, Question} from './../../../../../types';

type Props = {
    quiz: QuizComplete;
    handleSave: Function;
    questionIndex: number;
    handleQuestion: Function;
    handleRemoveQuestion: Function;
    setSaveMode: Function;
}

class CQQuestionList extends React.Component {

    props: Props;

    constructor(props:Props) {
        super(props);


        this.setSaveMode = this.setSaveMode.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleNewQuestion = this.handleNewQuestion.bind(this);
        this.handleQuestion = this.handleQuestion.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.handleEdit = this.handleEdit.bind(this);
    }
    setSaveMode(canBeSaved: boolean) {
        this.props.setSaveMode(canBeSaved);
    }

    handleNewQuestion(){
        var {quiz} = this.props;
        // we filter questions with no content
        if (quiz.payload.questions){
            var index = -1;
            quiz.payload.questions.forEach(function(q, i) {
                if (q.question.length === 0 || q.answer.length === 0) {
                    index = i;
                }
            });
            if (index === -1) {
                this.props.handleSave();
            }
            else {
                router.setRoute(`/quiz/create/${quiz.uuid}/${index}`);
            }
        }
    }

    handleSave(){
        var {quiz} = this.props;
        // we filter questions with no content
        if (quiz.payload.questions){
            var index = -1;
            quiz.payload.questions.forEach(function(q, i) {
                if (q.question.length === 0 || q.answer.length === 0) {
                    index = i;
                }
            });
            if (index === -1 || index === quiz.payload.questions.length - 1) {
                this.props.handleSave();
            }
            else {
                swal({
                    title: 'Whoops',
                    text: "Please enter at least a question and an answer before adding a new question 2222",
                    type: 'info',
                    confirmButtonText: 'OK',
                    showCancelButton: false
                }, function(){
                    router.setRoute(`/quiz/create/${quiz.uuid}/${index}`);
                });
            }
        }
    }

    handleQuestion (question: Question){
        this.props.handleQuestion(question);
    }

    handleRemove(question: Question, event: Object){
        this.props.handleRemoveQuestion(question, event);
    }

    handleEdit(index : number){
        if (this.props.questionIndex !== index){
            router.setRoute(`/quiz/create/${this.props.quiz.uuid}/${index}`);
        }
    }

    render() : any {

        var questions;
        var newQuestionEditor;

        var questionEditor = (
            <CQEditNormal
                setSaveMode={this.setSaveMode}
                quiz={this.props.quiz}
                questionIndex={this.props.questionIndex}
                onChange={this.handleQuestion}
                onSave={this.handleSave}/>
            );


        if (this.props.questionIndex === this.props.quiz.payload.questions.length){

            // new question
        }

        var questionText = (question) => {
            if (question.latexEnabled) {
                return (<CQLatexString>{question.question}</CQLatexString>);
            }
            else {
                return (<span>{question.question}</span>);
            }
        };

        var answerText = (question) => {
            if (question.latexEnabled) {
                return (<CQLatexString>{question.answer}</CQLatexString>);
            }
            else {
                return (<span>{question.answer}</span>);
            }
        };

        if (this.props.quiz.payload.questions.length > 0) {

            questions = this.props.quiz.payload.questions.map((item, index) => {
                var editor = index === this.props.questionIndex ? questionEditor : undefined;
                var className = index === this.props.questionIndex ? 'cq-edit__quiz cq-edit__quiz--selected' : 'cq-edit__quiz cq-edit__quiz--unselected';



                return (
                    <div className={className} key={index} onClick={this.handleEdit.bind(this, index)}>
                        <div className="col-sm-6 cq-edit__listquestion">
                            <span className="label label-primary">Q</span>&nbsp;
                            {questionText(item)}
                        </div>
                        <div className="col-sm-4 cq-edit__listanswer">
                            <span className="label label-warning">A</span>&nbsp;
                            {answerText(item)}
                        </div>
                        <div className="col-sm-2">
                            <div className="icons-se">
                                <button type='button' className="btn btn-info btn-xs">
                                    <span className="glyphicon glyphicon-pencil"></span>
                                </button>
                                <button type='button' className="btn btn-danger btn-xs" onClick={this.handleRemove.bind(this, item)}>
                                    <span className="glyphicon glyphicon-remove"></span>
                                </button>
                            </div>
                        </div>
                        <div className="clearfix"></div>
                        {editor}
                    </div>
                );
            });
        } else {
            questions = (<div/>);
        }


        return (
            <div className="cq-questionlist">
                {questions}
                {newQuestionEditor}
                <div className='new-question-cta'>

                    <button type='button'
                        className="btn btn-default cq-questionlist__button"
                        onClick={this.handleNewQuestion}>
                        <span className="glyphicon glyphicon-plus"></span> Add a new question
                    </button>

                </div>
            </div>
        );
    }

}

CQQuestionList.propTypes = {
    quiz: React.PropTypes.object.isRequired,
    handleSave: React.PropTypes.func.isRequired,
    questionIndex: React.PropTypes.number,
    handleQuestion: React.PropTypes.func,
    handleRemoveQuestion: React.PropTypes.func,
    setSaveMode: React.PropTypes.func
};

module.exports = CQQuestionList;
