StreamingMultipleRegression
===========================

This is an implementation of multiple regression in JavaScript.  It's useful if you want to use JavaScript to run multiple regression in real-time or  very large datasets that won't fit into memory all at once.

# QuickStart

    var regression = new StreamingMultipleRegression({
      numIndependentVariables: 2,
      numDependentVariables: 1
    })

    regression.addObservation({
      dependentVariables: [100],
      independentVariables: [10, 11]
    })

    regression.addObservation({
      independentVariables: [9, 12],
      dependentVariables: [99]
    })

    // The following returns [[5.285714285714221], [4.285714285714334]]:
    regression.calculateCoefficients()

    regression.addObservation({
      independentVariables: [8, 15],
      dependentVariables: [80]
    })

    // The following returns [[10.54874267998622], [-0.15811229762311996]]:
    regression.calculateCoefficients()

    // We can also calculate points on the hypothesis.
    // The following returns: [ 10.23251808473998 ]
    regression.hypothesize({ independentVariables: [1, 2] })

# Formula

To calculate multiple regression, we use the following formula:

    (X' * X)^-1 * X' * Y

Where X is a matrix of independent variables, X' is its transpose, Y is a matrix of dependent variables, and ^-1 indicates taking the inverse.  For a deeper explanation of this formula, click [here](http://luna.cas.usf.edu/~mbrannic/files/regression/regma.htm).

Now, along with the main function, StreamingMultipleRegression, the code contains StreamingMatrixProduct, which incrementally calculcates the product of two matrices from new observations.  StreamingMultipleRegression contains two instancs of StreamingMatrixProducts to incrementally calculate X' * X and X' * Y.  Whenever the user of the API requests the coefficients, either through calculateCoefficients() or through a lazily-created fashion with hypothesize(), StreamingMultipleRegression will find the inverse of X' * X and multiply this by X' * Y (both of which are readily available as they are streaming computations themselves).

The main feature of this algorithm is that we don't have to keep individual observations in memory, we only keep lightweight aggregations in the forms of their StreamingMatrixProducts.  For the first product X' * X, if we have 10 independent variables, then we only keep 10 * 10 = 100 cells in memory.  For the second product X' * Y, if we have 10 independent variables and 3 dependent variables, then we only keep 10 * 3 = 30 cells in memory.  Note that in either case the number of cells in our matrices are unrelated to the number of observations iterated over.  The object keeps a total of 10 * 10 + 10 * 3 = 40 cells in memory whether it's encountered 10 observations of a 10 trillion.

Because of the streaming nature of the computation, this algorithm is ideal for very large datasets and for multiple regression over unbounded, real-time datasets.

