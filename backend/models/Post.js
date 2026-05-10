const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({

  titulo:{
    type:String,
    required:true
  },

  descripcion:{
    type:String
  },

  imagen:{
    type:String
  },

  autor:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  fecha:{
    type:Date,
    default:Date.now
  }

});

module.exports = mongoose.model("Post",PostSchema);