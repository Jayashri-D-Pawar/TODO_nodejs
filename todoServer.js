const express = require("express");
const fs = require("fs");
const readline = require("readline-sync");
const multer = require("multer"); 
const Multerstorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    //const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
   if(file.size>100){
     cb(error,"size limit should be less than 100....");
     return;
   }
    cb(null, file.originalname);
  }
});
const db = require("./models/db");
const userModel = require("./models/User");

const upload = multer({ storage: Multerstorage });
const app = express();
var session = require('express-session');
app.use(express.json());             // work before every request || it is middleware
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// app.set("views",__dirname+"/anyFolderName"); /// for not using views folder ||custome folder
app.use(session({
  secret: 'My_Secret_Key',
  resave: true,
  saveUninitialized: true,
}));
//app.use(upload.single("profile_pic"));
app.use(upload.single("todoimg"));
app.get("/login", function (req, res) {
  res.render("login", { error: null });
});
app.get("/todo", function (req, res) {
  if (!req.session.isLogin) {
    res.redirect("/login");
    return;
  }
  res.sendFile(__dirname + "/todo.html");
});
// var inpass = false;
app.get("/", function (req, res) {
  if (!req.session.isLogin) {
    res.render("login", { error: null });
    return;
  }
  ReadContent(function (err, data) {
    if (err) {
      res.status(500).send("Internal Issue,!!stay tune...");
      return;
    }

    res.render("index", { name: req.session.username, data: data,profile_pic:req.session.profile_pic });
  });
});

// imaage servre request ``
app.use(express.static("uploads"));
   // static express for static content like .css or other static files
app.get("/",function(req,res){

});

app.post("/login", function (req, res) {
  const uname = req.body.username;
  const pass = req.body.password;
  let result = 0;
  fs.readFile('user_data.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    const dataArray = data.split('\n');

    //  console.log(dataArray);
    for (const jsonStr of dataArray) {
      const obj = JSON.parse(jsonStr);

      // console.log(obj.username);
      if (obj.username == uname && obj.password == pass) {
       // console.log(obj);
        req.session.isLogin = true;
        req.session.username = uname;
        req.session.password = pass;
        req.session.profile_pic = obj.pic;
        res.redirect("/");
        result = 1;
        break;
      }
    }
    if (result == 0) {
      // res.status(401).send("Wrong information");
      res.render("login", { error: "Invalid Username or password check again" });
    }
  });

});

app.get("/signup", function (req, res) {

  res.render("signup");
});
app.post("/signup", function (req, res) {
  const uname = req.body.username;
  const pass = req.body.password;
  const gen = req.body.gender;
  const fullname = req.body.fullname;
  const mob = req.body.mobile;
  const email = req.body.email;
  const profile_pic = req.file;

  const userData = {
    fullname: fullname,
    gender: gen,
    mobile: mob,
    email: email,
    username: uname,
    password: pass,
    pic: profile_pic.filename
  };
// dbsave

userModel.create(userData).then(function(){
  res.redirect("/login");
}).catch(function(err){
  res.render("signup",{error:err});
});
//dbsave

  // console.log(profile_pic);
  fs.readFile('user_data.txt', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }
    if (data === "") {
      data = '[]';
    }
    if (data !== "") {
      const dataArray = data.split('\n');
      for (const jsonStr of dataArray) {

        const obj = JSON.parse(jsonStr);
        if (obj.username == uname && obj.email == email) {
          return res.status(401).send("Please enter another username/password");
        }
      }

    }

    const userDataString = "\n" + JSON.stringify(userData);
    fs.appendFile('user_data.txt', userDataString, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to file:', err);
        return;
      }
    });
    req.session.isLogin = true;
    req.session.username = uname;
    req.session.password = pass;
    req.session.profile_pic = userData.pic;
    res.redirect("/login");
  });

// save in database mongo



});
app.get("/todoScript.js", function (req, res) {
  res.sendFile(__dirname + "/todoScript.js");
});
app.post("/todo", function (req, res) {

  const inp = req.body.todoText;
  const pri = req.body.prio;
  const todoimg = req.file;

  if (!inp || !pri || !todoimg) {
    return res.status(400).send("Bad Request: Missing fields");
  }

  const todo = {
    todoText: inp,
    prio: pri,
    todoimg: todoimg.filename,
    done: "pending",
  };

  saveTodoInFile(todo, function (err, data) {
    if (err) {
      console.error("Error saving todo:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.status(200).json(todo);
    }
  });

});
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.render("login", { error: "You have been logged out" });

});
app.get("/todo-data", function (req, res) { // using ajax
  if (!req.session.isLogin) {
    res.status(401).send("error");   //to tell you are unauthorized user...
    return;
  }
  readAllTodos(function (err, data) {
    if (err) {
      res.status(500).send("error");
      return;
    }
    //res.status(200).send(JSON.stringify(data));
    res.status(200).json(data);
  });
});
app.put("/todo", function (req, res) {
  //console.log(req.body);
  statusUpdate(req, res);
});
app.delete("/todo", function (req, res) {
  // console.log(req.body);
  deleteTodoFromList(req, res);
});

function deleteTodoFromList(req, res) {
  readAllTodos(function (err, data) {
    if (err) {
      res.status(500).send("Internal Server Error");
      return;
    }
    const todo = data.find(function (todo) {
      return todo.inp === req.body.inp;
    });
    if (todo) {
      data.splice(data.indexOf(todo), 1);
      fs.writeFile("task_data.txt", JSON.stringify(data), function (err) {
        if (err) {
          res.status(500).send("Internal Server Error");
          return;
        }
        res.status(200).send("Success");
      });
    } else {
      res.status(404).send("Not Found");
    }
  });
}
/// new work of todo delete end
//database connection

db.init().then(function () {
    console.log("db connected");
    app.listen(3000, () => {
      console.log("connected on port:3000");
    });
  }).catch(function (err) {
       console.log(err);
  });

  // database and server connection close

function readAllTodos(callback) {
  fs.readFile("task_data.txt", "utf-8", function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    if (data.length === 0) {
      data = "[]";
    }

    try {
      data = JSON.parse(data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}

function saveTodoInFile(todo, callback) {
  readAllTodos(function (err, data) {
    if (err) {
      callback(err);
      return;
    }
    data.push(todo);

    fs.writeFile("task_data.txt", JSON.stringify(data), function (err) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, data);
    });
  });
}
function statusUpdate(req, res) {
  readAllTodos(function (err, data) {
    if (err) {
      res.status(500).send("Internal Server Error");
      return;
    }
    const todo = data.find(function (todo) {
     console.log("statuse_update of = ",todo);
      return todo.todoText === req.body.todoText;
    });
    if (todo) {

      todo.done = "done";
      fs.writeFile("task_data.txt", JSON.stringify(data), function (err) {
        if (err) {
          res.status(500).send("Internal Server Error");
          return;
        }
      
        res.status(200).send("Success");
      });
    } else {
      res.status(404).send("Not Found");
    }
  });
}


function ReadContent(callback) {
  fs.readFile("Content_to_index.txt", "utf-8", function (err, data) {
    if (err) {
      callback(err);
      return;
    }

    if (data.length === 0) {
      data = "[]";
    }

    try {
      data = JSON.parse(data);
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });
}