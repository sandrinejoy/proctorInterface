const user = {
    name: "PROCTOR",
    id: "PROCTOR",
    email:"protocr@gmail.com",
    exam:"9cd76bee-a653-4ab4-b629-1ad83eb70d80"
  };
const exm_id = "9cd76bee-a653-4ab4-b629-1ad83eb70d80";
let myrtc = {}
const herokulink='ws://intense-wave-74859.herokuapp.com/';
const localLink ='ws://localhost:9090';
const conn = new WebSocket(herokulink);
const configuration = { 
  iceServers: [
    {
      urls: "stun:global.stun.twilio.com:3478?transport=udp"
    },
    {
      username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
      credential: "tE2DajzSJwnsSbc123",
      urls: "turn:global.turn.twilio.com:3478?transport=udp"
    },
    {
      username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
      credential: "tE2DajzSJwnsSbc123",
      urls: "turn:global.turn.twilio.com:3478?transport=tcp"
    },
    {
      username: "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
      credential: "tE2DajzSJwnsSbc123",
      urls: "turn:global.turn.twilio.com:443?transport=tcp"
    }]
 }; 
const log = msg => console.log(msg)
const server_pass =(obj)=> connected ? conn.send(JSON.stringify(obj)) : log("Server Not Connected")
conn.onerror =(as)=> location.reload();
conn.onopen = ()=> {
    console.log("Connected to WebSocketServer");
    connected = true;
    server_pass({   
        from : "PROCTOR",
        to :   "SERVER",
        type : "PROCTORJOIN",
        user : user,
        exam : exm_id    
    }); 
};
conn.onmessage = message => {
  let msg = JSON.parse(message.data);
  if (msg.candidate) {
    let id = msg.user.id;
    myrtc[id].rtc.addIceCandidate(msg.candidate)
    .catch(e => {console.log("Failure during addIceCandidate(): " + e.name);});
    }
  if(msg.type == "STUDENTJOINED"){
        onStudentJoined(msg)
    }
    if(msg.type == "STUDENTDISCONNECTED"){
        onStudentDisconnected(msg);
    }
    if(msg.type =="OFFER"){
      let id = msg.user.id;
      let studsdp=msg.sdp
      if(!myrtc[id]){
          myrtc[id] = {};
      }
      myrtc[id].rtc =new webkitRTCPeerConnection(configuration);
      myrtc[id].rtc.onicecandidate = event => {
        if (event.candidate) {
            console.log("Creating Ice")
          server_pass({
            from:"PROCTOR",
            to:"CLIENT",
            user:user,
            student:id,
            type: "NEWICE",
            candidate: event.candidate
          });
        }
      };
      myrtc[id].rtc.setRemoteDescription(studsdp);
      myrtc[id].tracknumber=0;
      myrtc[id].rtc.ontrack = ({streams:[stream]}) =>{
        if(myrtc[id].tracknumber==0)
        document.getElementById("cam").srcObject = stream;
        else
        document.getElementById("screen").srcObject = stream;
        myrtc[id].tracknumber+=1;
      }
      myrtc[id].rtc.createAnswer()
      .then(answer=>{return myrtc[id].rtc.setLocalDescription(answer);})
      .then(()=>{server_pass({ 
                  from : "PROCTOR",
                  to : "CLIENT",
                  type: "ANSWER",
                  user: msg.user,
                  exam: msg.exam,
                  sdp: myrtc[id].rtc.localDescription
              });
          })
        .catch(handleGetUserMediaError=>{
            console.log(handleGetUserMediaError);
        });  
    }
   

  }
  
  
  function onStudentJoined(payload){
    addCameraFeed(payload);
    
  }

  function onStudentDisconnected(payload){
    removeCameraFeed(payload);
  }

  function addCameraFeed(payload){
    name = payload.student_conn.credentials.user.id;
    var cameralist = document.getElementById("webcams");
    var camerapannel = document.createElement("div");
    camerapannel.id =  "CameraObj_"+name;
    camerapannel.className = "camera_obj";
    var vid_obj = document.createElement("video");
    vid_obj.id = "video_cam_"+name;
    vid_obj.className = "camera_obj_video";
    vid_obj.poster = "a.gif";
    vid_obj.autoplay = true;
    camerapannel.appendChild(vid_obj);
    var nameobj = document.createElement("div");
    nameobj.className = "camera_obj_name";
    nameobj.innerHTML = "<b>" + name + "</b>";
    camerapannel.appendChild(nameobj);
    cameralist.append(camerapannel);

    var screenlist = document.getElementById("computers");
    var screenpannel = document.createElement("div");
    screenpannel.id =  "ScreenObj_"+name;
    screenpannel.className = "camera_obj";
    var vid_obj2 = document.createElement("video");
    vid_obj2.id = "screen"+name;
    vid_obj2.className = "camera_obj_video";
    vid_obj2.poster = "a.gif";
    vid_obj2.autoplay = true;
    screenpannel.appendChild(vid_obj2);
    var nameobj2 = document.createElement("div");
    nameobj2.className = "camera_obj_name";
    nameobj2.innerHTML = "<b>" + name + "</b>";
    screenpannel.appendChild(nameobj2);
    screenlist.append(screenpannel);

  }

  function removeCameraFeed(payload){
    try{
      document.getElementById("CameraObj_"+payload.student_conn.credentials.user.id).remove();
      document.getElementById("ScreenObj_"+payload.student_conn.credentials.user.id).remove();
      
    }catch(err){

    }
    
  }
  