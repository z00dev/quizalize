var React = require('react');
var TopicStore = require('createQuizApp/stores/TopicStore');
var QuizActions = require('createQuizApp/actions/QuizActions');

var CQviewQuizFilter = React.createClass({

    propTypes: {
        onSearchInput: React.PropTypes.func
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
        var topics = TopicStore.getPublicTopics();
        return {
            topics,
            searchString: '',
            categorySelected: 'all'
        };
    },

    handleSearch: function(ev){

        this.setState({
            searchString: ev.target.value
        }, this.performSearch);

    },

    handleChange: function(ev){

        this.setState({
            categorySelected: ev.target.value
        }, this.performSearch);

    },

    performSearch: function(){
        var category = this.state.categorySelected === 'all' ? undefined : this.state.categorySelected;
        console.log('searchign for', this.state.searchString, category);
        QuizActions.searchPublicQuizzes(this.state.searchString, category);
        
    },

    render: function() {
        return (
            <div className='cq-quizfilter'>
                <div className='col-md-1'>
                    Filter
                </div>
                <div className='col-md-2'>
                    Search by name:
                    <input type="text" value={this.state.searchString}
                        onChange={this.handleSearch}/>
                </div>
                <div className="col-md-2">
                    <select onChange={this.handleChange} value={this.state.categorySelected}>
                        <option value='all'>All</option>
                        {this.state.topics.map(topic=>{
                            return (
                                <option value={topic.uuid} key={topic.uuid}>{topic.name}</option>
                            );
                        })}
                    </select>

                </div>
            </div>
        );
    }

});

module.exports = CQviewQuizFilter;
