import {ñ, InsertElement, RandomInt, ConmuteClassAndInner, AnimateWithTransparent, nameToId} from './utils.js'
import {createUserData ,getUserData, updateScore,updateQuestion} from "./database.js";
import {loadDataFile} from './files.js'
import * as views from "./views.js";


let Questions = {}    
let countdownTimer = {}
let totalTime = 0 
let aviable5050 = true
let answered = {}
let totalErrors = 0

let totalPoints = 0
let pointsBySuccess = 100
let timeByAns = 25
let timeleft = timeByAns-1
let userID = ''
window.views = views
let aviableQuestions = 1
let vid

// views.GoTo("Wellcome")
views.GoTo("Registro")   
// views.GoTo("Instrucciones02") .then(()=>{
//     window.GoToLobby();
//     window.GoToLobby();
// })   
// GoRanking()


let socket = new WebSocket("ws://rds-la.com:8888/");
// let socket = new WebSocket("ws://localhost:8888/");


socket.onmessage = function(event) {
    let message = event.data;
    if (message == "inicio")
        window.GoToLobby();
    else if(message.substring(0,8) == "pregunta"){
        EnableQuestionTil(parseInt(message.slice(-1)))
    }
    console.log(message);
}

function EnableQuestionTil(id) {
    aviableQuestions =id
    let questionBtns = document.getElementsByClassName('questionBtn')
    if(questionBtns.length > 0)
        for (let i = 0; i < Questions.length; i++) 
            questionBtns[i].hidden = i >= id
} 

window.TryLogin = (form)=>{
    ñ('#btnFormLogin').classList.add('loading')
    ñ('#btnFormLogin').classList.add('avoidEvents')
    getUserData().then((res)=>{
        let exist = false
        for (const u in res) 
            if (res.hasOwnProperty(u)) 
                exist |= u===nameToId(form.elements['idNombreCompleto'].value)
        if(exist)
            views.GoTo("Wellcome")
        else
            Login(form)
        return false;

    }).catch((res)=> {
        console.log("Error login: "+res)
        alert("Ranking, Ha ocurrido un error, intente nuevamente.")
        return false;
    });
    return false;
}

window.GoToLobby = ()=>{
    socket.send(userID+"( 1 ) llegó al Lobby");
    SetLobby();
    loadDataFile("txt").then((res)=>{
        Questions = res[0].Questions;
    });
}

const Login = (form)=>{
    createUserData(
        nameToId(form.elements['idNombreCompleto'].value),
        form.elements['idNombreCompleto'].value,
    ).then((res)=>{
        userID = nameToId(form.elements['idNombreCompleto'].value);
        socket.send("( 0 )"+userID+" Ingresó! ");
        views.GoTo("Instrucciones02")
    }).catch((e)=> {
        console.log("Ha ocurrido un error, intente nuevamente." +e)
        alert("Ha ocurrido un error, intente nuevamente.")
    })
}

const SetLobby = ()=>{
    views.GoTo("EligeAmenaza").then((res)=>{
        EnableQuestionTil(aviableQuestions);
        let questionBtns = document.getElementsByClassName('questionBtn')
        let ix =0
        for (let b of questionBtns) {
            b.id = ix++; 
            if (b.id in answered){
                b.src ='../Images/IconoPregunta0'+(parseInt(b.id)+1)+(answered[b.id]?'_Bien':'_Mal')+'.svg'
            }else{
                b.classList.add('interactable');
                b.addEventListener('click', ()=> GoQuestion(b.id) );
            }
        }
    });
}



const GoToResults = ()=>{
    document.body.classList.add('avoidEvents');

    updateScore( userID, totalPoints).then((res)=>{
        views.GoTo("Resultados").then((res)=>{
            document.getElementById('correctAnswers').innerHTML =(Object.keys(answered).length-totalErrors)+'/'+Questions.length
            document.getElementById('totalTime').innerHTML =new Date(totalTime*1000).toISOString().substring(14, 19);
            document.getElementById('score').innerHTML = totalPoints;
            document.body.classList.remove('avoidEvents');
        });
    }).catch(() =>{
        alert("Ocurrió un error, intenta nuevamente.");
        document.body.classList.remove('avoidEvents');
        GoToResults();
    });
}


const GoQuestion = (qId)=>{
    views.GoTo("PreguntaVertical").then((res)=>{
        SetQuestionAndAnswers(Questions[qId]);
        SetPowerUp5050(Questions[qId])
        console.log("PArce", qId);
        if(qId == 1)
            RegisterAudio(qId)
        else
            RunTimer(Questions[qId])
        });
    }

