var React = require('react');

var randomise = require('quizApp/utils/randomise');
var QLQuestion = require('quizApp/components/QLQuestion');
var QLAnswerScreen = require('quizApp/components/QLAnswerScreen');
var QLCountDown = require('quizApp/components/QLCountDown');
var QLImage = require('./../QLImage');

var cssStates = [
    {
        name: 'enter',
        duration: 1000
    },
    {
        name: ''
    },
    {
        name: 'exit',
        duration: 500
    }
];

var cssStateIndex = 0;
var isDragging = false;
var _domElement;
var getCoordinates = function(e){
    var x;
    var y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= _domElement.offsetLeft;
    y -= _domElement.offsetTop;

    return {x, y};
};

var getDraggableStyle = function(coordinates){
    var newStyle = {
        WebkitTransform: `translate(${coordinates.x - 140 / 2}px, ${coordinates.y - 140 / 2}px)`,
        MozTransform: `translate(${coordinates.x - 140 / 2}px, ${coordinates.y - 140 / 2}px)`,
        msTransform: `translate(${coordinates.x - 140 / 2}px, ${coordinates.y - 140 / 2}px)`,
        transform: `translate(${coordinates.x - 140 / 2}px, ${coordinates.y - 140 / 2}px)`
    };
    return newStyle;
};

