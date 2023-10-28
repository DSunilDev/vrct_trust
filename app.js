const express=require('express')
const path=require('path')
const bcry=require('bcryptjs')
const multer = require('multer');

const app=express();

const db=require('./DATABASE/database');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(express.static('css'));
app.use(express.static('fonts'));

app.use(express.static('js'));
app.use(express.static('img'));
app.use(express.static('images'));

const storageconfig=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'uploads') },
        filename:function(req,file,cb)
        {
            cb(null,Date.now()+'-'+file.originalname);
 }
});

const upload=multer({storage:storageconfig});
app.use('/uploads',express.static('uploads'))




app.get('/',function(req,res)
{
    res.render('index')
})


app.get('/contact',function(req,res){
    res.render('contact')
})

app.get('/services',function(req,res){
    res.render('services')
})


app.get('/about',function(req,res)
{
    res.render('about')
})

app.get('/Gallery',function(req,res){
    res.render('gallery')
})


app.get('/AddPost',function(req,res){
    res.render('addpost')
})

app.get('/Post',async function(req,res)
{
    const postdata=await db.getDb().collection('post').find().toArray();
    res.render('post',{posts:postdata})
})


app.post('/posts', upload.single('image'), async function (req, res) {
    const { title, content,date,venue } = req.body;
    const image = req.file;
    
    const postdata = {
        title: title,
        content: content,
        date:date,
        venue:venue,
        imagePath: image.path
    };

    // Assuming you are using a MongoDB database
    
        await db.getDb().collection('post').insertOne(postdata);
        res.redirect('/Addpost');
});


module.exports=app;

db.connectToDatabase().then(function () {
    app.listen(500);
  });
  