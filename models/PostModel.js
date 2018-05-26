/**
 * Created by duong_000 on 10/18/2016.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var postSchema = new Schema({

    type: String,
    content_id : String,
    priority: Number,
    from: Number,
    to: Number,
    date: {type: Number, default: Date.now}


});

// saleSchema.index(
//     {
//         "source_": "text",
//         "destination_": "text",
//         "title_": "text"
//     },
//     {
//         "weights": {
//             "title_": 1,
//             "destination_": 1,
//             "source_": 1
//         }
//     }
// );

var PostModel = mongoose.model('Post', postSchema);
module.exports = PostModel;
module.exports.Model = postSchema;
