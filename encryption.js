/**
 * Created by rpodiuc on 7/11/14.
 */
//#!/usr/bin/env node
"use strict";
var assert = require("assert");
var ursa = require("ursa");
var fs = require("fs");
var crypto = require('crypto');
var node_cryptojs = require('node-cryptojs-aes');

var fixture = {
    "PRIVATE_KEY": fs.readFileSync("./blort.pem"),
    "PLAINTEXT": "happyUnicorn",
    "PUBLIC_KEY": fs.readFileSync("./blort.pub"),
    "BASE64": "base64",
    "UTF8": "utf8",
    "HEX": "hex"
}

var key = ursa.createPublicKey(fixture.PUBLIC_KEY);
var privKey = ursa.createPrivateKey(fixture.PRIVATE_KEY);

var encoded = key.encrypt(new Buffer(fixture.PLAINTEXT, fixture.UTF8));
var decoded = privKey.decrypt(encoded, undefined, fixture.UTF8);
assert.equal(decoded, fixture.PLAINTEXT);

encoded = key.encrypt(fixture.PLAINTEXT, fixture.UTF8, fixture.BASE64);
decoded = privKey.decrypt(encoded, fixture.BASE64, fixture.UTF8);
assert.equal(decoded, fixture.PLAINTEXT);

encoded = key.encrypt(fixture.PLAINTEXT, undefined, fixture.HEX);
decoded = privKey.decrypt(encoded, fixture.HEX, fixture.UTF8);
assert.equal(decoded, fixture.PLAINTEXT);

// node-cryptojs-aes main object;
var CryptoJS = node_cryptojs.CryptoJS;

var r_pass = crypto.randomBytes(128);
var r_pass_base64 = r_pass.toString("base64");

var message = "I love unicorns";
var JsonFormatter = node_cryptojs.JsonFormatter;

var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });
var decrypted = CryptoJS.AES.decrypt(encrypted, r_pass_base64, { format: JsonFormatter });
var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);
assert.equal(message, decrypted_str);

exports.encryptData = function encryptData(data){

    var r_pass = crypto.randomBytes(128);
    var r_pass_base64 = r_pass.toString("base64");
    var encrypted_credentials = CryptoJS.AES.encrypt(data, r_pass_base64, { format: JsonFormatter });
    var encrypted_pass = key.encrypt(r_pass_base64, fixture.BASE64, fixture.BASE64);
    var response = {};
    response["credentials"] = encrypted_credentials;
    response["simmetrycKey"] = encrypted_pass;
    return response;
};

exports.decryptData = function decryptData(data){
    var simKey = data["simmetrycKey"];
    var credentials = data["credentials"];
    var decriptedsimKey = privKey.decrypt(simKey, fixture.BASE64, fixture.BASE64);
    var credentials = CryptoJS.AES.decrypt(credentials, decriptedsimKey, { format: JsonFormatter });
    return CryptoJS.enc.Utf8.stringify(credentials);
};