var QLScrambled = React.createClass({

    propTypes: {
        currentQuiz: React.PropTypes.object.isRequired,
        quizData: React.PropTypes.object.isRequired,
        questionData: React.PropTypes.object.isRequired,
        startTime: React.PropTypes.number.isRequired,
        onSelect: React.PropTypes.func.isRequired,
        onNext: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        var answerSelected = this.props.questionData.answerObject.textArray.map(function() {
            return {text:"", index: -1};
        });
        var letters = randomise(this.props.questionData.answerObject.textArray);
        var letterSelected = letters.map(function(letter) {
            return {text:letter, state:"unselected"};
        });
        var state =  {
            cssState: cssStates[cssStateIndex],
            answered: null,
            currentLetterToFill: 0,
            answerSelected,
            letterSelected
        };
        return state;
    },

    componentDidMount: function() {
        window.addEventListener('resize', this.handleResize);
        _domElement = this.refs.main.getDOMNode();
        cssStateIndex = 0;
        setTimeout(() => {
            this.handleCssState(cssStateIndex++);
        }, this.state.cssState.duration);
    },

    componentWillUnmount: function() {
        window.removeEventListener('resize', this.handleResize);
    },

    handleResize: function(){
        this.handleResizeOptions();
        this.handleResizeQuestion();
    },

    handleResizeQuestion: function(){
        var splitPointQuestion;
        var optionSize = 60;
        var containerPadding = 20;
        //var numOptions = this.props.letters.length;
        var numOptions = this.props.questionData.answerObject.textArray.length;
        var spaceAvailable = React.findDOMNode(this.refs.userInteraction).offsetWidth - (containerPadding * 2);


        var howManyOptionsFit = spaceAvailable / optionSize;

        if (howManyOptionsFit < numOptions) {
            // we'll try with two rows
            var twoRows = (numOptions / 2) * optionSize;
            if (twoRows < spaceAvailable) {
                splitPointQuestion = Math.ceil(numOptions / 2);
            } else {
                splitPointQuestion = Math.ceil(numOptions / 3);
            }
        }
        this.setState({splitPointQuestion});

    },

    handleResizeOptions: function(){
        var splitPoint;
        var optionSize = 70;
        var containerPadding = 20;
        //var numOptions = this.props.letters.length;
        var numOptions = this.props.questionData.answerObject.textArray.length;
        var spaceAvailable = React.findDOMNode(this.refs.userInteraction).offsetWidth - (containerPadding * 2);


        var howManyOptionsFit = spaceAvailable / optionSize;

        if (howManyOptionsFit < numOptions) {
            // we'll try with two rows
            var twoRows = (numOptions / 2) * optionSize;
            if (twoRows < spaceAvailable) {
                splitPoint = Math.ceil(numOptions / 2);
            } else {
                splitPoint = Math.ceil(numOptions / 3);
            }
        }
        this.setState({splitPoint});

    },

    handleCssState: function(newCssStateIndex, cb){
        var newCssState = cssStates[newCssStateIndex];
        if (newCssState){
            this.setState({
                cssState: newCssState
            });
            if (newCssState.duration){
                setTimeout(()=>{
                    if (cb) { cb(); }
                    if (newCssStateIndex + 1 < cssStates.length) {
                        this.handleCssState(newCssStateIndex + 1);
                    } else {
                        cssStateIndex = 0;
                    }
                }, newCssState.duration);
            }
        }
    },

    handleClick: function(index){
        var letterSelected = this.state.letterSelected;
        if (letterSelected[index].state !== 'selected') {
            var unanswered = this.state.answerSelected.filter(function(answer) {
                return answer.index == -1;
            });
            var answerSelected = this.state.answerSelected;
            if(index < this.props.questionData.answerObject.textArray.length && answerSelected.length > 0){
                letterSelected[index].state = 'selected';
                unanswered[0].text = letterSelected[index].text;
                unanswered[0].index = index;
            }
            var answered = letterSelected.filter(function(letter) {
                return letter.state === 'selected';
            });
            if (answered.length === this.props.questionData.answerObject.textArray.length)
            {
                this.props.onSelect(answerSelected.map(function(a) { return a.text; }).join(this.props.questionData.answerObject.joiner));
            }
            this.setState({
                letterSelected,
                answerSelected
            });
        }
    },


    handleRemoveLetter: function(index){
        var answerSelected = this.state.answerSelected;
        if (answerSelected[index].index !== -1) {
            var letterSelected = this.state.letterSelected;
            letterSelected[answerSelected[index].index].state = 'unselected';
            answerSelected[index].text = "";
            answerSelected[index].index = -1;
            this.setState({
                letterSelected,
                answerSelected
            });
        }
    },

    render: function() {

        var showAnswer, showTargets, showOptions, showCountdown;
        var answered = this.state.letterSelected.filter(function(letter) {
            return letter.state === 'selected';
        });
        var width = 100;
        var maxLength = 0;
        //determine biggest element length
        this.props.questionData.answerObject.textArray.forEach(function(item) {
            if (maxLength < ("" + item).length) {
                maxLength = ("" + item).length;
            }
        });
        width = 50 + (maxLength * 20);
        if (answered.length !== this.props.questionData.answerObject.textArray.length) {
            var showTimer = this.props.currentQuiz.meta.showTimer == undefined ? true: this.props.currentQuiz.meta.showTimer;
            showCountdown = <QLCountDown showCountdown={showTimer} startTime={this.props.startTime} duration={this.props.questionData.duration}/>;
            showTargets = this.state.answerSelected.map(function(letter, index){
                var selected = letter.index === -1 ? "btn-info": "btn-danger";
                return (
                    <button className={`letterTile ng-binding ng-scope solution ${selected}`}
                        style={{width: width + 'px'}}
                        onClick={this.handleRemoveLetter.bind(this, index)}
                        key={index}>
                        {letter.index === -1 ? "_": letter.text}
                    </button>
                );
            }, this);

            showOptions = this.state.letterSelected.map(function(letter, index){
                if (true) {
                    var selected = letter.state === "selected" ? "btn-normal.btn-selected": "btn-info";
                    return (
                        <button className={`letterTile ng-binding ng-scope option ${selected}`}
                            style={{width: width + 'px'}}
                            onClick={this.handleClick.bind(this, index)}
                            key={index}>
                            {letter.state === 'selected' ? "_": letter.text}
                        </button>
                    );
                }
            }, this);

            if (this.state.splitPoint) {
                showOptions.splice(this.state.splitPoint, 0, <br/>);
            }
            if (this.state.splitPointQuestion) {
                showTargets.splice(this.state.splitPointQuestion, 0, <br/>);
            }
        } else {
            var questionId = this.props.questionData.uuid;
            var currentAnswerFilter = this.props.quizData.report.filter(function(f) {
                return f.questionId == questionId;
            });
            showAnswer = (
                <QLAnswerScreen
                    currentQuiz={this.props.currentQuiz}
                    questionData={this.props.questionData}
                    answerData={currentAnswerFilter[0]}
                    onNext={this.props.onNext}/>
            );
        }
        return (
            <div className='ql-quiz-container' ref='main'>
                <div className={`ql-question ql-scrambled ${this.state.cssState.name}`}>
                    <h3 className='question'>
                        <QLQuestion
                            questionData={this.props.questionData}
                        />
                    </h3>
                    {this.props.questionData.imageURL ? <QLImage src={`https://d15tuytjqnsden.cloudfront.net/${this.props.questionData.imageURL}`} className='ql-question-img'/> : null}
                    {showCountdown}
                    <div className="answers options">
                        {showAnswer}
                        {showTargets}
                        <div className="user-interaction" ref='userInteraction'>
                            {!showAnswer ? <div>Unscramble the letters below to find the correct answer</div> : null}
                            {showOptions}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = QLScrambled;
