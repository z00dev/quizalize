var React = require('react');
var AppActions = require('createQuizApp/actions/AppActions');
var CQQuizIcon = require('createQuizApp/components/utils/CQQuizIcon');


var CQViewAppGrid = React.createClass({

    propTypes: {
        className: React.PropTypes.string,
        apps: React.PropTypes.array,
        editMode: React.PropTypes.bool
    },

    getDefaultProps: function() {
        return {
            apps: [],
            editMode: false
        };
    },

    handleDelete: function(app){
        AppActions.deleteApp(app);
    },


    render: function() {

        var profilePicture = function(picture){
            return {
                backgroundImage: `url(http://www.gravatar.com/avatar/${picture}?s=220&d=identicon)`
            };
        };


        var deleteButton = function(){};

        if (this.props.editMode){
            deleteButton = (app) =>{
                return (
                    <button className="btn btn-danger" onClick={this.handleDelete.bind(this, app)}>
                        Delete
                    </button>
                );
            };
        }

        return (
            <ul className={`cq-appgrid  ${this.props.className}`}>
                {this.props.apps.map((app, key) => {
                    return (
                        <li className="cq-appgrid__app" key={key}>
                            <CQQuizIcon className="cq-appgrid__appicon" name={app.meta.name} image={app.meta.iconURL}/>

                            <div className="cq-appgrid__appdetails">
                                <div className="cq-appgrid__appname">{app.meta.name}</div>
                            </div>
                            {deleteButton(app)}
                        </li>
                    );
                })}
            </ul>
        );
    }

});

module.exports = CQViewAppGrid;