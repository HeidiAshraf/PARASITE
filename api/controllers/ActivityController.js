var mongoose = require('mongoose');
var Activity = mongoose.model('Activity');
var User = mongoose.model('User');
var moment = require('moment');
var NewsFeed = mongoose.model('Newsfeed');
var tagController = require('./TagController');
/* eslint max-statements: ["error", 20] */
/* eslint multiline-comment-style: ["error", "starred-block"] */
/* eslint-disable eqeqeq */

module.exports.getActivities = function (req, res, next) {

    /*
     *  Middleware for retrieving activities
     *
     *  Admin can retrieve all activities while other users
     *  can only retrieve verified activities
     *
     *  @author: Wessam
     */


    var user = req.user;

    var isAdmin = false;
    var status = req.query.status;

    if (user) {
        isAdmin = user.isAdmin;
    }

    var pageN = Number(req.query.page);
    var valid = pageN && !isNaN(pageN);
    if (!valid) {
        pageN = 1;
    }

    /*
     *  Filtering unverified activities
     *  for non Admin users
     *  TODO: adding activities created by the req.user
     */
    var filter = {};
    if (status) {
        filter.status = status;
    }

    if (!isAdmin) {
        filter.status = 'verified';
    }
    Activity.paginate(
        filter,
        {
            limit: 10,
            page: pageN,
            sort: '-createdAt'
        },
        function (err, activities) {
            if (err) {
                return next(err);
            }
            res.status(200).json({
                data: activities,
                err: null,
                msg: 'Activities retrieved successfully'
            });
        }, {
            columns: {},
            populate: ['creator'],
            sortBy: { createdAt: -1 }
        }
    );
};

module.exports.getActivity = function (req, res, next) {

    /*
     *  Middleware for retrieving an activity
     *
     *  @author: Wessam
     */

    var user = req.user;
    var activityId = req.params.activityId;

    var isAdmin = false;

    if (user) {
        isAdmin = user.isAdmin;
    }

    Activity.findById(activityId).
          populate({
               model: 'User',
               path: 'discussion.creatorInfo',
               select: 'avatar firstName lastName'
          }).
          populate({
            model: 'User',
            path: 'discussion.replies.creatorInfo',
            select: 'avatar firstName lastName'
          }).

  exec(function (err, activity) {
            if (err) {
                return next(err);
            }
            if (!activity) {
                return res.status(404).json({
                    data: null,
                    err: 'Activity doesn\'t exist',
                    msg: null
                });
            }
            var creatorName = activity.creator;

            if (activity.status !== 'verified') {

                if (!isAdmin && creatorName !== user.username) {
                    return res.status(403).json({
                        data: null,
                        err: 'this activity isn\'t verified yet',
                        msg: null
                    });
                }
            }

            return res.status(200).json({
                data: activity,
                err: null,
                msg: 'activity retrieved successfully'
            });
        });
};


module.exports.postActivity = function (req, res) {

    /*
     *   Middleware for creating an activity
     *
     *   BODY:
     *   {
     *       name : String
     *       description : String
     *       price : Number
     *       tags: [String]
     *       fromDateTime : Date | 1522409945
     *       toDateTime : Date | 1522419945
     *       image : String
     *   }
     *
     *   Only verified contributors can create
     *   activities with status = pending
     *   While admins create activities
     *   with status = verified
     *
     *   @author: Wessam
     */

    var user = req.user;

    var isAdmin = false;
    var isVerified = false;

    if (user) {
        isAdmin = user.isAdmin;
        isVerified = user.verified;
    }

    if (!(isAdmin || isVerified)) {
        return res.status(403).json({
            data: null,
            err: null,
            msg: 'Only admins and verified users can create activities.'
        });
    }

    var status = isAdmin ? 'verified' : 'pending';
    // adding status to the body of the request
    req.body.status = status;
    req.body.creator = user.username;

    Activity.create(req.body, function (err, activity) {
        if (err) {
            return res.status(422).json({
                data: null,
                err: err,
                message: null
            });
        }
        activity.tags.forEach(function (tag) {
            tagController.addTag(tag);
        });
        NewsFeed.create(
            {
                contentID: activity._id,
                'metadata.description': activity.description,
                'metadata.image': activity.image,
                'metadata.title': activity.name,
                tags: activity.tags,
                type: 'a'
            },
            function (newsFeedError) {
                if (newsFeedError) {
                    console.log(newsFeedError);
                }
            }
        );
        res.status(201).json({
            data: activity,
            err: null,
            message: 'Activity created successfully.'
        });
    });
};

