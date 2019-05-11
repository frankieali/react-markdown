const React = require('react')
const PropTypes = require('prop-types')

const Figure = (props) => <figure>{props.children}</figure>

Figure.defaultProps = {
  children: []
}

Figure.propTypes = {
  children: PropTypes.array.isRequired,
}

module.exports = Figure