function RegisterAudio(qId) {
    console.log("ENTRA");
    vid = document.getElementById("myAudio");
    vid.hidden =false;
    vid.onplay = function() {
        RunTimer(Questions[qId])
    };
}

//////////////////////////////////////////////////////////////////////

const SetPowerUp5050 = (q)=>{
    if(aviable5050)
        document.getElementById('powerUp5050').hidden =  false;
    document.getElementById('powerUp5050').addEventListener('click', () =>{
        document.getElementById('powerUp5050').hidden = true;
        Use5050(q)
    });
}

const Use5050 = (q)=>{
    aviable5050 = false;
    let idWrong1 = -1
    let idWrong2 = -1
    while(idWrong1 < 0  ){
        let n1 = RandomInt(4) 
        if(q.Answers[n1].isCorrect)
            continue
        idWrong1 = n1
    }
    while(idWrong2 < 0  ){
        let n2 = RandomInt(4) 
        if(q.Answers[n2].isCorrect || n2 === idWrong1)
            continue
        idWrong2 = n2
    }
    AnimateWithTransparent( document.getElementById('answer'+idWrong1), document.getElementById('answer'+idWrong2),200);
}


const ReturnLobbyOrResults = ()=>{
    if (Object.keys(answered).length === Questions.length )
        GoToResults();
    else
        SetLobby();
}

const UpdateStatus = (q, wastedTime, isCorrect)=>{
    return new Promise((resolve,reject)=>{
        updateQuestion( userID,q.id,isCorrect?(timeleft+1+pointsBySuccess):0 ).then((res)=>{
            socket.send(" Q: "+userID+" ---> "+q.id);
            answered[q.id] = isCorrect;
            totalErrors += isCorrect? 0 : 1;
            totalTime += wastedTime;
            totalPoints += isCorrect?(timeleft+1+pointsBySuccess):0;
            resolve("puntaje Guardado")
        }).catch((e) =>{
            reject("Ocurrió un error guardando el puntaje." +e);
        });
    });
}


const AnimateAnswer = (element, classTarget1, classTarget2, innerTarget, interval)=>{
    let ansText = element.innerHTML;
    ConmuteClassAndInner(element,classTarget1,classTarget2,innerTarget)
    setTimeout(() => {ConmuteClassAndInner(element,classTarget2,classTarget1,ansText)}, interval); 
    setTimeout(() => {ConmuteClassAndInner(element,classTarget1,classTarget2,innerTarget)}, interval*2); 
    setTimeout(() => {ConmuteClassAndInner(element,classTarget2,classTarget1,ansText)}, interval*3); 
    setTimeout(() => {ConmuteClassAndInner(element,classTarget1,classTarget2,innerTarget)}, interval*4);
    setTimeout(() => {ReturnLobbyOrResults(); document.body.classList.remove('avoidEvents');}, interval*5);
}

const RunTimer = (question)=>{
    document.getElementsByClassName("FondoTiempo")[0].textContent =timeByAns
    timeleft = timeByAns -1;
    countdownTimer = setInterval(() => {
        document.getElementsByClassName("FondoTiempo")[0].textContent =timeleft
        timeleft--;
        if (timeleft < 0) {
            document.body.classList.add('avoidEvents');
            clearInterval(countdownTimer);
            UpdateStatus(question, timeByAns, false).then((res)=>{
                AnimateAnswer(ñ('#Pregunta'),'RespuestaIncorrecta','FranjaPregunta',question.statement, 400);
            }).catch((e)=>{alert("223 "+e)});
        }
    }, 1000);//Second by second
}

const Answer = (ans, question)=>{
    document.body.classList.add('avoidEvents');
    clearInterval(countdownTimer);
    UpdateStatus(question, timeByAns-timeleft-1, ans.isCorrect).then((res)=>{
        let classTarget = ans.isCorrect ?'RespuestaCorrecta':'RespuestaIncorrecta';
        let innerTarget = ans.isCorrect ?'¡Correcto!':'¡Incorrecto!';
        AnimateAnswer(ñ('#answer'+ans.id), classTarget,'EstiloRespuesta', innerTarget, 400);
    }).catch((e)=>{alert("234 "+e)});
}


const SetQuestionAndAnswers = (question)=>{
    document.getElementById('Pregunta').innerHTML = question.statement;
    for(let ans of question.Answers){
        InsertElement('div',['space'+(ans.id === '0'?'2vh':'1vh')],'',document.getElementById('answersList'));
        InsertElement('div',['EstiloRespuesta'],ans.text,document.getElementById('answersList'),'answer'+ans.id).addEventListener("click", () => Answer(ans, question));
    }
}

