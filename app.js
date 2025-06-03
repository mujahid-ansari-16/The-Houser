require('dotenv').config();
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const express = require('express');
const multer = require('multer');
const { default: mongoose } = require('mongoose');
const DB_PATH = process.env.DB_PATH;


const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new MongoDBStore({
  url: DB_PATH,
  collection: 'sessions'
})

app.use(session ({
  secret: "my secret key for session",
  resave: false,
  saveUninitialized: true,
  store: store,
}));

app.use((req, res , next)=>{
  req.isLoggedIn = req.session.isLoggedIn || false;
  req.userType = req.session.userType || "null";
  next();
});

app.use("/host", (req, res, next) => {
if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});

const randomString = (length) => {
const characters = 'abcdefghijklmnopqrstuvwxyz';
let result = '';
for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if( file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only JPG, PNG and JPEG are allowed!'), false);
  }
};

const multerOptions = {
storage, fileFilter
}

app.use(express.urlencoded());
app.use(multer(multerOptions).single('photo'));

app.use(express.static(path.join(rootDir, 'public')))

app.use('/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/host/uploads', express.static(path.join(rootDir, 'uploads')));
app.use('/homes/uploads', express.static(path.join(rootDir, 'uploads')));

app.use(storeRouter);

app.use("/host", hostRouter);
app.use(authRouter);

app.use(errorsController.pageNotFound);

const PORT = 3000;

const DB_CONNECTION_STRING =  process.env.DB_PATH;
if (!DB_CONNECTION_STRING) {
  console.error('DB_PATH is not set in the environment variables.');
  process.exit(1);
}

mongoose.connect(DB_CONNECTION_STRING ).then(() => {
  console.log('Connected to Mongo');
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log('Error while connecting to Mongo: ', err);
});