var aws = require('aws-sdk');
var encrypt = require('./encryption');
aws.config.loadFromPath('config1.json');
var sts = new aws.STS();
var policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "*"
        }
    ]
}

var params = {
    Name: 'blue_unicorn', // required
    DurationSeconds: 129600,
    Policy: JSON.stringify(policy)
};

//STS credentials accepted format
var configTemplate = {
    "accessKeyId": "",
    "secretAccessKey": "",
    "sessionToken":"",
    "region": "us-east-1"
}

sts.getFederationToken(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else  {
        configTemplate["accessKeyId"] = data["Credentials"]["AccessKeyId"];
        configTemplate["secretAccessKey"] = data["Credentials"]["SecretAccessKey"];
        configTemplate["sessionToken"] = data["Credentials"]["SessionToken"];
        var credentials = JSON.stringify(configTemplate)
        return encrypt.encryptData(credentials);
    }
});

