//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-gabriel:admin123@cluster0-ujxvv.mongodb.net/todolistDB", { useNewUrlParser: true });

//define item Schema
const itemsSchema = {
  name: String
};

//define model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to-do list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

defaultItems = [item1, item2, item3];

//define list schema and model
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


//home
app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    //if DB empty, add default elements
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("Sucessfully added default items to DB");
        }});
        res.redirect("/");
    }
    else {
      //render list with elements from DB
      const day = date.getDate();
      res.render("list", { listTitle: "Today", items: foundItems });
    }
  });
});


//add item to list
app.post("/", function(req, res) {
  const listName = req.body.list;
  const itemName = req.body.newItem;
  const item = new Item ({
     name: itemName
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});


//delete item from list
app.post("/delete", function(req,res) {

  const toDelete = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: toDelete}, function(err) {
      if (err) {
        console.log(err); }
      else {
        console.log("Item was successfully removed");
        res.redirect("/");
      }
    });
  }
  else {
    //remove item from items array of list
    List.findOneAndUpdate({name: listName},
      {$pull: {items: {_id: toDelete}}},
      function(err, foundList) {
        if (err) {console.log(err);}
        else {
          res.redirect("/" + listName);
        }
      });
  }
});


//create and render custom lists
app.get("/:customList", function(req, res) {
  const listName = _.capitalize(req.params.customList);

  List.findOne({name: listName}, function(err, foundList) {
    if (err) { console.log(err); }
    else {
      //show list
      if (foundList) {
        res.render("list", {listTitle: foundList.name, items: foundList.items});
      }
      //create list
      else {
        const list = new List({
          name: listName,
          items: defaultItems });
        list.save();
        res.redirect("/" + listName);
      }
    }});
});


app.get("/about", function(req,res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log('Server has started successfully');
});
