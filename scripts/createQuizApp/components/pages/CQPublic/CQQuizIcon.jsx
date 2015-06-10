var React = require('react');
var kolor = require('kolor');
var colours = [
    '#E16EC3',
    '#D4434A',
    '#DB2432',
    '#EF8465',
    '#F48868',
    '#ED6327',
    '#D28D4A',
    '#85A543',
    '#61D4CA',
    '#1F8DCC',
    '#2C71E8',
    '#1253CD',
    '#7739E7',
    '#964EEF',
    '#7C31DE',
    '#AB3FC5',
    '#B422CA'
];



var CQQuizIcon = React.createClass({
    propTypes: {
        className: React.PropTypes.string,
        name: React.PropTypes.string,
        image: React.PropTypes.string
    },
    render: function() {
        var randomIndex, image;
        if (this.props.name){
            var n = this.props.name.toLowerCase();
            randomIndex = (n.charCodeAt(0) + 5 ) % colours.length;

        } else {
            randomIndex = Math.floor(Math.random() * colours.length);
        }
        console.log('te', this.props.image);

        var color = kolor(colours[randomIndex]);
        var style = {
            backgroundImage: `linear-gradient(${color.hex()}, ${color.lighten(-0.2).hex()})`
        };

        if (this.props.image){
            style.backgroundImage = `url(${this.props.image})`;
        } else {
            image = (<img src="/img/ui-create/icon_base.png" alt=""/>);
        }



        return (
            <div className={this.props.className} style={style}>
                {image}
            </div>
        );
    }

});

module.exports = CQQuizIcon;
