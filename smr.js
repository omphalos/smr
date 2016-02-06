(function(exports) {


  function has(obj, key) {
    return obj && obj.hasOwnProperty(key)
  }

  function isArray(obj) {
    return obj && (obj instanceof Array)
  }

  var numeric = this.numeric || require('numeric')

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

    if (!has(options, "numX"))
      throw new Error("You must give the width of the X dimension as the property numX")


    if (!has(options, "numY"))
      throw new Error("You must give the width of the X dimension as the property numY")

    
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

    if ((!has(options, "x")) || (!has(options, "y")))
      throw new Error("Observation must have x and y values")


    if ((!isArray(options.x)) || (!(isArray(options.y))))
      throw new Error("X and Y must be given as arrays")
    
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
      , xTy = this.transposeOfXTimesY.product
      , pseudoInverse = numeric.echelonize(xTx).I

    return this.coefficients = numeric.dot(pseudoInverse, xTy)
  }
  Regression.prototype.calculate = Regression.prototype.calculateCoefficients

  // Hypothesize a particular row of dependent variables
  // from a row of independent variables.
  // Lazily recalculate coefficients if necessary.
  Regression.prototype.hypothesize = function(options) {

    if(!this.coefficients) this.calculateCoefficients()


    if (!has(options, "x"))
      throw new Error("Value to hypothesize must have an 'x' field")
    
    if (!isArray(options.x))
      throw new Error("X value must be given as an array")

    
    var hypothesis = []

    for(var x = 0; x < this.coefficients.length; x++) {

      var coefficientRow = this.coefficients[x]
      for(var y = 0; y < coefficientRow.length; y++) {

        hypothesis[y] = (hypothesis[y] || 0) +
          coefficientRow[y] * options.x[x]
      }
    }

    return hypothesis
  }

  exports.MatrixProduct = MatrixProduct
  exports.Regression = Regression

})(typeof exports === 'undefined' ? (this.smr = (this.smr || {})) : exports)
