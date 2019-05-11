const React = require('react')
const PropTypes = require('prop-types')

const Figcaption = (props) => <figcaption>{props.children}</figcaption>

Figcaption.defaultProps = {
  children: []
}

Figcaption.propTypes = {
  children: PropTypes.array.isRequired,
}

module.exports = Figcaption