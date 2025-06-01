import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email : {
            type: String,
            required: true,
            unique: true,
        },
        fullName: {
            type: String,
            required: true,
        },        password: {
            type: String,
            required: function() {
                return !this.provider || this.provider === 'local';
            },
            minlength: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },
        provider: {
            type: String,
            enum: ['local', 'google', 'facebook'],
            default: 'local'
        },
        providerId: {
            type: String,
        }
    },
    { timestamps: true }
)

const User = mongoose.model("User", userSchema);

export default User;