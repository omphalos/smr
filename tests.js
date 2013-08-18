var StreamingMatrixProduct = require('./StreamingMatrixProduct.js')
  , StreamingMultipleRegression = require('./StreamingMultipleRegression.js')
  , sylvester = require('sylvester')

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

  var sylvesterLhs = $M(lhs)
    , sylvesterRhs = $M(rhs)
    , sylvesterProduct = sylvesterLhs.multiply(sylvesterRhs)
    , options = { numRows: lhs.length, numColumns: rhs[0].length }
    , streamingProduct = new StreamingMatrixProduct(options)

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

  var expected = JSON.stringify(sylvesterProduct.elements)
    , actual = JSON.stringify(streamingProduct.product)

  test.equals(actual, expected)
}

exports['should calculate streaming regression'] = function(test) {

  var x = [[1,2,3],[4,5,6],[7,8,9],[10,11,12]]
    , y = [[13,14],[15,16],[17,18],[19,20]]
    , options = { numIndependentVariables: 3, numDependentVariables: 2 }
    , streamingRegression = new StreamingMultipleRegression(options)

  addObservations(streamingRegression, {
    independentVariables: x,
    dependentVariables: y
  })

  var streamingCoefficients = streamingRegression.calculateCoefficients()

  var sylvesterResult =
    // See http://luna.cas.usf.edu/~mbrannic/files/regression/regma.htm  
    // (X' * X ) ^ -1 * (X' * Y)
    $M(x).transpose().multiply($M(x)).inverse().multiply(
    $M(x).transpose().multiply($M(y)))

  var expected = JSON.stringify(sylvesterResult.elements)
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

  var regression = new StreamingMultipleRegression({
    numIndependentVariables: 4,
    numDependentVariables: 1
  })

  addObservations(regression, {
    independentVariables: x,
    dependentVariables: y
  })

  var h00 = regression.hypothesize({ independentVariables: [1,0,0,0] })
    , h01 = regression.hypothesize({ independentVariables: [1,0,1,0] })
    , h10 = regression.hypothesize({ independentVariables: [1,1,0,0] })
    , h11 = regression.hypothesize({ independentVariables: [1,1,1,1] })

  test.ok(JSON.stringify(h00), JSON.stringify([1,1]))
  test.ok(JSON.stringify(h01), JSON.stringify([0,1]))
  test.ok(JSON.stringify(h10), JSON.stringify([0,1]))
  test.ok(JSON.stringify(h11), JSON.stringify([1,0]))

  test.done()
}

exports['should calculate coefficients'] = function(test) {

  // This is a XOR with a bias and cheap kernel trick:
  // [1,a,b,a*b] for all a,b in (0,0),(0,1),(1,0),(1,1)
  var x = [
    [1,0,0,0],
    [1,0,1,0],
    [1,1,0,0],
    [1,1,1,1]
  ]

  var y = [[1],[0],[0],[1]]

  var regression = new StreamingMultipleRegression({
    numIndependentVariables: 4,
    numDependentVariables: 1
  })

  addObservations(regression, {
    independentVariables: x,
    dependentVariables: y
  })

  var coefficients = regression.calculateCoefficients()

  test.equals(
    JSON.stringify(coefficients),
    JSON.stringify([[1],[-1],[-1],[2]]))

  test.done()
}

exports['should discard old coefficients'] = function(test) {

  var regression = new StreamingMultipleRegression({
    numIndependentVariables: 1,
    numDependentVariables: 1
  })

  regression.addObservation({
    dependentVariables: [1],
    independentVariables: [1]
  })
  var oldCoefficients = regression.calculateCoefficients()

  regression.addObservation({
    dependentVariables: [0],
    independentVariables: [1]
  })
  var newCoefficients = regression.calculateCoefficients()

  test.ok(JSON.stringify(newCoefficients) !== JSON.stringify(oldCoefficients))
  test.done()
}

function addObservations(streamingRegression, options) {

  for(var x = 0; x < options.independentVariables.length; x++)
    streamingRegression.addObservation({
      independentVariables: options.independentVariables[x], 
      dependentVariables: options.dependentVariables[x] 
    })
}

