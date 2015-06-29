var React = require('react');

var CQLink = require('createQuizApp/components/utils/CQLink');


var CQViewQuizAuthor = React.createClass({

    propTypes: {
        author: React.PropTypes.object.isRequired
    },

    render: function() {
        return (
            <span className="cq-viewquizlist__quizauthor">
                <CQLink href={`/quiz/user/${this.props.author.uuid}`} stopPropagation={true}>

                    by <b>{this.props.author.name}</b>
                </CQLink>
            </span>
        );
    }

});

module.exports = CQViewQuizAuthor;
