import jwt from "jsonwebtoken";
import { LocalStorage } from "node-localstorage";
import config from "../config/config.js";

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
}

const verifyPassword = async (password, storedPassword) => {
    //const isPasswordValid = await bcrypt.compare(password, storedPassword);
    //return isPasswordValid;
    return password === storedPassword;
}

let localStorage = new LocalStorage(`./${config.storage}`);

const generateToken = (user) => {
    let token = jwt.sign({name: user.name, admin: user.admin}, config.secret, {expiresIn: 86400});
    //console.log(token);
    localStorage.setItem("connectedUser", token);
}

const disconnect = () => {
    localStorage.removeItem("connectedUser");
}

const getConnectedUser = () => {
    var token = localStorage.getItem("connectedUser");

    if (!token) {
        return {name: '', admin: 0};
    }
    
    let verifiedToken = jwt.verify(token, config.secret);
    return verifiedToken;
}

export {hashPassword, verifyPassword, generateToken,getConnectedUser, disconnect};