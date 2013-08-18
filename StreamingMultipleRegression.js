var StreamingMatrixProduct = require('./StreamingMatrixProduct.js')
require('sylvester')

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

module.exports = StreamingMultipleRegression
