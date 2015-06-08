var React = require('react');
var TeX = require('react-components/js/tex.jsx');
var QLLatex = require('quizApp/components/QLLatex');

var toSeconds = function(ms){
    return Math.round(ms / 10) / 100 + 's';
};

var Star = React.createClass({

    getInitialState: function() {
        return {
            rotation: Math.random() * 360,
            scale: Math.random() + 0.5,
            delay: parseInt(Math.random() * 1000, 10) + 1000
        };
    },

    cssStyle: function(){

        var rotate = this.state.rotation;
        var scale = this.state.scale;


        var newCss = {
            WebkitTransform: `rotate(${rotate}deg) scale(${scale})`,
            MsTransform: `rotate(${rotate}deg) scale(${scale})`
        };
        return newCss;
    },

    cssDelay: function(){
        var animationDelay = this.state.delay;
        var newCss = {
            WebkitAnimationDelay: `${animationDelay}ms`,
            animationDelay: `${animationDelay}ms`
        };
        return newCss;
    },

    render: function() {
        return (
            <div style={this.cssStyle()} className='star-transform'>
                <img style={this.cssDelay()} src='/img/ui-quiz/star.svg' width='40' height='40' className='star-animated'/>
            </div>
        );
    }

});


var QLAnswerScreen = React.createClass({

    propTypes: {
        answerData: React.PropTypes.object.isRequired,
        questionData: React.PropTypes.object.isRequired,
        onNext: React.PropTypes.func
    },

    handleClick: function(){
        if (this.props.onNext){
            this.props.onNext();
        }
    },

    render: function() {
        var stars = [];

        if (this.props.answerData.correct){
            for (var i = 0; i < 30; i++){
                stars.push(<Star key={i}/>);
            }
        }

        var correctAnswer;

        if (!this.props.answerData.correct){
            correctAnswer = (
                <div className="text-2">
                    The correct answer was:
                    <div className="alternatives">
                        <div className="alternative-wrapper">
                            <button type="button" className={`btn answer answer-correct`}>
                                <QLLatex>{this.props.questionData.answer}</QLLatex>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        var explanation;

        if (this.props.questionData.answerExplanation && this.props.questionData.answerExplanation.length > 0) {
            explanation = (<blockquote className="description">
                <p>
                    {this.props.questionData.answerExplanation}
                </p>
            </blockquote>);
        }

        return (
            <div className='ql-answer-screen'>
                <div className="star-container">
                    {stars}
                </div>
                <div className="text-1">

                    <h4>
                        <span>Your answer </span>
                        {this.props.answerData.correct ? 'is correct!' : 'is wrong'}
                    </h4>
                    <div className="alternatives">
                            <div className="alternative-wrapper">
                                <button type="button" className={this.props.answerData.correct ? `btn answer answer-correct` : 'btn answer answer-wrong'}>
                                    <QLLatex>{this.props.answerData.response}</QLLatex>
                                </button>
                            </div>
                    </div>
                </div>

                {correctAnswer}
                {explanation}


                <div className="score-and-time">
                    <h3 className="score">
                        <div>Your score</div>
                        <strong>
                            {this.props.answerData.roundedScore}
                        </strong>
                    </h3>
                    <h3 className="time">
                        <div>Your time</div>
                        <strong>
                            {toSeconds(this.props.answerData.duration)}
                        </strong>
                    </h3>
                    <span className="next-anim">
                        <h3 className="next" onClick={this.handleClick}>
                            <div>
                                Next
                            </div>
                            <strong>
                                <img src="/img/ui-quiz/arrow-right.svg" />
                            </strong>
                        </h3>
                    </span>
                </div>
            </div>
        );
    }

});

module.exports = QLAnswerScreen;
