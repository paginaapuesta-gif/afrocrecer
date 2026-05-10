const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({

  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  text:{
    type:String,
    required:true
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

});

const projectSchema = new mongoose.Schema({

  title:{
    type:String,
    required:true
  },

  description:{
    type:String,
    required:true
  },

  /* tipo de publicación */

  type:{
    type:String,
    enum:["project","service","food","product","event"],
    default:"project"
  },

  /* categoría opcional */

  category:{
    type:String,
    default:"General"
  },

  /* precio opcional */

  price:{
    type:Number,
    default:null
  },

  /* valor cultural / aporte comunitario */

  valorCultural:{
    type:String,
    default:""
  },

  fuente:{
    type:String,
    default:""
  },

  territorio:{
    type:String,
    default:""
  },

  fechaCultural:{
    type:Date,
    default:null
  },

  portadorTradicion:{
    type:String,
    default:""
  },

  contextoHistorico:{
    type:String,
    default:""
  },

  /* ubicación */

  location:{
    type:String,
    default:"Cumaral"
  },

  image:{
    type:String,
    default:""
  },

  author:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },

  likes:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  }],

  comments:[commentSchema],

  createdAt:{
    type:Date,
    default:Date.now
  },

 updatedAt:{
  type:Date,
  default:Date.now
},

status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
}

});

module.exports = mongoose.model("Project", projectSchema);
