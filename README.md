smr
===

This is an implementation of multiple regression in JavaScript.  It is mostly incremental --  you can incrementally add observations and the coefficient calculation will still be quick for lower-dimensional problems.  This is particularly useful if you want to run multiple regression in real-time or over very large datasets that won't fit into memory all at once.

# Quick Start

From Node.js:

    npm install smr
    node

    var smr = require('smr')

In the browser:

    <script src="http://www.numericjs.com/lib/numeric-1.2.6.js"></script>
    <script src="https://raw.github.com/omphalos/smr.js"></script>

# Example

    var regression = new smr.Regression({ numX: 2, numY: 1 })

    regression.push({ x: [10, 11], y: [100] })
    regression.push({ x: [9, 12], y: [99] })

    regression.calculateCoefficients() // Returns [[4.29], [5.29]]

    regression.push({ x: [8, 15], y: [80] })
    regression.calculateCoefficients() // Returns [[-0.16], [10.55]]
    regression.hypothesize({ x: [1, 2] }) // Returns [20.93]

# Formula

To calculate multiple regression, we use the following formula:

    (X' * X) ^ -1 * X' * Y

Where X is a matrix of independent variables, X' is its transpose, Y is a matrix of dependent variables, and ^ -1 indicates taking the pseudoinverse.

# Mechanics

Internally, we incrementally calculate the two matrix products, X' * X and X' * Y, as new observations are added.  Whenever you request the coefficients, either through calculateCoefficients() or indirectly through hypothesize(), the library will find the pseudoinverse of the readily-available X' * X (using [numericjs](http://www.numericjs.com/)) and multiply this by the readily-available X' * Y.

# Tests

Calculations are verified against [numericjs](http://www.numericjs.com/).  The unit tests use [nodeunit](https://github.com/caolan/nodeunit).  You can set everything up with:

    git clone https://github.com/omphalos/smr
    cd smr
    npm install
    npm install -g nodeunit

Then you can run unit tests with:

    nodeunit tests.js

You can run a simple performance test with:

    node ./performance.js 500

This will show the performance with a harder (500-dimensional) problem.  The bottleneck with higher-dimensional problems is the pseudoinverse calculation, which is something like N^3.  As an example, on a test machine, 500 dimensions takes over 11 seconds, whereas a 200-dimensional problems takes ~100 milliseconds.
