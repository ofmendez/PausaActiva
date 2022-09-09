import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js'
import { getDatabase, set, ref, onValue, child, push, update, remove } from 'https://www.gstatic.com/firebasejs/9.9.3/firebase-database.js'
import {loadCredentials} from './files.js'

let firebaseConfig = {}
let database ={}
let app = {}
let existDatabase = false;


const getDB = function (){
    return new Promise((resolve,reject)=>{
        if (existDatabase){
            resolve(database)
        } else{
            existDatabase =true;
            loadCredentials().then((res)=>{
                firebaseConfig =res;
                app = initializeApp(firebaseConfig);
                database = getDatabase(app);
                resolve(database);
            });
        }
    });
};

export function getUserData() {
    return new Promise((resolve,reject)=>{
        getDB().then((db)=>{
            const starCountRef = ref(db, '/usersRDS');
            onValue(starCountRef, (snapshot) => {
                resolve(snapshot.val())
            }, {
                onlyOnce: false
            });
        }).catch((e)=> reject("error getDB: "+e))
    });
}



export function updateScore(userId, newScore) {
    return new Promise((resolve,reject)=>{
        getDB().then((db)=>{
            const updates = {};
            updates['/usersRDS/' + userId+'/score'] = newScore;
            update(ref(db), updates).then(()=>{
                resolve("Updated!! ")
            });
        }).catch((e)=> reject("error getDB: "+e))
    });
}
export function updateQuestion(userId, qId, pts) {
    return new Promise((resolve,reject)=>{
        getDB().then((db)=>{
            const updates = {};
            updates['/usersRDS/' + userId+'/p'+qId] = pts;
            update(ref(db), updates).then(()=>{
                resolve("Updated!! ")
            });
        }).catch((e)=> reject("error getDB: "+e))
    });
}

export function DeleteUser(userId) {
    return new Promise((resolve,reject)=>{
        getDB().then((db)=>{
            set(ref(db, 'usersRDS/' + userId),  null ).then((res)=> resolve("DELETED!!"));
        }).catch((e)=> reject("error getDB: "+e))
    });
}


export function createUserData(userId,  name) {
    return new Promise((resolve,reject)=>{
        getDB().then((db)=>{
            set(ref(db, 'usersRDS/' + userId), {
                username: name,
                score : 0
            }).then((res)=> resolve("writted"));
        }).catch((e)=> reject("error getDB: "+e))
    });
}

// export {createUserData }