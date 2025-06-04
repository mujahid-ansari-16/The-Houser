const Home = require("../models/home");
const express = require("express");
const storeRouter = express.Router();

const storeController = require("../controllers/storeController");

storeRouter.get("/", storeController.getIndex);
storeRouter.get("/homes", storeController.getHomes);
storeRouter.get("/bookings", storeController.getBookings);
storeRouter.get("/favourites", storeController.getFavouriteList);

storeRouter.get("/homes/:homeId", storeController.getHomeDetails);
storeRouter.post("/favourites", storeController.postAddToFavourite);
storeRouter.post("/favourites/delete/:homeId", storeController.postRemoveFromFavourite);


storeRouter.get("/homes/photo/:homeId", async (req, res) => {
  try {
    const home = await Home.findById(req.params.homeId);
    if (home && home.photoData && home.photoType) {
      res.contentType(home.photoType);
      res.send(home.photoData);
    } else {
      res.status(404).send("Image not found");
    }
  } catch (err) {
    res.status(500).send("Server error");
  }
});

module.exports = storeRouter;