module.exports.deleteActivity = function (req, res) {
    var deletingUser = req.user;

    Activity.find({ _id: req.params.activityId }).exec(function (err, result) {
        // find the required activity to check on the deletor (xD).
        if (err) {
            throw err;
        }

        var activityCreator = result[0].creator;

        if (activityCreator !== deletingUser.username &&
            !deletingUser.isAdmin) {
            res.status(401).json({
                data: null,
                err: null,
                msg: 'you can\'t delete this activity'
            });

        } else {

            Activity.remove({ _id: req.params.activityId }, function (err) {
                if (err) {
                    return res.status(404).json({
                        data: null,
                        err: err,
                        message: 'cannot find this activity'
                    });
                }
                res.status(201).json({
                    data: null,
                    err: null,
                    message: 'Activity deleted successfully.'
                });
            });

        }


    });
};

module.exports.reviewActivity = function (req, res) {

    /*
     *  Middleware for reviewing an activity by admin
     *
     *  BODY:
     *  {
     *      _id: String | activity id
     *      status: string | verfied || rejected
     *  }
     *
     *  @author: Wessam
     */

    var user = req.user;
    var activityId = req.body._id;
    var newStatus = req.body.status;

    if (!activityId || !newStatus) {
        return res.status(422).json({
            data: null,
            err: 'Activity id and new status must be added to body.',
            msg: null
        });
    }

    var isAdmin = false;

    if (user) {
        isAdmin = user.isAdmin;
    }

    if (!isAdmin) {
        return res.status(403).json({
            data: null,
            err: 'Only an admin can review activities',
            msg: null
        });
    }

    Activity.findByIdAndUpdate(
        activityId,
        { status: newStatus },
        {
            new: true,
            runValidators: true
        },
        function (err, activity) {
            if (err) {
                return res.status(422).json({
                    data: null,
                    err: err,
                    msg: null
                });
            }
            if (!activity) {
                return res.status(404).json({
                    data: null,
                    err: 'Activity doesn\'t exist',
                    msg: null
                });
            }
            // Not tested cause I cant make an activity if I'm not admin
            if (newStatus === 'verified') {
            var notification = {
                body: 'Your new activity was accepted & is now posted.',
                date: moment().toDate(),
                itemId: activityId,
                type: 'activity'
            };
            User.findOneAndUpdate(
                { username: activity.creator },
                {
                    $push:
                        { 'notifications': notification }
                }
                , { new: true },
                function (errr, updatedUser) {
                    // if (errr) {
                    //     return res.status(402).json({
                    //         data: null,
                    //         err: 'error occurred during adding ' +
                    //             'the notification'
                    //     });
                    // }
                    // if (!updatedUser) {
                    //     return res.status(404).json({
                    //         data: null,
                    //         err: null,
                    //         msg: 'User not found.'
                    //     });
                    // }
                }
            );
        }
            res.status(200).send({
                data: activity,
                err: null,
                msg: 'Activity status is updated'
            });
        }
    );
};

