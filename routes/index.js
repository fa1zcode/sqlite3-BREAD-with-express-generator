var express = require('express');
var router = express.Router();
var path = require('path');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(path.join(__dirname, '..', 'db', 'todo.db'));

router.get('/', function (req, res) {
  db.all('select * from todo', (err, raws) => {
    if (err) return res.send(err)
    //console.log(raws)
    res.render('list', { data: raws })
  })
})

router.get('/add', function (req, res) {
  res.render('add')
})

router.post('/add', function (req, res) {
  task = req.body.task
  // query binding = use (?) to prevent hack via sql injection
  db.run('insert into todo(task) values (?) ', [task], (err, raws) => {
    if (err) return res.send(err)
    console.log(raws)
    res.redirect('/')
  })
})

router.get('/delete/:id', function (req, res) {
  const id = Number(req.params.id)
  db.run('delete from todo where id = ? ', [id], (err, raws) => {
    if (err) return res.send(err)
    console.log(raws)
    res.redirect('/')
  })
})

router.get('/edit/:id', function (req, res) {
  const id = Number(req.params.id)
  db.get('select * from todo where id = ?', [id], (err, raws) => {
    console.log(err)
    if (err) return res.send(err)
    res.render('edit', { data: raws })
  })
})

router.post('/edit/:id', function (req, res) {
  const id = Number(req.params.id)
  task = req.body.task
  complete = JSON.parse(req.body.complete)
  db.get('update todo set task = (?), complete = (?) where id = ?', [task, complete, id], (err, raws) => {
    console.log(err)
    if (err) return res.send(err)
    //res.render('edit', { data: raws })
    res.redirect('/')
  })
})

module.exports = router;
