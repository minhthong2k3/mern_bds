import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: "https://www.google.com/imgres?q=chim%20c%C3%A1nh%20c%E1%BB%A5t&imgurl=https%3A%2F%2Fracevietnam.com%2FThumbnail%2FExtraLarge%2FUpload%2F20190306%2F8fe5383b4f9dcf8064e408423bb88434.png&imgrefurl=https%3A%2F%2Fracevietnam.com%2Fteam%2Fchim-canh-cut&docid=4lOkSlcwYCVwDM&tbnid=taT59JQAFDDNYM&vet=12ahUKEwiEiO-Y69yQAxUwka8BHc_NERQQM3oFCIMBEAA..i&w=400&h=400&hcb=2&ved=2ahUKEwiEiO-Y69yQAxUwka8BHc_NERQQM3oFCIMBEAA" },
  
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;
