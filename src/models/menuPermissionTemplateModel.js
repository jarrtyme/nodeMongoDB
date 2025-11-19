const mongoose = require('mongoose')

const MenuPermissionTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    menuPermissions: {
      type: [String],
      required: true,
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('MenuPermissionTemplate', MenuPermissionTemplateSchema)
