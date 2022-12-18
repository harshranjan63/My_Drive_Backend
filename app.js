require('dotenv').config();
const PORT = process.env.PORT;
const express = require("express");
const app = express();

const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

//routes
const server = require('http').Server(app);
const io = require('socket.io')(server);

//Set the public folder
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    try {
        var id = socket.id;
        console.log(`A user Connected to socket id : ${id}`);
        socket.on('disconnect', msg => {
            console.log(`A user Disconnected of id : ${id}`);
        });
        socket.emit("Hello");
    } catch (error) {
        console.error(error);
        console.log(error);
        res.send(404);
    }
})
io.on("submitted", () => {
    console.log("File submitted");
})

//  io.on('message',msg=>{
//     msg.sendfile
//  })

aws.config.update({
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION
})

const BUCKET = process.env.BUCKET
const s3 = new aws.S3();

const upload = multer({
    storage: multerS3({
        s3: s3,
        acl: "public-read",
        bucket: BUCKET,
        key: function (req, file, cb) {
            console.log(file);
            cb(null, file.originalname.replace(/[&\/\\#,+()$~%'":*?<>{}]/g, ''))
        }
    })
})

app.post('/upload', upload.array('file', 20), async function (req, res, next) {
    res.send('Successfully uploaded ' + req.file + ' location!');
})

app.get("/list", async (req, res) => {
    let retobj = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    let arr = retobj.Contents.map(item => item.Key);
    res.send(arr);
})

app.get("/download/:filename", async (req, res) => {
    const filename = req.params.filename;
    let downobj = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
    res.send(downobj.Body);
})

app.delete("/delete/:filename", async (req, res) => {
    const filename = req.params.filename;
    await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise()
    res.send("Your selected file deleted successfully");
})

// app.listen(PORT,(err)=>{
//     if(err) console.log(err);
//     console.log(`YOUR APP IS LISTIONING AT http://localhost:${PORT}`)
// });

server.listen(PORT, (err) => {
    console.log(`Server listioning on http://localhost:${PORT}`);
    console.log(err);
})