module.exports.prepareActivity = function (req, res, next) {

    /*
     *  function to prepare activity for discussion
     *
     * @author: Wessam
     */

    var activityId = req.params.activityId;

    Activity.findById(activityId).
        exec(function (err, activity) {
            if (err) {
                return next(err);
            }
            if (!activity) {
                return res.status(404).json({
                    data: null,
                    err: 'Activity doesn\'t exist',
                    msg: null
                });
            }
            req.object = activity;
            req.verified = activity.status === 'verified';

            return next();
        });
};

// Author: Heidi
module.exports.editActivity = function (req, res, next) {

    var Status = 'pending';
    if (req.user.isAdmin) {
        Status = 'verified';
    }
    // finding activity by id
    Activity.findById(req.params.activityId).exec(function (err, activity) {
        if (err) {
            return next(err);

        }
        // only activity creator can edit his/her own activity
        if (!(activity.creator == req.user.username)) {
            return res.status(403).send({
                data: null,
                err: null,
                msg: 'Action not allowed'
            });
        }
        // if status is booked already it cannot be edited
        if (activity.bookedBy.length > 0) {
            return res.status(403).send({
                data: null,
                err: null,
                msg: 'no edition allowed'
            });
        }
        // updating activity
        Activity.findByIdAndUpdate(req.params.activityId, {
            $set: {
                description: req.body.description,
                fromDateTime: req.body.fromDateTime,
                name: req.body.name,
                price: req.body.price,
                status: Status,
                toDateTime: req.body.toDateTime
            }
        }, { new: true }).exec(function (error, updatedActivity) {
            if (err) {
                return next(err);
            }
            NewsFeed.findOneAndUpdate(
               { contentID: activity._id }, {
                    contentID: activity._id,
                    'metadata.description': activity.description,
                    'metadata.image': activity.image,
                    'metadata.title': activity.name,
                    tags: activity.tags,
                    type: 'a'
                },
                function (newsFeedError) {
                    if (newsFeedError) {
                        console.log(newsFeedError);
                    }
                }
            );

            return res.status(200).send({
                data: updatedActivity,
                err: null,
                msg: 'Activity is updated'
            });
        });
    });
};

module.exports.deleteActivity2 = function (req, res, next) {

    /*
     * Middleware for deleting an activity by admin or creator
     *
     * @author: Wessam
     */

    var activityId = req.params.activityId;
    var user = req.user;

    Activity.findById(activityId, function (err, activity) {
        if (err) {
            return next(err);
        }
        if (!activity) {
            return res.status(404).json({
                data: null,
                err: 'Activity doesn\'t exist',
                msg: null
            });
        }
        if (!user.isAdmin && activity.creator == user.username) {
            return res.status(403).json({
                data: null,
                err: 'You can\'t edit this activity',
                msg: null
            });
        }
        Activity.findOneAndRemove({ _id: activityId }, function (err2) {
            if (err2) {
                return next(err2);
            }

            return res.status(204).json({
                data: null,
                err: null,
                msg: 'Activity deleted successfully'
            });
        });
    });
};

module.exports.isIndependent = function (req, res, next) {

    /*
     * Middleware for making sure that the user is independent
     *
     * @author: Wessam
     */

    if (req.user.isChild) {
        return res.status(403).json({
            data: null,
            err: 'You have to be independent to complete this action',
            msg: null
        });
    }

    return next();
};

var addActivityEvent = function (targetUser, activity) {
    var event = {
        color: {
            primary: '#FF0000',
            secondary: '#D1E8FF'
        },
        draggable: false,
        end: activity.toDateTime,
        meta: {
            activityId: activity._id,
            type: 'Activity',
            url: '/activities/' + activity._id
        },
        resizable: {
            afterEnd: false,
            beforeStart: false
        },
        start: activity.fromDateTime,
        title: activity.name
    };
    User.findOneAndUpdate(
        { username: targetUser },
        { $push: { 'schedule': event } }, { new: true },
        function (err, user) {
            if (err) {
                return err;
            }
            if (!user) {
                return 'user not found';
            }
        }
    );
};

