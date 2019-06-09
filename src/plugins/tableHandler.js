module.exports = table

var position = require('unist-util-position')
var wrap = require('mdast-util-to-hast/lib/wrap')
var all = require('mdast-util-to-hast/lib/all')

function table(h, node) {
  var rows = node.children
  var index = rows.length
  var align = node.align
  var alignLength = align && align.hasOwnProperty('length') ? align.length : 0
  var result = []
  var pos
  var row
  var out
  var name
  var cell
  var colspan
  var rowspan

  // console.log("Table Handler running!");

  // console.log("node",node);


  // return

  while (index--) {
    row = rows[index].children
    name = rows[index].rowType
    var cellType = name === 'headerRow' ? 'th' : 'td'
    pos = row.length
    out = []

    while (pos--) {
      cell = row[pos]
      // console.log("cell",cell)
      // align = align[pos] ? {align: align[pos]} : {}
      align = cell.align ? {style: `text-align:${cell.align}`} : {}
      colspan = cell.colspan ? {colspan: cell.colspan} : {}
      rowspan = cell.rowspan ? {rowspan: cell.rowspan} : {}
      // if(!cell.empty){
        // out[pos] = h(cell, name, {...align,...colspan}, cell ? all(h, cell) : [])
        if(name === 'captionRow'){
          continue
        }
        out[pos] = h(cell, cellType, {...colspan,...rowspan,...align}, cell ? all(h, cell) : [])
      // }
    }
    
    if(name === 'captionRow'){
      result[index] = h(rows[index], 'caption', all(h,rows[index].children[0]))
    } else {
      result[index] = h(rows[index], 'tr', {'data-group': rows[index].tbodyGroup}, out)
    }
  }

  // wrap thead
  // wrap tbodies
  // wrap tfooter
  // include caption
  var header = result.splice(0,node.tableStructure.headerRowsCount)
  var tableBody = result.splice(0,node.tableStructure.tbodyRowsCount)
  var footer = result.splice(0,node.tableStructure.footerRowsCount)
  var caption = result.splice(0,node.tableStructure.tableCaption)

  var thead = [], 
      tbody = [],
      tfoot = [],
      captionArray = caption.length > 0 ? [...caption] : [];

  if(header.length > 0) {
    thisHead = h({
        start: position.start(header[0]),
        end: position.end(header[header.length - 1])
      },
      'thead',
      header
    )

    thead.push(thisHead);
  }

  if(tableBody.length > 0) {
    let groups = [];

    tableBody.forEach((row) => {
      // console.log("row:", row)
      let groupIndex = row.properties['data-group'] - 1;
      // console.log(row.properties.group)
      if(groups[groupIndex] === undefined) {
        groups[groupIndex] = [];
      }
      groups[groupIndex].push(row);

    })

    groups.forEach((group) => {
      let thisGroup = h({
          start: position.start(group[0]),
          end: position.end(group[group.length - 1])
        },
        'tbody',
        group
      )
      tbody.push(thisGroup)
    })

  }
  if(footer.length > 0) {
    thisFoot = h({
          start: position.start(footer[0]),
          end: position.end(footer[footer.length - 1])
        },
        'tfoot',
        footer
      )
    tfoot.push(thisFoot)
  }

  // build the table
  let thisTable = h(
    node,
    'table',
      [
        ...captionArray,
        ...thead,
        ...tbody,
        ...tfoot
      ]
  )

  console.log("Table",thisTable)

  return thisTable
}