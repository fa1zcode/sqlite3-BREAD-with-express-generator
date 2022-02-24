var express = require("express");
var router = express.Router();
var path = require("path");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(path.join(__dirname, "..", "db", "todo.db"));

function isLoggedIn(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
    console.log("coba lagi");
  }
}

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  db.get(
    "select * from user where email = ? and password = ?",
    [email, password],
    (err, user) => {
      if (err) return res.send("Login Gagal");
      if (!user) return res.send("Email / Password yang anda masukkan salah");
      //console.log(user);
      req.session.user = user;
      console.log(req.session.user);
      res.redirect("/");
    }
  );
});

router.get("/register", function (req, res) {
  res.render("register");
});

router.post("/register", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  const fullname = req.body.fullname;

  db.run(
    "insert into user (email, password, fullname) values (?,?,?)",
    [email, password, fullname],
    (err, user) => {
      if (err) return res.send("Register Failed");
      res.redirect("/login");
    }
  );
});

router.get("/logout", function (req, res) {
  req.session.destroy(function (err) {
    // cannot access session here
    res.render("login");
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

router.post("/add", function (req, res) {
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
