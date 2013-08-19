StreamingMultipleRegression
===========================

This is an implementation of streaming multiple regression in JavaScript.  It's useful if you want to use JavaScript to run multiple regression in real-time or over very large datasets that won't fit into memory all at once.

# QuickStart

    var regression = new Regression({ numX: 2, numY: 1 })

    regression.addObservation({ x: [10, 11], y: [100] })
    regression.addObservation({ x: [9, 12], y: [99] })

    // The following returns [[5.285714285714221], [4.285714285714334]]:
    regression.calculateCoefficients()

    regression.addObservation({ x: [8, 15], y: [80] })

    // The following returns [[10.54874267998622], [-0.15811229762311996]]:
    regression.calculateCoefficients()

    // We can also calculate points on the hypothesis.
    //
    // The following returns: [ 10.23251808473998 ]
    // (Given x = [1, 2], we hypothesize y = 10.23251808473998.)
    regression.hypothesize({ x: [1, 2] })

# Formula

To calculate multiple regression, we use the following formula:

    (X' * X) ^ -1 * X' * Y

Where X is a matrix of independent variables, X' is its transpose, Y is a matrix of dependent variables, and ^-1 indicates taking the inverse.  For a deeper explanation of this formula, click [here](http://luna.cas.usf.edu/~mbrannic/files/regression/regma.htm).

# Mechanics

Internally, we incrementally calculate the two matrix products, X' * X and X' * Y, in a streaming fashion as new observations are added.  Whenever you request the coefficients, either through calculateCoefficients() or indirectly through hypothesize(), the library will find the inverse of the readily-available X' * X (using [sylvester](https://github.com/jcoglan/sylvester)) and multiply this by the readily-available X' * Y.

This we means we don't need to keep individual observations in memory, but only the lightweight products of X' * X and X' * Y.  For the first product X' * X, if we have 10 independent variables, then we only keep 10 * 10 = 100 cells in memory.  For the second product X' * Y, if we have 10 independent variables and 3 dependent variables, then we only keep 10 * 3 = 30 cells in memory.  Only a total of 10 * 10 + 10 * 3 = 40 matrix cells are kept in memory whether 200 observations have been iterated over or 2 trillion.

