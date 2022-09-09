import {getUserData, DeleteUser} from "./database.js";
import {nameToId, ñ} from './utils.js'

// populate table with new data
function updateTable(users, values) {
    const tbody = document.getElementById("t");
    // clear existing data from tbody if it exists
    tbody.innerHTML = "";
    let p = "";
    let id =1;
    users.forEach(user => {
        p += "<tr>";
        p += `<td>${id++}</td>`;
            values.forEach(value => {
                p += "<td>" + (user[value] !== undefined?user[value]:"-" ) + "</td>";
            })
        // p += `<td><button onclick="Delete('${user["email"]}')">DELETE!</button></td>`;
        p += "</tr>";
    })

    tbody.insertAdjacentHTML("beforeend", p);
}

window.Delete = (email)=>{
    DeleteUser(nameToId( email)).then((res)=>{
        console.log("Borrado!: ",nameToId( email));
        Reload()
    }).catch((e)=>console.log("Problema borrando: "+e));
}

window.Reload = ()=>{
    getUserData().then((usrObj)=>{
        let users = []
        for (const u in usrObj) 
            if (usrObj.hasOwnProperty(u)) 
                users.push(usrObj[u]);
        ñ('#titleTable').hidden = !(users.length > 0)
        
        users.sort((a, b) => { return b.score - a.score; });
        console.log("da: ",users.length);
        updateTable(users, ['username', 'p0','p1','p2','p3','p4','score']);
        
    })
}

// let socket = new WebSocket("ws://localhost:8888/admin");
// let socket = new WebSocket("ws://rds-la.com:8888/admin");
let socket = new WebSocket("ws://rds-la.com:8888/");

window.Next = ()=>{
    socket.send(ñ('#command').value);
}
/*
function example() {
    // fetch initial data and populate table
    fetch("https://2k03zcp0bd.execute-api.us-east-1.amazonaws.com/ninjas", {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        }
    }).then((res) => {
        res.json().then((data) => {
            updateTable(data.Items, [ 'acceptAssesment', 'email', 'score', 'timestamp', 'timestamp']);
        }).catch((err) => {
            console.log("ERROR: " + err);
        });
    });
}
*/