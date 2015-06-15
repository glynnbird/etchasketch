var dot = null,
 lastX = null,
 lastY = null,
 points = [],
 shaking = false,
 alertnum=1,
 doc_id = null;

var db = new PouchDB("etchasketch");
var config = new PouchDB("config");

var getTS = function() {
 return Math.round(+new Date()/1000);
};

var saveDoc = function() {
 if(doc_id === null) {
   var uuid4 = UUID.create()
   doc_id = uuid4.toString();
 }
 var doc = {
   doc_id: doc_id,
   doc_name: $('#doc_name').val(),
   points: points,
   ts: getTS()
 };
 if(doc.doc_name.length==0) {
   alert("Please name your document before saving it");
   return false;
 }
 db.post(doc, function(err, data) {
    createAlert("Document saved", doc.doc_name); 
 });
 return false;
};



var map = function(doc) {
  if(doc.doc_id) {
    emit(doc.ts, null);
  }
};

var map2 = function(doc) {
  if(doc.doc_id) {
    emit(doc.doc_id, doc._rev);
  }
};

var getDocList = function(callback) {
  var retval = { }; 
  db.query( map, { descending: true, include_docs:true}, function(err, data) {
    if(err) {
      callback(err, data);
      return;
    }
    for(var i in data.rows) {
      var doc = data.rows[i].doc;
      if(Object.keys(retval).indexOf(doc.doc_id) == -1) {
        retval[doc.doc_id] = doc;
      }
    }
    var thedocs = []
    for(var i in retval) {
      thedocs.push(retval[i]);
    }
    thedocs.sort(function(a, b){return b.ts-a.ts});
    callback(err, thedocs);
  })
};

var loadDoc = function(id) {
  reset();
  db.get(id, function(err, data){
    if(err) {
      alert("Non-existant document!", id);
      return
    }
    $('#jumbo').hide();
    $('#doc_name').val(data.doc_name);
    doc_id = data.doc_id;
    $('#loadmodal').modal('hide');
    createAlert("Document loaded", data.doc_name);  
    for(var i in data.points) {
      setXY(data.points[i][0], data.points[i][1]);
    }
  });
}

var newClicked = function() {
  reset();
  doc_id = null;
  $('#doc_name').val("");
  last_saved="";
  createAlert("New Document created", "");
  $('#jumbo').hide();
  $('#thedoc').show();
};

var deleteClicked = function(id) {
  console.log("DELETE", id);
  db.query(map2, { key: id}, function(err, data) {
    console.log(data);
    if(!err) {
      var arr = [ ]
      for(var i in data.rows) {
        var obj = { _deleted: true, _id: data.rows[i].id, _rev: data.rows[i].value };
        arr.push(obj); 
      }
      db.bulkDocs(arr, function(err, data) {
        loadClicked();
      });
    }
  })
};

var loadClicked = function() {
  $('#mydocuments').html("");
  $('#loadmodal').modal({show: true});
  getDocList(function(err, docs) {
    var html = "";
    for(var i in docs) {
      html += "<tr>\n";
      html += "<td><a href=\"Javascript:loadDoc('"+docs[i]._id+"')\">" + docs[i].doc_name + "</a></td>\n";
      html += "<td><button type=\"button\" class=\"btn btn-danger\" aria-label=\"Delete\" onclick=\"deleteClicked('" + docs[i].doc_id + "')\">\n";
      html += "Delete</button></td>\n";
      html += "</tr>";
    }
    $('#mydocuments').html(html);
  })
};


var settingsClicked = function() {
  getSyncConfig(function(err, data) {
    if(data) {
      $('#cloudanturl').val(data);
    }
    $('#settingsmodal').modal({show: true});
  });
};


var settingsSubmit = function() {
  var url = $('#cloudanturl').val();
  console.log(url);
  saveSyncConfig(url);
  initiateSync(url);
  return false;
};

var initiateSync = function(url) {
  console.log("initiating sync", url)
  db.sync(url, { retry:true});
}

var saveSyncConfig = function(url) {
  var docname = "config";
  config.get(docname, function(err, data) {
    var doc = {url : url}
    if(!err) {
      doc = data;
      doc.url = url;
    }
    config.put({url: url}, docname, function(err, data) {
      console.log("written config", err, data);
      $('#settingsmodal').modal('hide');
    });
  });
};

var getSyncConfig = function(callback) {
  config.get("config", function(err, data) {
    callback(err, (data)?data.url:null);
  });
};

var createAlert = function(title, message, keep) {
  var num = alertnum++;
  var html = "<div id=\"alert" + num + "\" class=\"alert alert-warning alert-dismissible fade in\" role=\"alert\">\n" +
             "<button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n" +
             "<span aria-hidden=\"true\">&times;</span></button>\n" +
             "<strong>" + title + "</strong> "+message +
             "</div>";
  $('#alerts').html( $('#alerts').html() + html);
  if(keep && keep===true) {

  } else {
    setTimeout(function() {
      $('#alert' + num).alert('close');
    }, 5000);
  }
};

var setXY = function(x,y,first) {
  
  
  
  x = (x<0)? 0 : x;
  x = (x>1)? 1 : x;
  y = (y<0)? 0 : y;
  y = (y>1)? 1 : y;
  
  
  var x1 = 130 + x * (670-130);
  var y1 = 130 + y * (500-130);

  // draw
  if (lastX != null) {
    var x2 = 130 + lastX*(670-130);
    var y2 = 130 + lastY*(500-130);
    var c = document.getElementById("es");
    var ctx = c.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    if(!first){
      ctx.lineTo(x1,y1);      
    }
    ctx.stroke();
  }

  // record last pos
  lastX = x;
  lastY = y;
  points.push([x,y]);
  
  // move pointer
  dot = $('#dot');
  dot.css({left:x1 + "px", top: (y1 - $('#es').height() - 5 )+ "px"});
};

var reset = function() {
  var c = document.getElementById("es");
  var ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  points = [ ];  
  setXY(lastX,lastY);  
  lastX = lastY = null;
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
  
  
  // load any pre-saved sync config
  getSyncConfig(function(err, data) {
    console.log("sync data", err, data);
    if(data && data.length>0) {
      initiateSync(data);
    }
  });
  
  
  // IoT handler
  var firstChange = true;
  var cloudant = new PouchDB("https://b44c5bdd-9188-4220-ac22-ce4506c44e5c-bluemix.cloudant.com/iot");
  cloudant.changes({ since: "now", live: true, include_docs: true})
  .on('change', function(change) {
    // handle change
    var d = change.doc.d
    x = d.potentiometer1;
    y = d.potentiometer2;
//    console.log("Change",getTS(),x,y,d.accelX,d.accelY,d.accelZ);
    if(Math.abs(d.accelY) > 0.4) {
      shake();
    }
    setXY(x, y, firstChange);
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
        setXY(lastX - 0.01, lastY);
        break;
      case 100:
        setXY(lastX + 0.01, lastY);
        break;    
      case 119:
        setXY(lastX, lastY - 0.01);
        break;
      case 115:
        setXY(lastX, lastY + 0.01);
        break;
      case 32:
        shake();
        break                   
    }
    console.log(e.which)
  });
  
});
