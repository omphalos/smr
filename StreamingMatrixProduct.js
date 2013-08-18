function StreamingMatrixProduct(options) {

  this.product = []

  for(var r = 0; r < options.numRows; r++) {

    var row = []
    this.product.push(row)

    for(var c = 0; c < options.numColumns; c++)
      row.push(0)
  }
}

StreamingMatrixProduct.prototype.addRowAndColumn = function(options) {

  for(var c = 0; c < options.lhsColumn.length; c++)
    for(var r = 0; r < options.rhsRow.length; r++)
      this.product[c][r] += options.lhsColumn[c] * options.rhsRow[r]
}

module.exports = StreamingMatrixProduct

