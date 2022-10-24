const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileUpload");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthentificated");
const User = require("../models/User");
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      //console.log(req.body);
      // 1 Créer une offre en DB sans photo sans ref
      // 2 Créer une offre en DB avec une photo et toujours sans ref
      // 3  Créer une offre en DB avec une photo et avec une ref

      const convertToBase64 = (file) => {
        return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
      };

      const { title, description, price, condition, city, brand, size, color } =
        req.body;
      const RAW = req.files.picture;
      const IMG = convertToBase64(RAW);
      const imageFin = await cloudinary.uploader.upload(IMG, {
        folder: "/vinted",
      });
      const token = req.headers.authorization.replace("Bearer ", "");
      const vendeur = await User.findOne({ token: token }).select(
        "account.username"
      );

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { brand },
          { size },
          { condition },
          { color },
          { city },
        ],
        owner: vendeur,
        product_image: imageFin.secure_url,
      });

      const result = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );
      newOffer.product_image = result;
      console.log(result);
      await newOffer.save();
      // voir si c'est bon
      res.json(newOffer);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      console.log(typeof req.query.priceMin);
      filters.product_price = {
        $gte: Number(req.query.priceMin),
      };
    }
    if (req.query.priceMax) {
      // filters.product_price = {
      //   $lte: Number(req.query.priceMax),
      // };
      if (filters.product_price) {
        filters.product_price.$lte = Number(req.query.priceMax);
      } else {
        filters.product_price = {
          $lte: Number(req.query.priceMax),
        };
      }
    }
    //console.log(filters.product_price);

    const sort = {};
    if (req.query.sort === "price-desc") {
      sort.product_price = -1;
    } else if (req.query.sort === "price-asc") {
      sort.product_price = 1;
    }

    let limit = 5;
    if (req.query.limit) {
      limit = req.query.limit;
    }
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const skip = (page - 1) * limit;

    const results = await Offer.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const count = await Offer.countDocuments(filters);

    res.json({ count: count, offers: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    res.json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
