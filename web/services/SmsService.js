const config = require('config');
const SPEED_SMS_TOKEN = config.get('speedSMSToken');
const https = require('https');

/**
 * Standard phone
 * @param {string} phone
 * @return {string}
 */
const convertPhoneNumber = (phone) => {
  if (phone.indexOf('+84') === 0) {
    return phone.slice(1);
  }

  if (phone.indexOf('84') === 0) {
    return phone;
  }

  if (phone.indexOf('0') === 0) {
    return '84' + phone.slice(1);
  }

  return '84' + phone;
};

/**
 *
 * @param {string[]} phones
 * @param {string} content
 * @param {string} sender
 */
const sendSMS = (phones, content, sender = 'ThueBĐS') => {
  const url = 'api.speedsms.vn';
  const params = JSON.stringify({
    to: phones.map(phone => convertPhoneNumber(phone)),
    content: content,
    sms_type: 2,
    sender: sender
  });

  const buf = new Buffer(SPEED_SMS_TOKEN + ':x');
  const auth = 'Basic ' + buf.toString('base64');
  const options = {
    hostname: url,
    port: 443,
    path: '/index.php/sms/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': auth
    }
  };

  const req = https.request(options, function (res) {
    res.setEncoding('utf8');
    let body = '';
    res.on('data', function (d) {
      body += d;
    });
    res.on('end', function () {
      const json = JSON.parse(body);
      if (json.status === 'success') {
        console.log('send sms success');
      } else {
        console.log('send sms failed ' + body);
      }
    });
  });

  req.on('error', function (e) {
    console.log('send sms failed: ' + e);
  });

  req.write(params);
  req.end();
};

module.exports = {
  sendSMS
};
