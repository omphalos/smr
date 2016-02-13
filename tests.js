'use strict'

var test = require('tape')
var smr = require('./smr.js')
var MatrixProduct = smr.MatrixProduct
var Regression = smr.Regression

test('should calculate product of 1x1 * 1x1', function(t) {
  testMatrixProduct(t, [[1]], [[2]])
  t.end()
})

test('should calculate product of 2x1 * 1x2', function(t) {
  testMatrixProduct(t, [[1,2]], [[3],[4]])
  t.end()
})

test('should calculate product of 2x2 * 2x2', function(t) {
  testMatrixProduct(t, [[1,2],[3,4]], [[5,6],[7,8]])
  t.end()
})

test('should calculate product of 2x3 * 3x2', function(t) {
  testMatrixProduct(t, [[1,2,3],[4,5,6]], [[7,8],[9,10],[11,12]])
  t.end()
})

test('should calculate streaming regression', function(t) {

  var x = [[1,2,3],[4,5,6],[7,8,9],[10,11,12]]
  var y = [[13,14],[15,16],[17,18],[19,20]]
  var options = { numX: 3, numY: 2 }
  var streamingRegression = new Regression(options)

  addObservations(streamingRegression, { x: x, y: y })

  var streamingCoefficients = streamingRegression.calculateCoefficients()
  var xTranspose = numeric.transpose(x)
  var xTransposeX = numeric.dot(xTranspose, x)
  var xTransposeY = numeric.dot(xTranspose, y)
  var pseudoInverse = numeric.echelonize(xTransposeX).I
  var numericResult = numeric.dot(pseudoInverse, xTransposeY)
  var expected = JSON.stringify(numericResult)
  var actual = JSON.stringify(streamingCoefficients)

  t.equals(actual, expected)
  t.end()
})

test('should construct hypothesis', function(t) {

  // This is a set of binary inputs with a bias and simple kernel:
  // [1, a, b, a*b] for all (a,b) in (0,0),(0,1),(1,0),(1,1)
  var x = [[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 0, 0], [1, 1, 1, 1]]

  // The first column is XOR, the second is NAND
  var y = [[1, 1], [0, 1], [0, 1], [1, 0]]

  var regression = new Regression({ numX: 4, numY: 1 })

  addObservations(regression, { x: x, y: y })

  var h00 = regression.hypothesize({ x: [1,0,0,0] })
  var h01 = regression.hypothesize({ x: [1,0,1,0] })
  var h10 = regression.hypothesize({ x: [1,1,0,0] })
  var h11 = regression.hypothesize({ x: [1,1,1,1] })

  t.ok(JSON.stringify(h00), JSON.stringify([1,1]))
  t.ok(JSON.stringify(h01), JSON.stringify([0,1]))
  t.ok(JSON.stringify(h10), JSON.stringify([0,1]))
  t.ok(JSON.stringify(h11), JSON.stringify([1,0]))

  t.end()
})

test('should calculate coefficients', function(t) {

  // This is a XOR with a bias and simple kernel:
  // [1, a, b, a * b] for all a,b in (0,0),(0,1),(1,0),(1,1)
  var x = [[1, 0, 0, 0], [1, 0, 1, 0], [1, 1, 0, 0], [1, 1, 1, 1]]
  var y = [[1],[0],[0],[1]]
  var regression = new Regression({ numX: 4, numY: 1 })

  addObservations(regression, { x: x, y: y })

  var coefficients = regression.calculateCoefficients()

  t.equals(
    JSON.stringify(coefficients),
    JSON.stringify([[1],[-1],[-1],[2]]))

  t.end()
})

test('should discard old coefficients', function(t) {

  var regression = new Regression({ numX: 1, numY: 1 })

  regression.addObservation({ y: [1], x: [1] })
  var oldCoefficients = regression.calculateCoefficients()

  regression.addObservation({ y: [0], x: [1] })
  var newCoefficients = regression.calculateCoefficients()

  t.ok(JSON.stringify(newCoefficients) !== JSON.stringify(oldCoefficients))
  t.end()
})

// Test for issue in numericjs library.
/* test('should regress underdetermined system', function(t) {

  var reg = new Regression({ numX: 2, numY: 1})
  reg.push({ x: [1, 2], y: [3] })

  var coefficients = reg.calculateCoefficients()
  var firstCoefficient = coefficients[0][0]

  t.ok(!isNaN(firstCoefficient))
  t.end()
}) */

function testMatrixProduct(t, lhs, rhs) {

  var numericProduct = numeric.dot(lhs, rhs)
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

  var expected = JSON.stringify(numericProduct)
  var actual = JSON.stringify(streamingProduct.product)

  t.equals(actual, expected)
}

function addObservations(streamingRegression, options) {
  for(var x = 0; x < options.x.length; x++)
    streamingRegression.addObservation({
      x: options.x[x],
      y: options.y[x]
    })
}
