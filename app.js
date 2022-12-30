const express = require("express");
const date = require(`${__dirname}/date.js`);
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");

const app = express();

mongoose.set('strictQuery', true);

mongoose.connect("mongodb+srv://adm-narshes:admtest431@narshes.scugvyh.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
  
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
  
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
  
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res){
    const day = date.getDate();

    Item.find({}, function(err, results){
        if(results.length === 0){
            Item.insertMany(defaultItems, function(err){
                err
                ? console.log(err)
                : console.log("Succesfully saved default items to database")
            });
            res.redirect("/");
        } else{
            res.render("list", {listTitle: day, newListItems: results});
        }
    });
});
// test
app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                // Create a new List
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else{
                // Show the existing List
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    })
    
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const day = date.getDate();
    
    const item = new Item({
        name: itemName
    });

    if(listName === day){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
        });
    }
});


app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    const day = date.getDate();

    if(listName === day){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(!err){
                console.log("Succesfully removed");
                res.redirect("/")
            }
        });
    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }

    
});



// localhost:3000/about
app.get("/about", function(req, res){
    res.render("about");
});


app.listen(3000, () => {
    console.log("server running on port 3000");
});