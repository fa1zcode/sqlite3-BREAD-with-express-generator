var express = require("express");
var router = express.Router();
var path = require("path");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(path.join(__dirname, "..", "db", "todo.db"));
const bcrypt = require("bcrypt");
const saltRounds = 10;

function isLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
    console.log("coba lagi");
  }
}

router.get("/login", function (req, res) {
  res.render("login", { loginMessage: req.flash("loginMessage") });
});

router.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  db.get("select * from user where email = ?", [email], (err, user) => {
    if (err) {
      req.flash("loginMessage", "Login Gagal");
      return res.redirect("/login");
    }
    if (!user) {
      req.flash("loginMessage", "User Tidak Ditemukan");
      return res.redirect("/login");
    }

    bcrypt.compare(password, user.password, function (err, result) {
      // result == true
      if (result) {
        req.session.user = user;
        console.log(req.session.user);
        res.redirect("/");
      } else {
        req.flash("loginMessage", "Password Salah");
        res.redirect("/login");
      }
    });
  });
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/register", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const fullname = req.body.fullname;

  bcrypt.hash(password, saltRounds, function (err, hash) {
    // Store hash in your password DB.
    db.run(
      "insert into user (email, password, fullname) values (?,?,?)",
      [email, hash, fullname],
      (err, user) => {
        if (err) return res.send("Register Failed");
        res.redirect("/login");
      }
    );
  });
});

router.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    // cannot access session here
    res.redirect("/login");
  });
});

router.get("/", isLoggedIn, function (req, res) {
  const url = req.url == "/" ? "/?page=1" : req.url;
  console.log(url);

  const params = [];
  params.push(`userid = ${req.session.user.id}`);

  if (req.query.task) {
    params.push(`task like '${req.query.task}' `);
  }

  if (req.query.complete) {
    params.push(`complete = ${req.query.complete}`);
  }

  const page = req.query.page || 1; // if no req.query.page, page = 1
  const limit = 3;
  const offset = (page - 1) * limit;
  let sql = "select count(*) as total from todo";

  if (params.length > 0) {
    sql += ` where ${params.join(" and ")}`;
  }

  db.get(sql, (err, raws) => {
    const jumlahHalaman = Math.ceil(raws.total / limit);
    sql = "select * from todo";
    if (params.length > 0) {
      sql += ` where ${params.join(" and ")}`;
    }
    sql += ` limit ? offset ?`;
    console.log(sql);
    db.all(sql, [limit, offset], (err, raws) => {
      if (err) return res.send(err);
      //console.log(raws)
      res.render("list", {
        data: raws,
        page,
        jumlahHalaman,
        query: req.query,
        url,
        user: req.session.user,
      });
    });
  });
});

router.get("/add", isLoggedIn, function (req, res) {
  res.render("add");
});

router.post("/add", isLoggedIn, function (req, res) {
  task = req.body.task;
  // query binding = use (?) to prevent hack via sql injection
  db.run(
    "insert into todo(task, userid) values (?,?) ",
    [task, req.session.user.id],
    (err, raws) => {
      if (err) return res.send(err);
      console.log(raws);
      res.redirect("/");
    }
  );
});

router.get("/delete/:id", isLoggedIn, function (req, res) {
  const id = Number(req.params.id);
  db.run("delete from todo where id = ? ", [id], (err, raws) => {
    if (err) return res.send(err);
    req.flash("loginMessage", "Task berhasil dihapus");
    console.log(raws);
    res.redirect("/");
  });
});

router.get("/edit/:id", isLoggedIn, function (req, res) {
  const id = Number(req.params.id);
  db.get("select * from todo where id = ?", [id], (err, raws) => {
    console.log(err);
    if (err) return res.send(err);
    res.render("edit", { data: raws });
  });
});

router.post("/edit/:id", isLoggedIn, function (req, res) {
  const id = Number(req.params.id);
  task = req.body.task;
  complete = JSON.parse(req.body.complete);
  db.get(
    "update todo set task = (?), complete = (?) where id = ?",
    [task, complete, id],
    (err, raws) => {
      console.log(err);
      if (err) return res.send(err);
      //res.render('edit', { data: raws })
      res.redirect("/");
    }
  );
});

module.exports = router;
