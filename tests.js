var numeric = require('numeric')
  , smr = require('./smr.js')
  , MatrixProduct = smr.MatrixProduct
  , Regression = smr.Regression

exports['should calculate product of 1x1 * 1x1'] = function(test) {
  testMatrixProduct(test, [[1]], [[2]])
  test.done()
}

exports['should calculate product of 2x1 * 1x2'] = function(test) {
  testMatrixProduct(test, [[1,2]], [[3],[4]])
  test.done()
}

exports['should calculate product of 2x2 * 2x2'] = function(test) {
  testMatrixProduct(test, [[1,2],[3,4]], [[5,6],[7,8]])
  test.done()
}

exports['should calculate product of 2x3 * 3x2'] = function(test) {
  testMatrixProduct(test, [[1,2,3],[4,5,6]], [[7,8],[9,10],[11,12]])
  test.done()
}

function testMatrixProduct(test, lhs, rhs) {

  var numericProduct = numeric.dot(lhs, rhs)
    , options = { numRows: lhs.length, numColumns: rhs[0].length }
    , streamingProduct = new MatrixProduct(options)

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
    , actual = JSON.stringify(streamingProduct.product)

  test.equals(actual, expected)
}

exports['should calculate streaming regression'] = function(test) {

  var x = [[1,2,3],[4,5,6],[7,8,9],[10,11,12]]
    , y = [[13,14],[15,16],[17,18],[19,20]]
    , options = { numX: 3, numY: 2 }
    , streamingRegression = new Regression(options)

  addObservations(streamingRegression, { x: x, y: y })

  var streamingCoefficients = streamingRegression.calculateCoefficients()
    , xTranspose = numeric.transpose(x)
    , xTransposeX = numeric.dot(xTranspose, x)
    , xTransposeY = numeric.dot(xTranspose, y)
    , pseudoInverse = numeric.echelonize(xTransposeX).I
    , numericResult = numeric.dot(pseudoInverse, xTransposeY)
    , expected = JSON.stringify(numericResult)
    , actual = JSON.stringify(streamingCoefficients)

  test.equals(actual, expected)
  test.done()
}

exports['should construct hypothesis'] = function(test) {

  // This is a set of binary inputs with a bias and simple kernel:
  // [1,a,b,a*b] for all (a,b) in (0,0),(0,1),(1,0),(1,1)
  var x = [
    [1,0,0,0],
    [1,0,1,0],
    [1,1,0,0],
    [1,1,1,1]
  ]

  var y = [ // The first column is XOR, the second is NAND
    [1,1],
    [0,1],
    [0,1],
    [1,0]
  ]

  var regression = new Regression({ numX: 4, numY: 1 })

  addObservations(regression, { x: x, y: y })

  var h00 = regression.hypothesize({ x: [1,0,0,0] })
    , h01 = regression.hypothesize({ x: [1,0,1,0] })
    , h10 = regression.hypothesize({ x: [1,1,0,0] })
    , h11 = regression.hypothesize({ x: [1,1,1,1] })

  test.ok(JSON.stringify(h00), JSON.stringify([1,1]))
  test.ok(JSON.stringify(h01), JSON.stringify([0,1]))
  test.ok(JSON.stringify(h10), JSON.stringify([0,1]))
  test.ok(JSON.stringify(h11), JSON.stringify([1,0]))

  test.done()
}

exports['should calculate coefficients'] = function(test) {

  // This is a XOR with a bias and simple kernel:
  // [1,a,b,a*b] for all a,b in (0,0),(0,1),(1,0),(1,1)
  var x = [
    [1,0,0,0],
    [1,0,1,0],
    [1,1,0,0],
    [1,1,1,1]
  ]

  var y = [[1],[0],[0],[1]]
    , regression = new Regression({ numX: 4, numY: 1 })

  addObservations(regression, { x: x, y: y })

  var coefficients = regression.calculateCoefficients()

  test.equals(
    JSON.stringify(coefficients),
    JSON.stringify([[1],[-1],[-1],[2]]))

  test.done()
}

exports['should discard old coefficients'] = function(test) {

  var regression = new Regression({ numX: 1, numY: 1 })

  regression.addObservation({ y: [1], x: [1] })
  var oldCoefficients = regression.calculateCoefficients()

  regression.addObservation({ y: [0], x: [1] })
  var newCoefficients = regression.calculateCoefficients()

  test.ok(JSON.stringify(newCoefficients) !== JSON.stringify(oldCoefficients))
  test.done()
}

function addObservations(streamingRegression, options) {

  for(var x = 0; x < options.x.length; x++)
    streamingRegression.addObservation({
      x: options.x[x], 
      y: options.y[x] 
    })
}

// Test for issue in numericjs library.
exports['should regress underdetermined system'] = function(test) {

  var reg = new Regression({ numX: 2, numY: 1})
  reg.push({ x: [1, 2], y: [3] })

  var coefficients = reg.calculateCoefficients()
    , firstCoefficient = coefficients[0][0]
    , isNaN = Number.isNaN(firstCoefficient)

  test.ok(!isNaN)
  test.done()
}
