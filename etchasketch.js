var dot = null,
 lastX = null,
 lastY = null,
 shaking = false;

var setXY = function(x,y,first) {
  x = (x < 130)? 130 : x;
  y = (y < 130)? 130 : y;
  x = (x > 670)? 670 : x;
  y = (y > 500)? 500 : y; 


  // draw
  if (lastX != null) {
    var c = document.getElementById("es");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastX,lastY);
    if(!first){
      ctx.lineTo(x,y);      
    }
    ctx.stroke();
  }

  
  // record last pos
  lastX = x;
  lastY = y;
  
  // move pointer
  dot = $('#dot');
  dot.css({left:x + "px", top: y - $('#es').height() + "px"});
  
  
};

var reset = function() {
  setTimeout(function() {
    var c = document.getElementById("es");
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
  }, 500);
  lastX = lastY = null;  
  setXY(50,50);  
}

var shake = function() {
  if(!shaking) {
    shaking = true;
    reset();
    $( "#es" ).effect( "shake" );
    setTimeout(function() {
      shaking = false;
    }, 1000);
  }

}

jQuery( document ).ready(function( $ ) {
  
  // reset the page
  reset();  
  
  // IoT handler
  var firstChange = true;
  var cloudant = new PouchDB("https://b44c5bdd-9188-4220-ac22-ce4506c44e5c-bluemix.cloudant.com/iot");
  cloudant.changes({ since: "now", live: true, include_docs: true})
  .on('change', function(change) {
    // handle change
    var d = change.doc.d
    x = d.potentiometer1;
    y = d.potentiometer2;
    if(Math.abs(d.accelX) > 0.4) {
      shake();
    }
    setXY(130 + x*(670 - 130), 130 + y* (500 - 130), firstChange);
    firstChange=false;
   })
  .on('error', function(e) {
    console.log("ERROR",e);
  });
  
  console.log("READY");
  // keypress handler
  $("body").keypress(function(e){
    switch(e.which) {
      case 97:
        setXY(lastX - 5, lastY);
        break;
      case 100:
        setXY(lastX + 5, lastY);
        break;    
      case 119:
        setXY(lastX, lastY - 5);
        break;
      case 115:
        setXY(lastX, lastY + 5);
        break;
      case 32:
        shake();
        break                   
    }
    console.log(e.which)
  });
  
});
