require('sylvester')

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

function StreamingMultipleRegression(options) {

  this.transposeOfXTimesX = new StreamingMatrixProduct({
    numRows: options.numIndependentVariables,
    numColumns: options.numIndependentVariables
  })

  this.transposeOfXTimesY = new StreamingMatrixProduct({
    numRows: options.numIndependentVariables,
    numColumns: options.numDependentVariables
  })
}

StreamingMultipleRegression.prototype.addObservation = function(options) {

  this.transposeOfXTimesX.addRowAndColumn({
    lhsColumn: options.independentVariables,
    rhsRow: options.independentVariables
  })

  this.transposeOfXTimesY.addRowAndColumn({
    lhsColumn: options.independentVariables,
    rhsRow: options.dependentVariables
  })

  delete this.coefficients
}

StreamingMultipleRegression.prototype.calculateCoefficients = function() {

  var xTx = $M(this.transposeOfXTimesX.product)
    , xTy = $M(this.transposeOfXTimesY.product)

  return this.coefficients = xTx.inverse().multiply(xTy).elements
}

// Hypothesize a particular row of dependent variables
// from a row of independent variables.
// Lazily recalculate coefficients if necessary.
StreamingMultipleRegression.prototype.hypothesize = function(options) {

  if(!this.coefficients) this.calculateCoefficients()

  var hypothesis = []

  for(var x = 0; x < this.coefficients.length; x++) {

    var coefficientRow = this.coefficients[x]
    for(var y = 0; y < coefficientRow.length; y++) {

      hypothesis[y] = (hypothesis[y] || 0) +
        coefficientRow[y] * options.independentVariables[x]
    }
  }

  return hypothesis
}

exports.StreamingMatrixProduct = StreamingMatrixProduct
exports.StreamingMultipleRegression = StreamingMultipleRegression
