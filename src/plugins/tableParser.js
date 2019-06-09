const tab = '\t';
const lineFeed = '\n';
const space = ' ';
const backslash = '\\';
const graveAccent = '`';
const verticalBar = '|';

const minColumns = 1;
const minRows = 2;

//TODO: settings?
function multimdTablePlugin() {
  
  function parseTable(eat, value, silent) {
    const self = this;
    
    // Exit when not in gfm-mode.
    if (!self.options.gfm) {
      return
    }
    
    const now = eat.now();
    const valueLength = value.length + 1;
    let index = 0;
    let lineCount = 0; // is this variable needed? can we use lines.length
    let lines = [];
    let rows = [];
    let rowTypes = [];
    let align = [];
    let tableCaption = null;
    let headerRowsCount;
    let tbodyRowsCount = 0;
    let footerRowsCount;
    let tbodyGroupsCount = 1;
    
    // this loop will gleen the table structure
    while (index < valueLength) {
      const pipeIndex = value.indexOf(verticalBar, index + 1)
      let lineIndex = value.indexOf(lineFeed, index)
      
      const line = value.slice(index, lineIndex);
      
      if (lineIndex === -1) {
        lineIndex = value.length
      }

      // no pipe in this value or pipe comes after linefeed so it should not be processed as a block
      if (pipeIndex === -1 || pipeIndex > lineIndex) {
        
        // add the remaining row count to either the footer (if it exists) or the tbody
        if (footerRowsCount >= 0) {
          footerRowsCount = footerRowsCount + rows.length;
          for (let i = 0; i < footerRowsCount; i++) rowTypes.push('footerRow');
        } else {
          tbodyRowsCount = tbodyRowsCount + rows.length;
          for (let i = 0; i < tbodyRowsCount; i++) rowTypes.push('bodyRow');
        }

        // check if the line is a caption line following the table e.g.: [Caption Text]
        if(/^\[.*\]$/.test(line)) {
          tableCaption = line;
          rowTypes.push('captionRow');
          lines.push(line)
          lineCount++
        }

        if (lineCount < minRows) {
          // console.log("NOT A TABLE");
          return
        }
        break
      }

      // check if this is a header/footer seperator row and not an empty row (e.g.: just pipes and spaces)
      if(/^([|\-:\s+])*$/.test(line) && !/^[|\s+]*$/.test(line)) {
        
        if (headerRowsCount) {
          if(footerRowsCount >= 0) {
            // if footer already exists then add the rows from this group in. There can be only one footer
            footerRowsCount = footerRowsCount + rows.length
          } else {
            // dump collected rows into tbody
            tbodyRowsCount = tbodyRowsCount + rows.length;
            for (let i = 0; i < rows.length; i++) rowTypes.push('bodyRow');
            rowTypes.push('seperatorRow');
            // create footer count - notice we do not save the current row since it's a seperator
            footerRowsCount = 0;
          }
        } else {
          // create header group - notice we do not save the current row since it's a seperator
          headerRowsCount = rows.length
          for (let i = 0; i < headerRowsCount; i++) rowTypes.push('headerRow');
          rowTypes.push('seperatorRow');

          const alignCols = line.split('|').map(s => s.trim()).filter(Boolean);
          // console.log("alignCols:", alignCols)
          alignCols.map(val => {
            if(/^-*$/.test(val)){
              align.push(null)
            } else if(/^:-*$/.test(val)){
              align.push('left')
            } else if(/^:-*:$/.test(val)) {
              align.push('center')
            } else if(/^-*:$/.test(val)) {
              align.push('right')
            } else {
              align.push(null)
            }
          });
        }
        rows = [];
      } 
      // test for tbody seperator
      else if(/^([|=])*$/.test(line)) {
        tbodyGroupsCount++;
        tbodyRowsCount = tbodyRowsCount + rows.length;
        for (let i = 0; i < rows.length; i++) rowTypes.push('bodyRow');
        rowTypes.push('seperatorRow');
        rows = []
      } 
      else if(/^[|\s+]*$/.test(line)) {
        console.log("empty row");
      } 
      else {
        // collect the lines to be grouped into thead, tbody, and tfoot groups
        rows.push(line);
      }
      
      lines.push(line)
      lineCount++
      index = lineIndex + 1
    } // end: while loop

    // console.log("lines",lines)
    
    //eat the table
    table = eat(lines.join(lineFeed)).reset({type: 'table', children: []})

    // Attach the table structure to the table for use in rendering
    table.tableStructure = {
      headerRowsCount,
      tbodyRowsCount,
      tbodyGroupsCount,
      footerRowsCount,
      tableCaption: tableCaption && 1,
      align
    }
    
    let position = -1
    let tbodyGroup = 1;
    
    while (++position < lineCount) {
      const line = lines[position];
      const rowType = rowTypes[position] || 'row';
      let row;

      // Eat a newline character when this is not the first row.
      if (position) {
        eat(lineFeed)
      }
      
      // tbody seperator e.g.: |===|
      if(/^([|=])*$/.test(line)) {
        // increment the tbody group count
        tbodyGroup++
      }
      
      // add rowType attribute determined above
      if(rowType === 'bodyRow') {
        // add tbodyGroup if this is a bodyRow
        row = {type: 'tableRow', rowType, tbodyGroup, children: []}
      } else {
        row = {type: 'tableRow', rowType, children: []}
      }
      
      // Eat the row.
      if(rowType === 'seperatorRow'){
        // eat the seperator and move on to the next line
        eat(line)
        continue
      } else {
        eat(line).reset(row, table)
      }
      
      // Prepare to parse and eat table cells
      const lineLength = line.length + 1
      index = 0
      let queue = ''
      let cell = ''
      let preamble = true
      let count = null
      let opening = null
      let rowspan = false
      
      while (index < lineLength) {
        const character = line.charAt(index)
        
        if (character === tab || character === space || (character === '+' && line.charAt(index + 1) === verticalBar)) {
          if(character === '+') {
            rowspan = true;
          }
          if (cell) {
            queue += character
          } else {
            eat(character)
          }
          
          index++
          continue
        }
        
        if (character === '' || character === verticalBar) {
          if (preamble) {
            eat(character)
          } else {
            if (character && opening) {
              queue += character
              index++
              continue
            }
            
            if ((cell || character) && !preamble) {
              let subvalue = cell
              
              if (queue.length > 1) {
                if (character) {
                  subvalue += queue.slice(0, queue.length - 1)
                  queue = queue.charAt(queue.length - 1)
                } else {
                  subvalue += queue
                  queue = ''
                }
              }
              
              if(rowType === 'captionRow') {
                eat(subvalue)({type: 'text', children: self.tokenizeInline(cell.slice(1,-1), now)}, row)
              } else {
                eat(subvalue)({type: 'tableCell', children: self.tokenizeInline(cell, now), rowspan}, row)
              }
            }
            
            eat(queue + character)
            
            queue = ''
            cell = ''
            rowspan = false
          }
        } else {
          if (queue) {
            cell += queue
            queue = ''
          }
          
          cell += character
          
          if (character === backslash && index !== length - 2) {
            cell += line.charAt(index + 1)
            index++
          }
          
          if (character === graveAccent) {
            count = 1
            
            while (line.charAt(index + 1) === character) {
              cell += character
              index++
              count++
            }
            
            if (!opening) {
              opening = count
            } else if (count >= opening) {
              opening = 0
            }
          }
        }
        
        preamble = false
        index++
      }
    } // end: while loop
    

    // TODO: ensure/validate that rows are not crossing over thead, tbody and tfoot groups

    let reverseRowChildren = table.children.slice().reverse();
    // deep copy
    // let reverseRowChildren = JSON.parse(JSON.stringify(table.children.slice().reverse()));
    let rowSpanCount = [];

    reverseRowChildren.map(row => {
      let colSpanCount = 0;
      let i = row.children.length;
      while(i--) {
        let cell = row.children[i];
        // set the alignment for this cell based on header seperator 
        if(align.length > 0 && align[i] !== null) {
          cell.align = align[i]
        }

        // if there are no children in this cell - it is empty
        if(cell.children.length === 0) {
        // count the number of empty cells as we walk backwards
          colSpanCount++

          // if this cell is marked as a rowspan
          if (cell.rowspan === true) {
            // increment the rowspan count
            rowSpanCount[i] = rowSpanCount[i] + 1 || 1
            // toss the colSpanCount - it will be recalculated in the sibling rows
            colSpanCount = 0;
            // toss this cell
            row.children.splice(i,1);
          }
          // if not a rowspan and not the first cell in the table
          else if(cell.rowspan === false && i !== 0) {
            // toss this cell - it's just an empty cell that will be merged
            row.children.splice(i,1);
          }
        } else { // there is content in this cell, it will need colspan and/or rowspan attributes
          // has rowspan
          if (cell.rowspan === true) {
            // add rowspan attribute to current cell
            cell.rowspan = rowSpanCount[i] + 1
          }
          // set the count to zero for next row iteration
          rowSpanCount[i] = 0;

          // has colspan
          if(colSpanCount) {
            // add colspan attribute to current cell
            cell.colspan = colSpanCount + 1;
            // set the count to zero for next cell iteration
            colSpanCount = 0;
          }
        }
      }

    });

    console.log("table", table)

    return table
  }

  const Parser = this.Parser
  const tokenizers = Parser.prototype.blockTokenizers
  const methods = Parser.prototype.blockMethods
  
  tokenizers.multimdTable = parseTable;
  
  // Replace 'table' with 'multiTable'
  methods.splice(methods.indexOf('table'), 1, 'multimdTable')
}

module.exports = multimdTablePlugin