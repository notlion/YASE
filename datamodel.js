module.exports.configureSchema = function(Schema, mongoose) {
  mongoose.model('Shader', new Schema({
    short_id : { type: String, unique: true },
    date : { type: Date, default: Date.now },
    z : String,
    r : Array,
    d : String
  }));
};
