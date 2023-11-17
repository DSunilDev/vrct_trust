const express=require('express')
const path=require('path')
const multer = require('multer');
const bcrypt=require('bcryptjs')
const bodyParser = require('body-parser');
const fs=require('fs')

const cookieSession = require('cookie-session');
// Use express-session middleware for session handling

const isLoggedIn = (req, res, next) => {
    if (req.session.loggedIn) {
        next(); // User is logged in, proceed
    } else {
        res.redirect('/login'); // User is not logged in, redirect to login
    }
};

const app=express();

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
}));

function readVisitorCount() {
    try {
        const count = fs.readFileSync('visitor_count.txt', 'utf8');
        return parseInt(count);
    } catch (err) {
        return 0;
    }
}

function updateVisitorCount(count) {
    try {
        fs.writeFileSync('visitor_count.txt', count.toString(), 'utf8');
    } catch (err) {
        console.error('Error updating visitor count:', err);
    }
}


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


app.use(bodyParser.urlencoded({ extended: true }));

app.get('/',function(req,res)
{
    let visitorCount = readVisitorCount();
    visitorCount++; // Increment the visitor count
    updateVisitorCount(visitorCount);
    res.render('index', { visitorCount })
})


app.get('/contact',function(req,res){
    res.render('contact')
})


app.get('/about',function(req,res)
{
    res.render('about')
})

app.get('/aboutVineshRamakrishnan',function(req,res){
    res.render('aboutvinesh')
})

app.get('/signup',function(req,res){
    res.render('signup')
})

app.get('/login',function(req,res)
{
    res.render('login')
})

app.get('/Gallery',async function(req,res){
    const photodata=await db.getDb().collection('gallery').find().toArray();
    res.render('gallery',{photos:photodata})
})


app.get('/AddPost',isLoggedIn,function(req,res){
    res.render('addpost')
})

app.get('/AddGallery',isLoggedIn,function(req,res){
    res.render('addgallery')
})

app.get('/AddService',isLoggedIn,function(req,res){
    res.render('addservice')
})

app.get('/Admin',isLoggedIn,async function (req, res){
    const msgdata=await db.getDb().collection('contact').find().toArray();
    const files = fs.readdirSync('uploads/');
    res.render('admin', { messages:msgdata,files });
});

app.get('/download/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(__dirname, 'uploads', file);
    res.download(filePath);
});

app.post('/submitdonee', upload.single('file'), (req, res) => {
    res.redirect('/FormSubmit');
});

app.get('/services',async function(req,res){
    const services=await db.getDb().collection('services').find().toArray();
    res.render('services',{details:services})
})

app.get('/Post',async function(req,res)
{
    const postdata=await db.getDb().collection('post').find().toArray();
    res.render('post',{posts:postdata})
})

app.get('/Success',isLoggedIn,function(req,res){
    res.render('success')
})

app.get('/FormSubmit',function(req,res)
{
    res.render('successform')
})

app.get('/MsgSubmit',function(req,res)
{
    res.render('successcontact')
})

app.post('/process_form', async (req, res) => {
    const {name,email,message}=req.body
    // Create a new Contact document
    const newContact = {
        name:name,
        email:email,
        message:message,
        timestamp: new Date()
    };

    // Insert the document into the Contact collection
    await db.getDb().collection('contact').insertOne(newContact);
    res.redirect('/MsgSubmit');
});



app.post('/signup',async function(req,res)
{
    const userdata=req.body;
    const mail=userdata.mail;
    const password=userdata.password;

    const alreadyuser=await db.getDb().collection('users').findOne({email:mail})

    if(alreadyuser)
    {
        res.redirect("/login")
    }
else{
    const passwordd=await bcrypt.hash(password,12)

    const users={
        email:mail,
        passkey:passwordd
    };

await db.getDb().collection('users').insertOne(users);
res.redirect('/login') 
//USe it to Successful Page or Login Page
}
})

app.post('/login', async function(req, res) {
    try {
        const userdata = req.body;
        const mail = userdata.mail; // Assuming 'mail' is the correct property name
        const epassword = userdata.epassword;

        const existdata = await db.getDb().collection('users').findOne({ email: mail });

        if (!existdata) {
            return res.redirect('/signup');
        }

        const hashedPassword = existdata.passkey;

        const passwordMatch = await bcrypt.compare(epassword, hashedPassword);

        if (passwordMatch) {
            req.session.loggedIn = true;
            return res.redirect('/Admin');
        } else {
            return res.redirect('/signup');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred');
    }
});

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
        res.redirect('/Success');
});


app.post('/photo', upload.single('image'), async function (req, res) {
    const { title } = req.body;
    const image = req.file;
    
    const postdata = {
        title: title,
        imagePath: image.path
    };

    // Assuming you are using a MongoDB database
    
        await db.getDb().collection('gallery').insertOne(postdata);
        res.redirect('/Success');
});


app.post('/service', async function (req, res) {

    const { title,date,description } = req.body;
    const serdata = {
        title: title,
        date:date,
        description:description,
    };

        await db.getDb().collection('services').insertOne(serdata);
        res.redirect('/Success');
});


app.use(function(req,res)
{
    res.render("404");
})

module.exports=app;

db.connectToDatabase().then(function () {
    app.listen(500);
  });
  