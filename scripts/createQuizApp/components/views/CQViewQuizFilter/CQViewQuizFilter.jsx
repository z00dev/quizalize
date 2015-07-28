var React = require('react');
var TopicStore = require('createQuizApp/stores/TopicStore');
var QuizActions = require('createQuizApp/actions/QuizActions');
var AppActions = require('createQuizApp/actions/AppActions');

var CQDropdown = require('createQuizApp/components/utils/CQDropdown');

var CQviewQuizFilter = React.createClass({

    propTypes: {
        onSearchInput: React.PropTypes.func,
        onViewChange: React.PropTypes.func,
        appEnabled: React.PropTypes.bool,
        allTopics: React.PropTypes.bool,
        profileId: React.PropTypes.string,
        quizzes: React.PropTypes.array
    },

    getInitialState: function() {
        var initialState = this.getState();
        initialState.searchString = undefined;
        return initialState;
    },

    componentDidMount: function() {
        TopicStore.addChangeListener(this.onChange);
    },

    componentWillUnmount: function() {
        TopicStore.removeChangeListener(this.onChange);
    },

    onChange: function(){
        this.setState(this.getState());
    },

    getState: function(){
        var topics = TopicStore.getPublicSubjects();
        return {
            topics,
            searchString: '',
            categorySelected: 'all',
            kindSelected: 'all'
        };
    },

    handleSearch: function(ev){

        this.setState({
            searchString: ev.target.value
        }, this.performSearch);

    },

    handleChange: function(category){

        this.setState({
            categorySelected: category
        }, this.performSearch);

    },

    handleKind: function(kind){
        this.setState({
            kindSelected: kind
        });

        this.props.onViewChange(kind.value);
    },

    performSearch: function(){

        var category = this.state.categorySelected.value === 'all' ? undefined : this.state.categorySelected.value;
        console.log('searchign for', this.state.searchString, category, this.props.profileId);
        QuizActions.searchPublicQuizzes(this.state.searchString, category, this.props.profileId);
        AppActions.searchPublicApps(this.state.searchString, category, this.props.profileId);

    },



    render: function() {

        var mappedTopics = [];
        if (this.props.allTopics) {
            if (this.state.topics.length > 0) {
                mappedTopics = this.state.topics.map(topic => {
                    return { value: topic.uuid, name: topic.name };
                });
            }
        }
        else {

            if (this.state.topics.length > 0) {
                var currentTopics = this.props.quizzes.map(quiz => {
                    return { topicId: quiz.meta.categoryId };
                });
                var currentTopicsHash = {};
                for (var i in currentTopics) {
                    currentTopicsHash[currentTopics[i].topicId] = "A";
                }
                mappedTopics = this.state.topics.map(topic => {
                    return { value: topic.uuid, name: topic.name };
                });
                mappedTopics = mappedTopics.filter(topic => {
                    return currentTopicsHash[topic.value];
                });
            }
        }

        // var quizzesAndTopics = [];
        // if (this.props.appEnabled=="true") {
        //     quizzesAndTopics = [{
        //         name: 'quizzes and apps',
        //         value: 'all'
        //     }, {
        //         name: 'quizzes',
        //         value: 'quizzes'
        //     }, {
        //         name: 'apps',
        //         value: 'apps'
        //     }];
        // }
        // else {
        //     quizzesAndTopics = [{
        //         name: 'quizzes',
        //         value: 'quizzes'
        //     }];
        // }

        var quizzesAndTopics = [{
                name: 'quizzes and apps',
                value: 'all'
            }, {
                name: 'quizzes',
                value: 'quizzes'
            }, {
                name: 'apps',
                value: 'apps'
            }];


        var quizDropDown = () => {
            if (!this.props.appEnabled)
            {
                return (
                    <span>Show classroom quizzes for any age</span>
                );
            }
            else {
                return (
                    <span>Show classroom&nbsp;
                        <CQDropdown
                            selected={this.state.kindSelected}
                            values={quizzesAndTopics}
                            onChange={this.handleKind}/>&nbsp;for any age
                    </span>
                );
            }
        };

        mappedTopics.unshift({value: 'all', name: 'any subject'});
        var topicsDropDown = () => {
            if (mappedTopics.length > 1)
            {
                return (
                    <CQDropdown
                        selected={this.state.categorySelected}
                        values={mappedTopics}
                        onChange={this.handleChange}/>
                );
            }
        };

        return (
            <div className='cq-quizfilter'>


                <div className="cq-quizfilter__context">

                    {/*<div className="cq-quizfilter__search form-inline">
                        <div className="form-group">
                            <div className="input-group">

                                <span className="input-group-addon">
                                    <i className="fa fa-search"></i>
                                </span>
                                <input type="text" className="form-control"
                                    onChange={this.handleSearch}
                                    value={this.state.searchString}/>
                            </div>
                        </div>
                    </div>*/}
                    {quizDropDown()}
                    {topicsDropDown()}

                </div>


            </div>
        );
    }

});

module.exports = CQviewQuizFilter;
