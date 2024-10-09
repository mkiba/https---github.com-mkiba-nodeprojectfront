import express from "express";
import http from "http";
import {Server} from "socket.io";
//import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import ejs from 'ejs';
import bodyParser from "body-parser";
import {verifyPassword, generateToken,getConnectedUser, disconnect} from './src/auth/user.js';
import nodemailer from "nodemailer";
import { LocalStorage } from "node-localstorage";
import pkg from "node-ipinfo";
const { IPinfoWrapper } = pkg;
import { publicIp } from "node-public-ip";
import newsSchemas from './models/news.js';


//Weather data

const getWeather = async () => {
    const ipinfo = new IPinfoWrapper("a9f2330adf554f");

    const city = await ipinfo.lookupIp(ip);    
    //const URL = `http://api.openweathermap.org/data/2.5/weather?q=${city},uk&APPID=88472c347d732f46348629392d42c1bb`;
    const URL = `http://api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=88472c347d732f46348629392d42c1bb`;
    const OPTIONS = {
        method: "GET",
    };
    let weather = await fetch(URL, OPTIONS)
    .then((res) => {return res.json();})
    .catch((err) => {return undefined;});
    return weather;
}

//Start of Mail config
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'mkiba2024@gmail.com',
      pass: 'qcbaayqsamraasuy',
    }
  });
  

  const sendMail = (dest, subject, message) => {
    var mailOptions = {
        from: 'mkiba2024.kiba@gmail.com',
        to: dest,
        subject: subject,
        html: message
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
    
  }
//End Mail config


const formatMailAndSendMail = (dest, message) => {
    let messageToSend = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="theme-color" content="#000000" />
            <meta
            name="description"
            content="Web site created using create-react-app"
            />
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
            <title>Employees display App</title>
        </head>
        <body>
            <div class="d-flex justify-content-start bg-secondary mb-3">
                ${message}
            </div>
        </body>
        </html>
    `;
    sendMail(dest, 'Contact', messageToSend);
};


let localStorage = new LocalStorage('./scratch');
const app = express();
const server = http.createServer(app);


const PORT = 3000;

const DS_NAME = 'news';
const MONGO_URL = `mongodb://127.0.0.1:27017/${DS_NAME}?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.2.10`;

const connect = async ()  => {
    const client = await mongoose.connect(MONGO_URL);
    console.log('Connected Successfully to the Server!');
    return client;
}

const client = await connect();
//disconnect();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

app.use(express.static(import.meta.dirname+"/public"));
app.set("views", "./src/views");
app.set("view engine", "ejs");
app.engine('html', ejs.renderFile)


app.get("/", async (req, res) => {
    let user = getConnectedUser();
    let weather = {};
    const wh = await getWeather();
    if ( (wh.weather[0] != null) && (wh.weather[0] != undefined) ) {
        weather.description = wh.weather[0].description;
        weather.icon = wh.weather[0].icon;
    }
    if ( (wh.main != null) && (wh.main != undefined) ) {
        weather.temp_min = wh.main.temp_min;
        weather.temp_max = wh.main.temp_max;
    }
    if ( (wh.name != null) && (wh.name != undefined) ) {
        weather.city = wh.name;
    }
    //console.log(weather);    
    let allNews = await newsSchemas.find({}).sort({publishdate:-1}).limit(3);
    let newsSize = allNews.length;
    if (newsSize < 3) {
        let imageIndex = 0;
        for (let i = newsSize; i < 3; i++) {
            imageIndex = i+1;
            allNews.push({title: `image${imageIndex}`, description: `carousel_image${imageIndex}`, url: `void(0)`, urltoimage: `./news${imageIndex}.jpg`});
        }     
    }
    //console.log(allNews);
    res.render("home", {weather: weather, news: allNews});
});

app.get("/aboutus", async (req, res) => {
    let user = getConnectedUser();
    res.render("aboutus", {user: user});
});

app.get("/contactus", async (req, res) => {
    let user = getConnectedUser();
    res.render("contactus", {user: user});
});

app.get("/sports", async (req, res) => {
    res.render("sports");
});

app.post("/sendQuery", async (req, res) => {
    let recipient = req.body.email;
    let message = req.body.query;
    formatMailAndSendMail(recipient, message);
    res.render("home");
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

const io = new Server(server);
const ip = await publicIp();
console.log(`Server public IP is ${ip}`);

localStorage.removeItem('users');

// Handle socket traffic
io.sockets.on('connection',  (socket) => {
   
    let usersList = new Set([]);
    const ipinfo = new IPinfoWrapper("a9f2330adf554f");

    ipinfo.lookupIp(ip).then((response) => {
        let respo = JSON.stringify(response.city, null, 2)
        localStorage.setItem('userlocal', respo)
    });

    // Set the nickname property for a given client
    socket.on('nick', (nick) => {
        localStorage.setItem(`nickname_${socket.id}`, nick);
        const stringUSers = localStorage.getItem('users');
        //console.log("Retrieved users: "+stringUSers);
        let usersList = new Set([]);
        if ( (stringUSers !== undefined) && (stringUSers !== null) ){
            usersList = new Set(JSON.parse(stringUSers));
        }
        usersList.add(nick);
        const users = Array.from(usersList);
        localStorage.setItem('users', JSON.stringify(users));
        socket.emit('userlist', users);
        socket.broadcast.emit('userlist', users);
    });

   

    // Relay chat data to all clients
    socket.on('chat', (data) => {
//        socket.get('nickname', (err, nick) => {

            let nickname = localStorage.getItem(`nickname_${socket.id}`);
            if (nickname === undefined) {
                nickname = "Anonymous";
            }

            let payload = {
                message: data.message,
                nick: nickname,
                time: data.time,
                location:localStorage.getItem('userlocal')
            };

            socket.emit('chat',payload);
            socket.broadcast.emit('chat', payload);
//        });
    });
});