var removeActivityEvent = function (targetUser, activityId) {
    User.findOneAndUpdate(
        { username: targetUser },
        { $pull: { schedule: { meta: { activityId: activityId } } } },
        function (err, user) {
            if (err) {
                return err;
            }

            if (!user) {
                return 'user not found';
            }

        }
    );
};

module.exports.bookActivity = function (req, res, next) {

    /*
     * Middleware for booking activities for child or for self
     *
     * BODY
     *  {
     *      username: String
     *  }
     * @author: Wessam
     */

    var reqUser = req.user;
    var bookingUser = req.body.username;

    Activity.findById(req.params.activityId, function (err, activity) {
        if (err) {
            return next(err);
        }
        if (!activity) {
            return res.status(404).json({
                data: null,
                err: 'Activity doesn\'t exist',
                msg: null
            });
        }
        if (activity.status !== 'verified') {
            return res.status(403).json({
                data: null,
                err: 'Activity isn\'t verified yet.',
                msg: null
            });
        }
        if (activity.bookedBy.indexOf(bookingUser) > -1) {
            return res.status(400).json({
                data: null,
                err: 'User already booked the activity',
                msg: null
            });
        }
        if (
            bookingUser === reqUser.username ||
            reqUser.children.indexOf(bookingUser) > -1) {
            // TODO: Payment
            Activity.findOneAndUpdate(
                { _id: req.params.activityId },
                { $push: { bookedBy: bookingUser } },
                {
                    new: true,
                    runValidators: true
                },
                function (err2, activity2) {
                    if (err2) {
                        return next(err2);
                    }
                    if (req.user.username != activity2.creator) {
                        var notification = {
                            body: req.user.username + ' booked your activity ' +
                                activity2.name,
                            date: moment().toDate(),
                            itemId: req.params.activityId,
                            type: 'activity'
                        };
                        User.findOneAndUpdate(
                            { username: activity2.creator },
                            {
                                $push:
                                    { 'notifications': notification }
                            }
                            , { new: true },
                            function (errr, updatedUser) {
                                console.log('add the notification');
                            }
                        );
                    }
                    addActivityEvent(bookingUser, activity);

                    return res.status(201).json({
                        data: activity2.bookedBy,
                        err: null,
                        msg: 'Booked successfully'
                    });
                }
            );
        } else {
            return res.status(403).json({
                data: null,
                err: 'You can\'t book for this user',
                msg: null
            });
        }
    });
};

module.exports.editActivityImage = function (req, res, next) {

    var Status = 'pending';
    if (req.user.isAdmin) {
        Status = 'verified';
    }
    // finding activity by id
    Activity.findById(req.params.activityId).exec(function (err, activity) {
        if (err) {
            return next(err);

        }
        // only activity creator can edit his/her own activity
        if (!(activity.creator == req.user.username)) {
            return res.status(403).send({
                data: null,
                err: null,
                msg: 'Action not allowed'
            });
        }
        // if status is booked already it cannot be edited
        if (activity.bookedBy.length > 0) {
            return res.status(403).send({
                data: null,
                err: null,
                msg: 'no edition allowed'
            });
        }
        // updating activity image
        Activity.findByIdAndUpdate(
            req.params.activityId,
            { $set: { image: req.body.image } }, { new: true }
        ).exec(function (error, updatedActivity) {
            if (err) {
                return next(err);
            }
            NewsFeed.findOneAndUpdate(
                { contentID: activity._id }, {
                    contentID: activity._id,
                    'metadata.activityDate': moment().toDate(),
                    'metadata.description': activity.description,
                    'metadata.image': activity.image,
                    'metadata.title': activity.name,
                    tags: activity.tags,
                    type: 'a'
                },
                function (newsFeedError) {
                    if (newsFeedError) {
                        console.log(newsFeedError);
                    }
                }
            );

            return res.status(200).send({
                data: updatedActivity.image,
                err: null,
                msg: 'image is updated'
            });
        });
    });
};
