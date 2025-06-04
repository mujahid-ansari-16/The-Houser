const { check, validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "Login",
    isLoggedIn: false,
    user: {},
    errors: [],
    oldInput:{
      email: "",
    }
  });
};


exports.getSignup = (req, res, next) => {
  res.render("auth/signup",{
    pageTitle: "Signup",
    currentPage: "Signup",
    isLoggedIn: false,
    user: {},
    errors: [],
    oldInput: {
      firstName: "",
      lastName: "",
      email: "",
      userType: ""
    },
  });
};

exports.postSignup = [
  check("firstName")
  .trim()
  .isLength({ min: 3 })
  .withMessage("First name must be at least 3 characters long.")
  .matches(/^[A-Za-z]+$/)
  .withMessage("First name must contain only letters."),
  
  check("lastName")
  .trim()
  .isLength({ min: 3 })
  .withMessage("Last name must be at least 3 characters long.")
  .matches(/^[A-Za-z]+$/)
  .withMessage("Last name must contain only letters."),
  
  check("email")
  .isEmail()
  .withMessage("Please enter a valid email address.")
  .normalizeEmail(),

  check("password")
  .trim()
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long.")
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/)
  .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number."),

  check("confirmPassword")
  .trim() 
  .custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match.");
    }
    return true;
  }),

  check("userType")
  .notEmpty()
  .withMessage("Please select a user type.")
  .isIn(["guest", "host"])
  .withMessage("Invalid user type selected."),

  check("terms")
  .notEmpty()
  .withMessage("You must agree to the terms and conditions.")
  .custom((value, {req})=> {
    if (value !== "on") {
      throw new Error("You must agree to the terms and conditions.");
    }
    return true;
  }),
    (req, res, next) => {
    
  const {firstName, lastName, email, password, userType} = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      currentPage: "Signup",
      isLoggedIn: false,
      user: {},
      errors: errors.array()
      .map(err => err.msg),
      oldInput: {
        firstName,
        lastName,
        email,
        userType
      },
      validationErrors: errors.array()
    });
  }

  bcrypt.hash(password, 12)
  .then(hashedPassword => {
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType
    })
    return user.save();

  }).then((user) => {
   req.session.isLoggedIn = true;
    req.session.user = user;
    req.session.userType = user.userType;
    req.session.save((err) => {
      if (err) {
        console.log("Session save error:", err);
        return res.redirect("/login");
      }
      res.redirect("/");
    });
  }).catch(err => {
    console.error("Error saving user:", err);
    res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      currentPage: "Signup",
      isLoggedIn: false,
      errors: ["An error occurred while creating your account. Please try again."],
      oldInput: {
        firstName,
        lastName,
        email,
        userType
      },
    });
  })
}
]

exports.postLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({email});
  if (!user) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "Login",
      isLoggedIn: false,
      user: {},
      errors: ["Invalid email or password."],
      oldInput: { email, password }
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(422).render("auth/login", {
      pageTitle: "Login",
      currentPage: "Login",
      isLoggedIn: false,
      user: {},
      errors: ["Invalid password."],
      oldInput: { email }
    });
  }
  req.session.isLoggedIn = true;
  req.session.user = user;
  req.session.userType = user.userType;
  req.session.save( (err) => {
    if(err){
      console.log("Session save error:", err);
       return res.redirect("/login");
    }
  });
  req.session.save(() => {
  res.redirect("/");
});
};

exports.postLogout = (req, res, next) => {req.session.destroy(() => {
  res.redirect("/login");
});
};