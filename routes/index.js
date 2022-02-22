var express = require("express");
var router = express.Router();
var path = require("path");
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(path.join(__dirname, "..", "db", "todo.db"));

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  
  console.log(email)
  console.log(password)

  db.get(
    "select * from user where email = ? and password = ?",
    [email, password],
    (err, raw) => {
      if (err) return res.send("Login Gagal");
      if (!raw) return res.send("Masukkan Username")
      res.redirect("/")
    }
  );
});

router.get("/", function (req, res) {
  const url = req.url == "/" ? "/?page=1" : req.url;
  console.log(url);

  const params = [];

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
      });
    });
  });
});

router.get("/add", function (req, res) {
  res.render("add");
});

router.post("/add", function (req, res) {
  task = req.body.task;
  // query binding = use (?) to prevent hack via sql injection
  db.run("insert into todo(task) values (?) ", [task], (err, raws) => {
    if (err) return res.send(err);
    console.log(raws);
    res.redirect("/");
  });
});

router.get("/delete/:id", function (req, res) {
  const id = Number(req.params.id);
  db.run("delete from todo where id = ? ", [id], (err, raws) => {
    if (err) return res.send(err);
    console.log(raws);
    res.redirect("/");
  });
});

router.get("/edit/:id", function (req, res) {
  const id = Number(req.params.id);
  db.get("select * from todo where id = ?", [id], (err, raws) => {
    console.log(err);
    if (err) return res.send(err);
    res.render("edit", { data: raws });
  });
});

router.post("/edit/:id", function (req, res) {
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
