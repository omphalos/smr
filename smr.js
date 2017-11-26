'use strict'

var rref = require('rref')

function MatrixProduct(options) {
  this.product = squareMatrix(options)
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

  this.identity = identity(options.numX)
}

Regression.prototype.addObservation = function(options) {

  if(!options)
    throw new Error('missing options')

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
  var inv = inverse(xTx, this.identity)
  this.coefficients = multiply(inv, xTy)
  return this.coefficients
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

exports.MatrixProduct = MatrixProduct
exports.Regression = Regression
exports.multiply = multiply

function inverse(matrix, identity) {
  var size = matrix.length
  var result = new Array(size)
  for(var i = 0; i < size; i++)
    result[i] = matrix[i].concat(identity[i])
  result = rref(result)
  for(var i = 0; i < size; i++) result[i].splice(0, size)
  return result
}

function identity(size) {
  var matrix = squareMatrix({ numRows: size, numColumns: size })
  for(var i = 0; i < size; i++) matrix[i][i] = 1
  return matrix
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

function squareMatrix(options) {
  var matrix = new Array(options.numRows)
  for(var r = 0; r < options.numRows; r++) {
    var row = new Array(options.numColumns)
    matrix[r] = row
    for(var c = 0; c < options.numColumns; c++) {
      row[c] = 0
    }
  }
  return matrix
}
