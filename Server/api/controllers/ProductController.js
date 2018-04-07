var mongoose = require('mongoose');
var Validations = require('../utils/validators/is-object-id');
var Product = mongoose.model('Product');
var ProductRequest = mongoose.model('ProductRequest');

module.exports.getNumberOfProducts = function (req, res, next) {
    var toFind = JSON.parse(req.params.limiters);
    var limiters = {};
    if (toFind.price) {
        limiters.price = { $lt: toFind.price };
    }
    if (toFind.name) {
        limiters.name = toFind.name;
    }
    if (toFind.seller) {
        limiters.seller = toFind.seller;
    }
    Product.find(limiters).count().
        exec(function (err, count) {
            if (err) {
                return next(err);
            }

            return res.status(200).json({
                data: count,
                err: null,
                msg: 'Number of products = ' + count
            });
        });
};

module.exports.getMarketPage = function (req, res, next) {
    var toFind = JSON.parse(req.params.limiters);
    var limiters = {};
    if (toFind.price) {
        limiters.price = { $lt: toFind.price };
    }
    if (toFind.name) {
        limiters.name = toFind.name;
    }
    if (toFind.seller) {
        limiters.seller = toFind.seller;
    }
    Product.paginate(
        limiters,
        {
            limit: Number(req.params.entriesPerPage),
            page: Number(req.params.pageNumber)
        }, function (err, products) {
            if (err) {
                return next(err);
            }
            console.log(products);
            res.status(200).json({
                data: products,
                err: null,
                msg: 'products retrieved successfully'
            });
        }
    );
};

module.exports.getProduct = function (req, res, next) {
    if (!Validations.isObjectId(req.params.productId)) {
        return res.status(422).json({
            data: null,
            err: 'productId parameter must be a valid ObjectId.',
            msg: null
        });
    }
    Product.findById(req.params.productId).exec(function (err, product) {
        if (err) {
            return next(err);
        }
        if (!product) {
            return res.status(404).json({
                data: null,
                err: 'Product not found.',
                msg: null
            });
        }
        res.status(200).json({
            data: product,
            err: null,
            msg: 'Product retrieved successfully.'
        });
    });
};

// Get the psychologist requests in the database
module.exports.getRequests = function (req, res, next) {
    ProductRequest.find({}).exec(function (err, requests) {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            data: requests,
            err: null,
            msg: 'Requests retrieved successfully.'
        });
    });
};

// createproduct
module.exports.createProduct = function (req, res, next) {
    if (!(typeof req.body.name === 'string')) {
        console.log('please insert product name as a string');
    }
    var valid =
        req.body.name &&
        req.body.price &&
        req.body.acquiringType &&
        req.body.image &&
        req.body.description;
    if (!valid) {
        return res.status(422).json({
            data: null,
            err: null,
            msg: 'name, price, and acquiringType, and image, and description, are required fields.'
        });
    }

    Product.create(req.body, function (err, product) {

        if (err) {
            return next(err);
        }
        res.status(201).json({
            data: product,
            err: null,
            msg: 'Product was created successfully.'
        });
    });
};
//createproduct end

//createProductRequest start
module.exports.createProductRequest = function (req, res, next) {
    ProductRequest.create(req.body, function (err, productreq) {
        if (err) {
            return next(err);
        }
        res.status(200).json({
            data: productreq,
            err: null,
            msg: 'ProductRequest was created successfully.'
        });
    });
};
//createProductRequest end


module.exports.evaluateRequest = function (req, res, next) {
    if (req.body.result) {
        var newProduct = {};

        // Ensure the request still exists
        ProductRequest.findById(req.body._id).exec(function (err, productReq) {
            if (err) {
                return next(err);
            }
            if (!productReq) {
                return res.status(404).json({
                    data: null,
                    err: null,
                    msg: 'Request not found.'
                });
            }
            // If found, make the newProduct to insert
            newProduct = {
                acquiringType: req.body.acquiringType,
                createdAt: req.body.createdAt,
                description: req.body.description,
                image: req.body.image,
                name: req.body.name,
                price: req.body.price,
                rentPeriod: req.body.rentPeriod,
                seller: req.body.seller
            };
            // Delete the request
            ProductRequest.deleteOne({ _id: req.body._id }, function (error) {
                if (error) {
                    return next(error);
                }
                // Insert the product
                Product.create(newProduct, function (error1) {
                    if (error1) {
                        return next(error1);
                    }
                    res.status(201).json({
                        data: newProduct,
                        err: null,
                        msg: 'Request accepted and product added to database.'
                    });
                });
            });
        });
    } else {
        // Simply delete the request and notify the user
        ProductRequest.findByIdAndRemove(req.body._id, function (err, product) {
            if (err) {
                return next(err);
            }
            // TODO Notify user

            // When done, send response
            return res.status(200).json({
                data: product,
                err: null,
                msg: 'Request rejected and user notified.'
            });
        });
    }
};
