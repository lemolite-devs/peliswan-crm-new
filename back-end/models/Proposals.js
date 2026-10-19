import mongoose, { Schema } from 'mongoose'

const proposalSchema = new Schema(
  {
    proposalTo: String,
    subject: String,
    // relatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'client' },
    relatedTo: String,
    date: Date,
    phone: String,
    // uploadedFile: String,
    uploadedFile: { filename: String, contentType: String, data: Buffer }, // store file as binary data
    mobileNumber: String,
    state: String,
    city: String
  },
  {
    timestamps: true
  }
)

const Proposals = mongoose.model('proposal', proposalSchema)
export default Proposals
