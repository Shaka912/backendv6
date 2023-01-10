const express = require("express");
const router = express.Router();

const Dob = require("../models/dob");
const Name = require("../models/name");
const Image = require("../models/pic");
const User = require("../models/users");
const Video = require("../models/video");
const Gender = require("../models/gender");
const Friend = require("../models/friends");
const University = require("../models/uni");
const Message = require("../models/message");

const fetchuser = require("../middleware/fetchuser");

router.post("/addfriend", fetchuser, async (req, res) => {
  try {
    const friendID = req.body.friendId;
    if (!friendID) {
      res.status(500).json({ error: "Friend Id is required" });
    }
    const x1 = await Friend.findOne({
      uid: { $eq: req.user.id },
      friendId: { $eq: friendID },
    });
    const x2 = await Friend.findOne({
      uid: { $eq: friendID },
      friendId: { $eq: req.user.id },
    });
    if (x1) return res.status(200).json({ error: "Already have a friend" });
    if (x2) {
      await Friend.updateOne(
        { uid: friendID, friendId: req.user.id },
        {
          $set: { both: true },
        }
      );
      return res
        .status(200)
        .json({ _id: x2._id, uid: x2.friendId, friendId: x2.uid });
    }
    const dd = await Friend.create({
      uid: req.user.id,
      friendId: friendID,
    });
    res.status(200).json(dd);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/removefriend", fetchuser, async (req, res) => {
  try {
    const friendID = req.body.friendId;
    if (!friendID) {
      res.status(500).json({ error: "Friend Id is required" });
    }
    await Friend.deleteOne({
      uid: req.user.id,
      friendId: friendID,
    });
    await Friend.deleteOne({
      uid: friendID,
      friendId: req.user.id,
    });
    res.json({ friendId: "Friend Removed" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/getfriends", fetchuser, async (req, res) => {
  try {
    const fusers = await Friend.find({
      uid: { $eq: req.user.id },
    });
    const musers = await Friend.find({
      friendId: { $eq: req.user.id },
    });
    const users = [];
    for (let user of fusers) {
      const xuser = await User.findOne({
        _id: { $eq: user.friendId },
      });
      const xdob = await Dob.findOne({ _id: { $eq: xuser.id } });
      const xname = await Name.findOne({ _id: { $eq: xuser.id } });
      const ximage = await Image.findOne({ _id: { $eq: xuser.id } });
      const xvideo = await Video.findOne({ _id: { $eq: xuser.id } });
      const xgender = await Gender.findOne({ _id: { $eq: xuser.id } });
      const xuni = await University.findOne({ _id: { $eq: xuser.id } });
      const msgs = await Message.find({
        users: {
          $all: [req.user.id, xuser.id],
        },
      })
        .sort({ updatedAt: -1 })
        .limit(1);
      users.push({
        id: xuser.id,
        email: xuser.email,
        timestamp: xuser.timestamp,
        dob: xdob !== null ? xdob.dob : null,
        name: xname !== null ? xname.name : null,
        photo: ximage !== null ? ximage.path : null,
        video: xvideo !== null ? xvideo.path : null,
        gender: xgender !== null ? xgender.gender : null,
        university: xuni !== null ? xuni.university : null,
        lastmessage: msgs.length == 0 ? "Say Hi" : msgs[0].message.text,
      });
    }
    for (let user of musers) {
      const xuser = await User.findOne({
        _id: { $eq: user.uid },
      });
      const xdob = await Dob.findOne({ _id: { $eq: xuser.id } });
      const xname = await Name.findOne({ _id: { $eq: xuser.id } });
      const ximage = await Image.findOne({ _id: { $eq: xuser.id } });
      const xvideo = await Video.findOne({ _id: { $eq: xuser.id } });
      const xgender = await Gender.findOne({ _id: { $eq: xuser.id } });
      const xuni = await University.findOne({ _id: { $eq: xuser.id } });
      const msgs = await Message.find({
        users: {
          $all: [req.user.id, xuser.id],
        },
      })
        .sort({ updatedAt: -1 })
        .limit(1);
      users.push({
        id: xuser.id,
        email: xuser.email,
        timestamp: xuser.timestamp,
        dob: xdob !== null ? xdob.dob : null,
        name: xname !== null ? xname.name : null,
        photo: ximage !== null ? ximage.path : null,
        video: xvideo !== null ? xvideo.path : null,
        gender: xgender !== null ? xgender.gender : null,
        university: xuni !== null ? xuni.university : null,
        lastmessage: msgs.length == 0 ? "Say Hi" : msgs[0].message.text,
      });
    }
    return res.status(200).json({ users });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "SomeThing Went Wrong" });
  }
});

module.exports = router;
