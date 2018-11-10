require('../config/def');
const CheckToken = require('./CheckToken');

let flag = 0;
let result = null;

// init res object
const res = {
    json: (value) => {
        result = value;
    }
};

// init next function
const nextFn = () => {
    flag++;
};

describe('CheckTokenMiddleware', () => {
    beforeEach(() => {
        flag = 0;
        result = null;
    });

    it('Should return invalid token when token undefined and url not ignore', () => {
        CheckToken({path: 'demo1', headers: {}}, res, nextFn);
        console.log(result);
        expect(result).toEqual({status: 0, message: 'Invalid token', data: {}});
    });
});