smr
===

This is an implementation of multiple regression in JavaScript.  It is streaming, which means that you can incrementally add observations and recalculate coefficients on the fly, without having to re-iterate over your dataset.  This is particularly useful if you want to run multiple regression in real-time or over very large datasets that won't fit into memory all at once.

# Quick Start

From Node.js:

    npm install smr
    node

Then:

    var Regression = require('smr').Regression

In the browser:

    <script src="http://www.numericjs.com/lib/numeric-1.2.6.js"></script>
    <script src="https://raw.github.com/omphalos/smr.js"></script>

# Example

    var regression = new Regression({ numX: 2, numY: 1 })

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

Internally, we incrementally calculate the two matrix products, X' * X and X' * Y, in an incremental fashion as new observations are added.  Whenever you request the coefficients, either through calculateCoefficients() or indirectly through hypothesize(), the library will find the pseudoinverse of the readily-available X' * X (using [numericjs](http://www.numericjs.com/)) and multiply this by the readily-available X' * Y.

For solving large-dimensional problems is real-time, the lazy pseudoinverse calculation can be a bottleneck, but it's good enough in most cases.

# Unit Tests

Calculations are verified against [numericjs](http://www.numericjs.com/).  The unit tests use [nodeunit](https://github.com/caolan/nodeunit).  You can set everything up with:

    git clone https://github.com/omphalos/smr
    cd smr
    npm install
    npm install -g nodeunit

Then you can run unit tests with:

    nodeunit tests.js
