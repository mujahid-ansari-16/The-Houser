const Home = require("../models/home");
const fs = require("fs");
const user = require("../models/user");

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to Houser",
    currentPage: "addHome",
    editing: false,
    isLoggedIn: req.isLoggedIn,
    user: req.session.user,
    userType: req.session.userType
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  const editing = req.query.editing === "true";

  Home.findById(homeId).then((home) => {
    if (!home) {
      console.log("Home not found for editing.");
      return res.redirect("/host/host-home-list");
    }

    res.render("host/edit-home", {
      home: home,
      pageTitle: "Edit your Home",
      currentPage: "host-homes",
      editing: editing,
      isLoggedIn: req.isLoggedIn,

      user: req.session.user,
      userType: req.session.userType
    });
  });
};

exports.getHostHomes = (req, res, next) => {
  Home.find({ host: req.session.user._id }).then((registeredHomes) => {
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Homes List",
      currentPage: "host-homes",
      isLoggedIn: req.isLoggedIn,
      user: req.session.user,
      userType: req.session.userType
    });
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, price, location, rating, contact, description } =
    req.body;
  if (!req.file) {
    console.log("No file uploaded");
    return res.redirect("/host/add-home");
  }

  const photo = req.file.path; 

  const home = new Home({
    houseName,
    price,
    location,
    rating,
    photo,
    contact,
    description,
    host: req.session.user._id 
  });
  home.save().then(() => {
    console.log("Home Saved successfully");
  });

  res.redirect("/host/host-home-list");
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, price, location, rating, contact, description } = req.body;

  Home.findById(id)
    .then((home) => {
      if (!home) {
        return res.redirect("/host/host-home-list");
      }
      if (home.host.toString() !== req.session.user._id.toString()) {
        return res.status(403).send("Not authorized to edit this home.");
      }

      home.houseName = houseName;
      home.price = price;
      home.location = location;
      home.rating = rating;
      home.contact = contact;
      home.description = description;

      if (req.file) {
        if (home.photo) {
          fs.unlink(home.photo, (err) => {
            if (err) {
              console.log("Error while deleting old photo: ", err);
            }
          });
        }
        home.photo = req.file.path;
      }

      return home.save();
    })
    .then((result) => {
      if (result) {
        console.log("Home updated ");
      }
      res.redirect("/host/host-home-list");
    })
    .catch((err) => {
      console.log("Error while updating home: ", err);
      res.redirect("/host/host-home-list");
    });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId)
    .then((home) => {
      if (!home) {
        return res.redirect("/host/host-home-list");
      }
      if (home.host.toString() !== req.session.user._id.toString()) {
        return res.status(403).send("Not authorized to delete this home.");
      }
      return Home.findByIdAndDelete(homeId);
    })
    .then(() => {
      res.redirect("/host/host-home-list");
    })
    .catch((error) => {
      console.log("Error while deleting ", error);
    });
};