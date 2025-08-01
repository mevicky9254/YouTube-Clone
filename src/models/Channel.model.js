import mongoose, {Schema} from "mongoose";


const channelSchema = new Schema({
    subscribers: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },

    subsribedChannels: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
},{timestamps: true});

export const Channel = mongoose.model("Channel", channelSchema);