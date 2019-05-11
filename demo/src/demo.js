const React = require('react')
const ReactDOM = require('react-dom')
const Markdown = require('../../src/with-html')
const Editor = require('./editor')
const CodeBlock = require('./code-block')
const MarkdownControls = require('./markdown-controls')
const behead = require('remark-behead')
const remarkCaption = require('remark-captions')
const figure = require('./figure')
const figcaption = require('./figcaption')
const section = require('./section')
const linkifyRegex = require('remark-linkify-regex');
const sectionize = require('remark-sectionize');

const initialSource = `
# Live demo

Changes are automatically rendered as you type.

* Implements [GitHub Flavored Markdown](https://github.github.com/gfm/)
* Renders actual, "native" React DOM elements
* Allows you to escape or skip HTML (try toggling the checkboxes above)
* If you escape or skip the HTML, no \`dangerouslySetInnerHTML\` is used! Yay!

# HTML block below

<blockquote>
  This blockquote will change based on the HTML settings above.
</blockquote>

# How about some code?
\`\`\`js
var React = require('react');
var Markdown = require('react-markdown');

React.render(
  <Markdown source="# Your markdown here" />,
  document.getElementById('content')
);
\`\`\`

Pretty neat, eh?

# Tables?

| Feature   | Support |
| --------- | ------- |
| tables    | ✔ |
| alignment | ✔ |
| wewt      | ✔ |
Table: Table Caption

# Links

This is my friend: @6ilZq3kN0F

This is redundantly linked: [@6ilZq3kN0F](@6ilZq3kN0F)

cc [@alreadyLinked](@2RNGJafZt)


# Captions

> I don't think I'm made of SPAM. What would be a sign that I was?
Source: Frank Spam

![Markdown Logo](https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png "Logo Title Text 1")
Figure: Markdown Logo


## More info?

Read usage information and more on [GitHub](//github.com/rexxars/react-markdown)

---------------

A component by [Espen Hovlandsdal](https://espen.codes/)
`

class Demo extends React.PureComponent {
  constructor(props) {
    super(props)

    this.handleControlsChange = this.handleControlsChange.bind(this)
    this.handleMarkdownChange = this.handleMarkdownChange.bind(this)
    this.state = {
      markdownSrc: initialSource,
      htmlMode: 'raw'
    }
    this.linkify = linkifyRegex(/@[A-Za-z0-9]+\b/);
  }

  handleMarkdownChange(evt) {
    this.setState({markdownSrc: evt.target.value})
  }

  handleControlsChange(mode) {
    this.setState({htmlMode: mode})
  }

  render() {
    return (
      <div className="demo">
        <div className="editor-pane">
          <MarkdownControls onChange={this.handleControlsChange} mode={this.state.htmlMode} />

          <Editor value={this.state.markdownSrc} onChange={this.handleMarkdownChange} />
        </div>

        <div className="result-pane">
          <Markdown
            className="result"
            source={this.state.markdownSrc}
            skipHtml={this.state.htmlMode === 'skip'}
            escapeHtml={this.state.htmlMode === 'escape'}
            renderers={{code: CodeBlock, section, figure, figcaption }}
            plugins={[[behead, { after: 0, depth: 2 }],sectionize,remarkCaption,this.linkify]}
          />
        </div>
      </div>
    )
  }
}

if (typeof window !== 'undefined') {
  ReactDOM.render(<Demo />, document.getElementById('main'))
}

module.exports = Demo
