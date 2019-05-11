const React = require('react')
const PropTypes = require('prop-types')

const Section = (props) => <section>{props.children}</section>

Section.defaultProps = {
  children: []
}

Section.propTypes = {
  children: PropTypes.array.isRequired,
}

module.exports = Section