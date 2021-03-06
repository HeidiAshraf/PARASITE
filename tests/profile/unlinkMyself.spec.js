var mongoose = require('mongoose');
var chai = require('chai');
var server = require('../../app');
var User = mongoose.model('User');
var Activity = mongoose.model('Activity');
var chaiHttp = require('chai-http');
var expect = require('chai').expect;
var should = chai.should();

chai.use(chaiHttp);
var config = require('../../api/config/config');
var Mockgoose = require('mockgoose').Mockgoose;
var mockgoose = new Mockgoose(mongoose);
chai.use(chaiHttp);

var token = null;

describe('/PATCH Parent', function () {
    this.timeout(120000);
    // --- Mockgoose Initiation --- //
    before(function (done) {
        mockgoose.prepareStorage().then(function () {
            mongoose.connect(config.MONGO_URI, function () {
                done();
            });
        });
    });
    // --- End of "Mockgoose Initiation" --- //

    // --- Clearing Mockgoose --- //
    beforeEach(function (done) {
        mockgoose.helper.reset().then(function () {
            done();
        });
    });

it(' unlink the logged in child from his selected coach', function (done) {
    var user = new User({
        birthdate: '12/12/1999',
        email: 'user@gmail.com',
        firstName: 'firstName',
        isEmailVerified: true,
        lastName: 'lastName',
        password: '12345678',
        phone: '01113999999',
        username: 'userz'
    });
    user.save(function (err2, save2) {
        if (err2) {
            return console.log(err2);
        }
    chai.request(server).
    post('/api/signIn').
    send({
        'password': '12345678',
        'username': 'userz'
    }).
    end(function (err, response) {
        if (err) {
            return console.log(err);
        }
        response.should.have.status(200);
        token = response.body.token;


    var User1 = new User({
        birthdate: '12/12/1999',
        children: ['userz'],
        email: 'user@gmail.com',
        firstName: 'parentName',
        isParent: true,
        lastName: 'parent',
        password: '12345678',
        phone: '01113999999',
        username: 'parentz'

 });
 User1.save(function (eror, save) {
    if (eror) {
        return console.log(eror);
    }


    chai.request(server).
    patch('/api/profile/' + User1.username + '/UnlinkMyself').
    set('Authorization', token).
    end(function (error, ress) {
        if (error) {
            return console.log(error);
        }


        ress.should.have.status(200);
        ress.body.data.should.be.a('array');
       ress.body.should.have.property('msg').
       eql('Successefully removed child from parent\'s list of children');
        ress.body.should.have.property('err').eql(null);

      done();
    });
 });
});
});
});
    // --- End of "Clearing Mockgoose" --- //
    after(function (done) {
        mongoose.connection.close(function () {
            done();
        });
    });

});

