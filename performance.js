console.log('starting')

var smr = require('./smr.js')
  , dimensions = process.argv.reverse()[0] || 500
  , x1 = new Array(dimensions).map(function() { return Math.random() })
  , x2 = new Array(dimensions).map(function() { return Math.random() })
  , y1 = [Math.random()]
  , y2 = [Math.random()]
  , regression = new smr.Regression({ numX: dimensions, numY: 1 })

console.log('testing with ' + dimensions + ' dimensions')

console.log('pushing observation 1')
console.time('observation 1')
regression.push({ x: x1, y : y1 })
console.timeEnd('observation 1')

console.log('pushing observation 2')
console.time('observation 2')
regression.push({ x: x2, y : y2 })
console.timeEnd('observation 2')

console.log('calculating regression')
console.time('regression')

regression.calculateCoefficients()

console.timeEnd('regression')