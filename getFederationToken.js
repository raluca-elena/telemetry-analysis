var aws = require('aws-sdk');
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
sts.getFederationToken(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
});