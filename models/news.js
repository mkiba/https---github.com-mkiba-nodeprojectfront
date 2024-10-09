import mongoose from "mongoose";


var news = mongoose.Schema({
    title: String,
    description: String,
    url: String,
    urltoimage: String,
    publishdate: { type: Date, default: Date.now},
}
)

export default mongoose.model('news', news) ;
