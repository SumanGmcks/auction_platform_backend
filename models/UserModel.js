const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "please add a name"],
    },
    email: {
        type: String,
        required: [true, "please add an email"],
    },
    password: {
        type: String,
        required: [true, "please add a password"],
    },
    photo: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/128/236/236832.png",
    },
    role: {
        type: String,
        enum: ["admin", "seller", "buyer"],
        default: "buyer",
    },
    commissionBalance: {
        type: Number,
        default: 0,
    },
    balance: {
        type: Number,
        default: 0,
    },
},
 { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;