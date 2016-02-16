'use strict'

var test = require('tape')
var smr = require('./smr.js')
var numeric = require('numeric')
var multiply = smr.multiply
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

// https://github.com/omphalos/smr/issues/2
test("should regress 2 x's", function(t) {

  var regression2 = new smr.Regression({ numX: 2, numY: 1 })

  regression2.push({ x: [1/3,0.5], y: [2] })
  regression2.push({ x: [2/3,0.5], y: [3] })
  regression2.push({ x: [3/3,0.5], y: [4] })

  t.equals(
    JSON.stringify(round(regression2.calculateCoefficients())),
    JSON.stringify([[3],[2]]))

  t.end()
})

// https://github.com/omphalos/smr/issues/2
test("should regress 3 x's", function(t) {

  var regression1 = new smr.Regression({ numX: 3, numY: 1 })

  regression1.push({ x: [1/3,2,0.5], y: [2] })
  regression1.push({ x: [2/3,4,0.5], y: [3] })
  regression1.push({ x: [3/3,7,0.5], y: [4] })

  t.equals(
    JSON.stringify(round(regression1.calculateCoefficients())),
    JSON.stringify([[3],[0],[2]]))

  t.end()
})

// https://github.com/omphalos/smr/issues/2
test("should regress 4 x's", function(t) {

  var regression3 = new smr.Regression({ numX: 4, numY: 1 })

  regression3.push({ x: [1/3,2,0.5,8], y: [2] })
  regression3.push({ x: [2/3,4,0.5,3], y: [3] })
  regression3.push({ x: [3/3,7,0.5,2], y: [4] })
  regression3.push({ x: [4/3,7,0.5,2], y: [5] })

  t.equals(
    JSON.stringify(round(regression3.calculateCoefficients())),
    JSON.stringify([[3],[0],[2],[0]]))

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

  t.notEqual(
    JSON.stringify(newCoefficients),
    JSON.stringify(oldCoefficients))

  t.end()
})

function testMatrixProduct(t, lhs, rhs) {

  var numericProduct = numeric.dot(lhs, rhs)
  var product = multiply(lhs, rhs)

  var expected = JSON.stringify(numericProduct)
  var actual = JSON.stringify(product)

  t.equals(actual, expected)
}

function addObservations(streamingRegression, options) {
  for(var x = 0; x < options.x.length; x++)
    streamingRegression.addObservation({
      x: options.x[x],
      y: options.y[x]
    })
}

function round(coefficients) {
  var factor = 100000
  return coefficients.map(function(row) {
    return row.map(function(c) {
      return Math.round(c * factor) / factor
    })
  })
}

