'use strict'

exports.MatrixProduct = MatrixProduct
exports.Regression = Regression
exports.multiply = multiply

var numeric = require('numeric')

function MatrixProduct(options) {

  this.product = []

  for(var r = 0; r < options.numRows; r++) {

    var row = []
    this.product.push(row)

    for(var c = 0; c < options.numColumns; c++)
      row.push(0)
  }
}

MatrixProduct.prototype.addRowAndColumn = function(options) {

  for(var c = 0; c < options.lhsColumn.length; c++)
    for(var r = 0; r < options.rhsRow.length; r++)
      this.product[c][r] += options.lhsColumn[c] * options.rhsRow[r]
}

MatrixProduct.prototype.push = MatrixProduct.prototype.addRowAndColumn

function Regression(options) {

  if(!options)
    throw new Error('missing options')

  if(!('numX' in options))
    throw new Error(
      'you must give the width of the X dimension as the property numX')


  if(!('numY' in options))
    throw new Error(
      'you must give the width of the X dimension as the property numY')

  this.transposeOfXTimesX = new MatrixProduct({
    numRows: options.numX,
    numColumns: options.numX
  })

  this.transposeOfXTimesY = new MatrixProduct({
    numRows: options.numX,
    numColumns: options.numY
  })
}

Regression.prototype.addObservation = function(options) {

  if(!(options.x instanceof Array) || !(options.y instanceof Array))
    throw new Error('x and y must be given as arrays')

  this.transposeOfXTimesX.addRowAndColumn({
    lhsColumn: options.x,
    rhsRow: options.x
  })

  this.transposeOfXTimesY.addRowAndColumn({
    lhsColumn: options.x,
    rhsRow: options.y
  })

  // Adding an observation invalidates our coefficients.
  delete this.coefficients
}

Regression.prototype.push = Regression.prototype.addObservation

Regression.prototype.calculateCoefficients = function() {
  var xTx = this.transposeOfXTimesX.product
  var xTy = this.transposeOfXTimesY.product
  var inv = numeric.inv(xTx)
  return this.coefficients = numeric.dot(inv, xTy)
}

Regression.prototype.calculate = Regression.prototype.calculateCoefficients

// Hypothesize a particular row of dependent variables
// from a row of independent variables.
// Lazily recalculate coefficients if necessary.
Regression.prototype.hypothesize = function(options) {

  if(!options)
    throw new Error('missing options')

  if(!(options.x instanceof Array))
    throw new Error('x property must be given as an array')

  if(!this.coefficients) this.calculateCoefficients()

  var hypothesis = []

  for(var x = 0; x < this.coefficients.length; x++) {
    var coefficientRow = this.coefficients[x]
    for(var y = 0; y < coefficientRow.length; y++)
      hypothesis[y] = (hypothesis[y] || 0) + coefficientRow[y] * options.x[x]
  }

  return hypothesis
}


function multiply(lhs, rhs) {

  var options = { numRows: lhs.length, numColumns: rhs[0].length }
  var streamingProduct = new MatrixProduct(options)

  for(var x = 0; x < rhs.length; x++) {

    var lhsColumn = []

    // Get the xth column of lhs.
    for(var r = 0; r < lhs.length; r++)
      lhsColumn.push(lhs[r][x])

    // Get the xth row of rhs.
    var rhsRow = rhs[x]

    streamingProduct.addRowAndColumn({
      lhsColumn: lhsColumn,
      rhsRow: rhsRow
    })
  }

  return streamingProduct.product
}