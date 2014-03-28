if(!String.prototype.trim){String.prototype.trim=function(){return this.replace(/^\s+|\s+$/g,"")
}
}KmlMapParser=function(config){if(config===undefined){throw"KmlMapParser internal error: needs Configuration options especially the map!"
}this.origConfig=config;
this.config=config;
this.kmlFile=config.kml?config.kml:config.kmlFile;
this.map=config.map;
if(config.imageDirectory!==undefined){this.imageDirectory=config.imageDirectory
}this.sidebarId=config.sidebarId?this.config.sidebarId:"the_side_bar";
this.showMarkers=(config.showMarkers!==undefined)?this.config.showMarkers:true;
this.showSidebar=(config.showSidebar!==undefined)?this.config.showSidebar:true;
this.showSidebarDescriptions=(config.showSidebarDescriptions!==undefined)?this.config.showSidebarDescriptions:true;
this.showBubble=(config.showBubble!==undefined)?this.config.showBubble:true;
if(this.showBubble){this.showSidebarBubble=(config.showSidebarBubble!==undefined)?this.config.showSidebarBubble:false
}else{this.showSidebarBubble=false
}this.showFolders=(config.showFolders!==undefined)?this.config.showFolders:true;
if(this.showFolders){this.allFoldersOpen=(config.allFoldersOpen!==undefined)?this.config.allFoldersOpen:undefined
}this.defaultImageSize=(config.imageSize!==undefined)?this.config.imageSize:{width:32,height:32};
this.defaultHotspot=(config.imageHotspot!==undefined)?this.config.imageHotspot:{x:16,y:32};
this.showImageShadow=(config.showImageShadow!==undefined)?this.config.showImageShadow:true;
this.showMultiPointsAsMarkers=(config.showMultiPointsAsMarkers!==undefined)?this.config.showMultiPointsAsMarkers:false;
this.showRootName=(config.showRootName!==undefined)?this.config.showRootName:true;
this.showDragZoomButton=(config.showDragZoomButton!==undefined)?this.config.showDragZoomButton:false;
if(this.showDragZoomButton){this.dragZoomButtonImage=(config.dragZoomButtonImage!==undefined)?this.config.dragZoomButtonImage:"http://maps.gstatic.com/mapfiles/ftr/controls/dragzoom_btn.png"
}this.useMapCenter=(config.useMapCenter!==undefined)?this.config.useMapCenter:false;
if(this.useMapCenter){this.mapCenter=this.map.getCenter()
}this.defaultZoomLevel=(config.zoomLevel!==undefined)?this.config.zoomLevel:15;
this.shouldZoom=(config.zoomOnClick!==undefined)?this.config.zoomOnClick:true;
if(config.highlightColor===undefined){this.highlightColor="#aaffff"
}else{this.highlightColor=config.highlightColor
}this.showOverlaysInSidebar=(config.showOverlaysInSidebar!==undefined)?this.config.showOverlaysInSidebar:true;
if(config.afterParseFn===undefined){this.hasAfterParse=false
}else{this.hasAfterParse=true;
this.afterParseFn=config.afterParseFn
}this.infoWindow=new google.maps.InfoWindow();
this.mapshapes=[];
this.folderIndex=0;
this.placemarkIndex=0;
this.overlayIndex=0;
this.zindex=100;
if(this.showDragZoomButton){this.enableDragZoom()
}if(this.kmlFile!==undefined){this.parse(this.kmlFile)
}};
KmlMapParser.prototype={parse:function(urls){if(typeof urls==="string"){urls=[urls]
}this.docSet={docs:[],remaining:urls.length};
for(var i=0;
i<urls.length;
i++){this.parseUrl(urls[i],i)
}},parseUrl:function(url,num){var baseUrl=url.split("?")[0],doc={baseUrl:baseUrl,url:url,id:num};
this.docSet.docs.push(doc);
var that=this,render=this.render,callback=function(responseXML){render(responseXML,doc,that)
};
this.fetchXMLdoc(url,callback)
},getDocumentById:function(docId){var iDocId=(typeof docId==="string")?parseInt(docId,10):docId;
return this.docSet.docs[docId]
},hideDocumentById:function(docId){var doc=this.getDocumentById(docId);
if(doc&&doc.isVisible){this.setVisibilityByDoc(doc,false)
}},showDocumentById:function(docId){var doc=this.getDocumentById(docId);
if(doc&&!doc.isVisible){this.setVisibilityByDoc(doc,true)
}},setVisibility:function(isVisible){this.setVisibilityOnMarkers(isVisible);
this.setOverlayVisibility(isVisible);
if(this.showSidebar&&!!this.sidebarId){var side=document.getElementById(this.sidebarId);
if(side!==null){this.setVisibilitybyNode(side,isVisible)
}}},setVisibilityOnMarkers:function(isVisible,docId){var ms=this.mapshapes,mss,shapeId;
for(shapeId in ms){if(ms.hasOwnProperty(shapeId)){mss=ms[shapeId];
if((docId!==undefined&&mss.docId===docId)||(docId===undefined)){this.setMapObjectVisibility(mss,isVisible)
}}}},setVisibilityByDoc:function(doc,isVisible){var docRoot=document.getElementById("doc-"+doc.id),i,overlayId,overlay;
if(doc!==undefined&&doc.isVisible!==isVisible){this.setVisibilityOnMarkers(isVisible,doc.id);
if(doc.hasOverlays){for(i=0;
i<doc.overlays.length;
i++){this.setOverlayVisibility(doc.overlays[i].overlay,isVisible)
}}if(this.showSidebar&&docRoot!==null){this.setVisibilitybyNode(docRoot,isVisible)
}doc.isVisible=isVisible
}},setMapObjectVisibility:function(shape,isVisible){if(typeof shape==="object"){if(isVisible){shape.setMap(this.map)
}else{shape.setMap(null)
}}},setOverlayVisibilityByDocId:function(docId,isVisible){var doc=this.getDocumentById[docId];
if(doc!==undefined&&doc.hasOverlays){for(i=0;
i<doc.overlays.length;
i++){this.setVisibilitybyOverlay(doc.overlays[i].overlay,isVisible)
}}},setOverlayVisibilityById:function(id,isVisible){var docs=this.docSet.docs,doc,overlay,i,j;
if(docs.length>0){for(i=0;
i<docs.length;
i++){doc=docs[i];
if(doc!==undefined&&doc.hasOverlays){for(j=0;
j<doc.overlays.length;
j++){overlay=doc.overlays[j].overlay;
if(id&&id===overlay.id_){this.setVisibilitybyOverlay(overlay,isVisible)
}}}}}},setVisibilitybyOverlay:function(overlay,isVisible){if(overlay!==undefined&&overlay!==null){overlay.setVisibility(isVisible)
}},setOverlayVisibility:function(isVisible){var docs=this.docSet.docs,doc,overlay,i,j;
if(docs.length>0){for(i=0;
i<docs.length;
i++){doc=docs[i];
if(doc!==undefined&&doc.hasOverlays){for(j=0;
j<doc.overlays.length;
j++){overlay=doc.overlays[j].overlay;
this.setVisibilitybyOverlay(overlay,isVisible)
}}}}},setOverlayOpacity:function(opacity){var docs=this.docSet.docs,doc,overlay,i,j;
if(docs.length>0){for(i=0;
i<docs.length;
i++){doc=docs[i];
if(doc!==undefined&&doc.hasOverlays){for(j=0;
j<doc.overlays.length;
j++){overlay=doc.overlays[j].overlay;
this.setOpacityByOverlay(overlay,opacity)
}}}}},setOverlayOpacityByDocId:function(docId,opacity){var doc=this.getDocumentById[docId];
if(doc!==undefined&&doc.hasOverlays){for(i=0;
i<doc.overlays.length;
i++){this.setOverlayOpacity(doc.overlays[i],opacity)
}}},setOpacityByOverlay:function(overlay,opacity){this.setVisibilitybyOverlay(overlay,true);
overlay.setOpacity(opacity)
},clearMap:function(){if(this.docSet&&this.docSet.docs){var docs=this.docSet.docs,ms=this.mapshapes,doc,i,j,mss,shapeId,overlay,side;
if(docs.length>0){for(i=0;
i<docs.length;
i++){doc=docs[i];
if(doc!==undefined&&doc.hasOverlays){for(j=0;
j<doc.overlays.length;
j++){overlay=doc.overlays[j].overlay;
overlay.setMap(null)
}}}}this.setVisibilityOnMarkers(false);
if(this.showSidebar&&!!this.sidebarId){side=document.getElementById(this.sidebarId);
if(side!==null){side.innerHTML=""
}}this.mapshapes=[];
this.folderIndex=0;
this.placemarkIndex=0;
this.zindex=100;
this.kmlFile=undefined;
this.docSet=undefined
}},filterSidebar:function(text){if(text===undefined||text===null){text=""
}var t=text.toLowerCase().trim(),isVisible,side;
if(this.showSidebar&&!!this.sidebarId){side=document.getElementById(this.sidebarId);
if(side!==null){var nodes=side.getElementsByTagName("li"),i,node,li;
if(nodes!==null&&nodes.length>0){for(i=0;
i<nodes.length;
i++){node=nodes[i];
if(-1!==node.className.search("placemark")){val=this.getNodeValue(node).toLowerCase();
if(t!==undefined){isVisible=(val.search(t)!==-1)?true:false
}this.setVisibilitybyNode(node,isVisible)
}}}}}},filterMarkers:function(text){if(text===undefined||text===null){text=""
}var t=text.toLowerCase().trim(),isVisible,ms=this.mapshapes,mss,shapeId,it;
for(shapeId in ms){if(ms.hasOwnProperty(shapeId)){mss=ms[shapeId];
if(t===undefined&&t===""){this.setMapObjectVisibility(mss,true)
}else{descrip=mss.description;
if(descrip!==undefined){it=descrip.toLowerCase();
isVisible=(it.search(t)!==-1)?true:false;
this.setMapObjectVisibility(mss,isVisible)
}}}}},filterMap:function(text){if(text===undefined||text===null){text=""
}var t=text.toLowerCase().trim();
this.filterSidebar(t);
this.filterMarkers(t)
},xmlParse:function(str){if(typeof ActiveXObject!=="undefined"&&typeof GetObject!=="undefined"){var doc=new ActiveXObject("Microsoft.XMLDOM");
doc.loadXML(str);
return doc
}if(typeof DOMParser!=="undefined"){return(new DOMParser()).parseFromString(str,"text/xml")
}return createElement("div",null)
},fetchXMLdoc:function(url,callback){var callBack=callback,xmlParse=this.xmlParse,req=false;
if(window.XMLHttpRequest&&!(window.ActiveXObject)){req=new window.XMLHttpRequest()
}else{if(window.ActiveXObject){req=new window.ActiveXObject("Microsoft.XMLHTTP")
}}if(req){req.open("GET",url,true);
req.onreadystatechange=function(){if(req.readyState===4){if(!!this.xhrtimeout){clearTimeout(this.xhrtimeout)
}if(req.status===200){callBack(xmlParse(req.responseText))
}else{callBack()
}}};
this.xhrtimeout=setTimeout(function(){callBack()
},120000);
req.send("")
}else{callBack(null)
}},setVisibilitybyNode:function(node,isVisible){if(isVisible){node.style.display="block"
}else{node.style.display="none"
}},getNodeValue:function(node){if(node===undefined||node===null){return""
}else{return(node.innerText||node.text||node.textContent).trim()
}},getBooleanValue:function(node){var val=this.getNodeValue(node);
switch(val.toLowerCase()){case"true":case"yes":case"1":return true;
case"false":case"no":case"0":case null:return false;
default:return true
}},findStyle:function(node,styles,styleId){var style;
if(styles[styleId]===undefined){styles[styleId]={width:4,fill:true,outline:true}
}var styleNodes=node.getElementsByTagName("IconStyle");
if(styleNodes&&styleNodes.length>0){style=styleNodes[0];
var hotspot=style.getElementsByTagName("hotSpot")[0],scale=this.getNodeValue(style.getElementsByTagName("scale")[0]),w=parseInt(this.defaultImageSize.width,10),h=parseInt(this.defaultImageSize.height,10),x=parseInt(this.defaultHotspot.x,10),y=parseInt(this.defaultHotspot.y,10);
if(hotspot!==null&&hotspot!==undefined){x=parseInt(hotspot.getAttribute("x"),10);
y=parseInt(hotspot.getAttribute("y"),10)
}if(!isNaN(scale)){scale=1
}styles[styleId]={href:this.getNodeValue(style.getElementsByTagName("href")[0]),size:{width:w,height:h},scale:scale,anchor:{x:x,y:y}}
}styleNodes=node.getElementsByTagName("LineStyle");
if(styleNodes&&styleNodes.length>0){style=styleNodes[0];
styles[styleId].color=this.getNodeValue(style.getElementsByTagName("color")[0]);
styles[styleId].width=this.getNodeValue(style.getElementsByTagName("width")[0])
}styleNodes=node.getElementsByTagName("PolyStyle");
if(styleNodes&&styleNodes.length>0){style=styleNodes[0];
styles[styleId].color=this.getNodeValue(style.getElementsByTagName("color")[0]);
styles[styleId].fill=this.getBooleanValue(style.getElementsByTagName("fill")[0]);
styles[styleId].outline=this.getBooleanValue(style.getElementsByTagName("outline")[0])
}return styles[styleId]
},convertStyles:function(styles){var styleId;
for(styleId in styles){if(styles.hasOwnProperty(styleId)){this.convertKmlStyle(styles[styleId])
}}return styles
},convertKmlStyle:function(style){var zeroPoint=new google.maps.Point(0,0),size=style.size,scale=style.scale,anchor=style.anchor;
if(style&&style.href!==undefined&&style.href!==""){var anchorPoint=new google.maps.Point(anchor.x*scale,anchor.y*scale),imageSize=new google.maps.Size(size.width*scale,size.height*scale),href=style.href;
if(this.imageDirectory!==undefined){var hrefs=href.split("/"),image;
if(hrefs.length>0){image=hrefs[hrefs.length-1];
style.href=this.imageDirectory+"/"+image;
href=style.href
}}style.icon=new google.maps.MarkerImage(href,imageSize,zeroPoint,anchorPoint,imageSize);
if(this.showImageShadow){var regEx=/\/(blue|red|green|ltblue|lightblue|yellow|purple|pink)\.png/,shadowSize=new google.maps.Size(size.width*scale*2,size.height*scale);
if(regEx.test(href)){style.shadow=new google.maps.MarkerImage("http://maps.google.com/mapfiles/ms/micons/msmarker.shadow.png",shadowSize,zeroPoint,anchorPoint)
}else{if(href.indexOf("-pushpin.png")>-1){style.shadow=new google.maps.MarkerImage("http://maps.google.com/mapfiles/ms/micons/pushpin_shadow.png",shadowSize,zeroPoint,anchorPoint)
}}}}},render:function(responseXML,doc,scope){if(!responseXML){}else{if(!doc){throw"KmlMapParser error: render called with null document"
}else{var i,styles={};
doc.isRoot=true;
doc.folders=[];
doc.placemarks=[];
doc.overlays=[];
doc.isVisible=true;
var styleId,pnNode,styleNode,styleNodeId,nodes=responseXML.getElementsByTagName("Style"),nodeCount=nodes.length;
for(i=0;
i<nodeCount;
i++){styleNode=nodes[i];
styleNodeId=styleNode.getAttribute("id");
if(styleNodeId!==null){styleId="#"+styleNodeId;
scope.findStyle(styleNode,styles,styleId)
}}doc.styles=scope.convertStyles(styles);
var s=doc.baseUrl.lastIndexOf("/"),docFileName=doc.baseUrl;
if(s>-1){docFileName=doc.baseUrl.slice(s+1)
}doc.fileName=docFileName;
var docName=responseXML.getElementsByTagName("name")[0],docTag=docName.parentNode.tagName;
if(docTag==="Document"||docTag==="document"){docName=scope.getNodeValue(docName)
}else{var p=docFileName.lastIndexOf(".");
docName=(p>-1)?docFileName.substring(0,p):docFileName
}doc.name=docName;
var folderNodes=responseXML.getElementsByTagName("Folder"),placemarkNodes,parentFolder=doc;
if(folderNodes===undefined||(folderNodes&&folderNodes.length===0)){doc.hasFolders=false;
placemarkNodes=responseXML.getElementsByTagName("Placemark");
if(placemarkNodes&&placemarkNodes.length>0){doc.hasPlacemarks=true;
scope.findPlacemarks(doc,placemarkNodes,doc)
}else{doc.hasPlacemarks=false
}var groundNodes=responseXML.getElementsByTagName("GroundOverlay");
if(groundNodes&&groundNodes.length>0){doc.hasOverlays=true;
scope.findOverlays(doc,groundNodes,doc)
}else{doc.hasOverlays=false
}}else{doc.hasFolders=true;
doc.hasPlacemarks=false;
doc.hasOverlays=false;
scope.processChildren(doc,responseXML.documentElement)
}scope.createMapObjects(doc);
if(scope.showSidebar){scope.createSidebar(doc)
}scope.docSet.remaining-=1;
if(scope.docSet.remaining===0){if(scope.useMapCenter){scope.map.setCenter(scope.mapCenter)
}else{scope.map.fitBounds(scope.bounds)
}if(scope.hasAfterParse){scope.afterParseFn(doc)
}}}}},processChildren:function(doc,node,parentFolder){var i,child,pf;
for(i=0;
i<node.childNodes.length;
i++){child=node.childNodes[i];
if(child.nodeType===1){switch(child.tagName){case"Folder":pf=parentFolder!==undefined?parentFolder:doc;
pf.hasFolders=true;
this.findFolders(doc,child,pf);
break;
case"Placemark":pf=parentFolder!==undefined?parentFolder:doc;
pf.hasPlacemarks=true;
this.createPlacemark(doc,child,pf);
break;
case"GroundOverlay":pf=parentFolder!==undefined?parentFolder:doc;
pf.hasOverlays=true;
this.findOverlays(doc,child,pf);
break;
case"Document":this.processChildren(doc,child);
break;
case"Kml":this.processChildren(doc,child);
break;
default:break
}}}return 
},findFolders:function(doc,folderNode,parentFolder){var placemarkNodes,groundNodes,parentName=parentFolder.name,pnNode=folderNode.parentNode,pnNodeName=this.getNodeValue(pnNode.getElementsByTagName("name")[0]),folderName=this.getNodeValue(folderNode.getElementsByTagName("name")[0]),open=(this.allFoldersOpen!==undefined)?this.allFoldersOpen:this.getBooleanValue(folderNode.getElementsByTagName("open")[0]),folderId=doc.id+"-"+this.folderIndex++,folder={id:folderId,name:folderName,isOpen:open,folders:[],hasFolders:false,placemarks:[],hasPlacemarks:false,hasOverlays:false},subNodes=folderNode.getElementsByTagName("Folder");
if(subNodes&&subNodes.length>0){folder.hasFolders=true;
parentFolder.folders.push(folder);
this.processChildren(doc,folderNode,folder)
}else{placemarkNodes=folderNode.getElementsByTagName("Placemark");
if(placemarkNodes&&placemarkNodes.length>0){folder.hasPlacemarks=true;
this.findPlacemarks(doc,placemarkNodes,folder,parentFolder)
}else{folder.hasPlacemarks=false
}groundNodes=folderNode.getElementsByTagName("GroundOverlay");
if(groundNodes&&groundNodes.length>0){folder.hasOverlays=true;
this.findOverlays(doc,groundNodes,folder,parentFolder)
}else{folder.hasOverlays=false
}parentFolder.folders.push(folder)
}},findPlacemarks:function(doc,placemarkNodes,folder,parentFolder){var pm,node,nodeName;
for(pm=0;
pm<placemarkNodes.length;
pm++){node=placemarkNodes[pm];
nodeName=this.getNodeValue(node.getElementsByTagName("name")[0]);
folder.hasPlacemarks=true;
doc.hasPlacemarks=true;
if(nodeName!==folder.name){this.createPlacemark(doc,node,folder)
}else{folder.hasFolders=false;
this.createPlacemark(doc,node,folder)
}}},createPlacemark:function(doc,placemarkNode,folder){var style,docStyles=doc.styles,placemark={folderId:folder.id,folderName:folder.name,name:this.getNodeValue(placemarkNode.getElementsByTagName("name")[0]),description:this.getNodeValue(placemarkNode.getElementsByTagName("description")[0]),styleUrl:this.getNodeValue(placemarkNode.getElementsByTagName("styleUrl")[0]),shape:[]},inlineStyles=placemarkNode.getElementsByTagName("Style"),regex=/^https?:\/\//,multi=placemarkNode.getElementsByTagName("MultiGeometry");
placemark.style=doc.styles[placemark.styleUrl]||{width:4,fill:true,outline:true};
if(inlineStyles&&(inlineStyles.length>0)){style=this.findStyle(node,docStyles,"inline");
this.convertKmlStyle(style);
if(style){placemark.style=style
}}if(regex.test(placemark.description)){placemark.description=['<a href="',placemark.description,'">',placemark.description,"</a>"].join("")
}placemark.multi=(multi.length>0)?true:false;
this.processPlacemarkCoords(placemark,placemarkNode);
placemark.id=folder.id+"-"+this.placemarkIndex++;
if(folder!==doc){doc.placemarks.push(placemark)
}folder.placemarks.push(placemark)
},createMapObjects:function(doc){if(!!google.maps){var pm,i,j,placemark,shapes,shape,latlng,coords,coord,path,bounds,poly,found=false,placemarks=doc.placemarks;
this.bounds=this.bounds||new google.maps.LatLngBounds();
for(pm=0;
pm<placemarks.length;
pm++){placemark=placemarks[pm];
shapes=placemark.shape;
for(i=0;
i<shapes.length;
i++){shape=shapes[i];
if(shape.point){coord=shape.point.coordinates[0];
latlng=new google.maps.LatLng(coord.lat,coord.lng);
this.bounds.extend(latlng);
placemark.points=placemark.points||[];
marker=this.createMarker(doc,placemark,latlng,i);
marker.active=true
}else{if(shape.circle){coord=shape.circle.coordinates[0];
latlng=new google.maps.LatLng(coord.lat,coord.lng);
this.bounds.extend(latlng);
placemark.circles=placemark.circles||[];
circle=this.createCircle(doc,placemark,latlng,i);
circle.active=true
}else{if(shape.linestring||shape.polygon){coords=shape.linestring?shape.linestring[0].coordinates:shape.polygon[0].coordinates;
path=[];
bounds=new google.maps.LatLngBounds();
for(j=0;
j<coords.length;
j++){coord=coords[j];
latlng=new google.maps.LatLng(coord.lat,coord.lng);
path.push(latlng);
bounds.extend(latlng)
}if(shape.linestring){placemark.lines=placemark.lines||[];
poly=this.createPolyline(doc,placemark,path,bounds,i)
}else{placemark.areas=placemark.areas||[];
poly=this.createPolygon(doc,placemark,path,bounds,i)
}poly.active=true;
this.bounds.union(bounds)
}}}}}}},createMarker:function(doc,placemark,latlng,shapeNumber){var content="<div><h3>"+placemark.name+"</h3><div>"+placemark.description+"</div></div>",marker,markerOptions={folderId:placemark.folderId,map:this.map,position:latlng,title:placemark.name,zIndex:this.zindex++,description:content,clickable:true};
if(placemark.style.icon!==undefined){markerOptions.icon=placemark.style.icon
}if(placemark.style.shadow!==undefined){markerOptions.shadow=placemark.style.shadow
}marker=new google.maps.Marker(markerOptions);
marker.id=placemark.id+"-"+shapeNumber;
marker.docId=doc.id;
if(this.showBubble){var that=this;
google.maps.event.addListener(marker,"click",function(){that.openBubble(marker)
})
}this.mapshapes[marker.id]=marker;
placemark.marker=marker;
placemark.points.push(marker);
marker.setMap(this.map);
return marker
},createCircle:function(doc,placemark,latlng,shapeNumber){var content="<div><h3>"+placemark.name+"</h3><div>"+placemark.description+"</div></div>",rgb=this.getRGBColorTransparency(placemark.style.color),circleOptions={map:this.map,center:latlng,radius:20,position:latlng,strokeColor:rgb.color,strokeWeight:placemark.style.width,strokeOpacity:rgb.opacity,fillColor:rgb.color,fillOpacity:rgb.opacity,title:placemark.name,description:content,folderId:placemark.folderId,zIndex:this.zindex++},circle=new google.maps.Circle(circleOptions);
circle.id=placemark.id+"-"+shapeNumber;
circle.docId=doc.id;
if(this.showBubble){var that=this;
google.maps.event.addListener(circle,"click",function(){that.openBubble(circle)
})
}this.mapshapes[circle.id]=circle;
placemark.circles.push(circle);
placemark.mapObject=circle;
circle.setMap(this.map);
return circle
},createPolyline:function(doc,placemark,path,bounds,shapeNumber){var point=path[Math.floor(path.length/2)],content="<div><h3>"+placemark.name+"</h3><div>"+placemark.description+"</div></div>",rgb=this.getRGBColorTransparency(placemark.style.color),polyOptions={map:this.map,path:path,position:point,strokeColor:rgb.color,strokeWeight:placemark.style.width,strokeOpacity:rgb.opacity,title:placemark.name,description:content,folderId:placemark.folderId,zIndex:this.zindex++},poly=new google.maps.Polyline(polyOptions);
poly.bounds=bounds;
poly.id=placemark.id+"-"+shapeNumber;
poly.docId=doc.id;
if(this.showBubble){var that=this;
google.maps.event.addListener(poly,"click",function(){that.openBubble(poly)
})
}this.mapshapes[poly.id]=poly;
placemark.lines.push(poly);
placemark.mapObject=poly;
poly.setMap(this.map);
return poly
},createPolygon:function(doc,placemark,paths,bounds,shapeNumber){var point=bounds.getCenter(),content="<div><h3>"+placemark.name+"</h3><div>"+placemark.description+"</div></div>",rgb=this.getRGBColorTransparency(placemark.style.color);
var polyOptions={map:this.map,paths:paths,title:placemark.name,position:point,strokeColor:rgb.color,strokeWeight:placemark.style.width,strokeOpacity:rgb.opacity,fillColor:rgb.color,fillOpacity:rgb.opacity,description:content,folderId:placemark.folderId,zIndex:this.zindex++};
var poly=new google.maps.Polygon(polyOptions);
poly.bounds=bounds;
poly.id=placemark.id+"-"+shapeNumber;
poly.docId=doc.id;
if(this.showBubble){var that=this;
google.maps.event.addListener(poly,"click",function(){that.openBubble(poly)
})
}this.mapshapes[poly.id]=poly;
placemark.areas.push(poly);
placemark.mapObject=poly;
poly.setMap(this.map);
return poly
},processShape:function(geometry,placemark,node){switch(geometry){case"MultiGeometry":this.processPlacemarkCoords(placemark,node);
break;
case"LinearRing":placemark.shape.push({polygon:this.getCoords(node,"LinearRing")});
break;
case"Polygon":placemark.shape.push({polygon:this.getCoords(node,"LinearRing")});
break;
case"Point":placemark.shape.push({point:this.getCoords(node,"Point")[0]});
break;
case"Circle":placemark.shape.push({circle:this.getCoords(node,"Point")[0]});
break;
case"LineString":placemark.shape.push({linestring:this.getCoords(node,"LineString")});
break;
default:break
}return placemark
},processPlacemarkCoords:function(placemark,node){var shapeNodes=node.getElementsByTagName("Point"),i;
if(shapeNodes.length>0){for(i=0;
i<shapeNodes.length;
i++){if(placemark.multi&&!this.showMultiPointsAsMarkers){this.processShape("Circle",placemark,shapeNodes[i])
}else{this.processShape("Point",placemark,shapeNodes[i])
}}}this.processShapeNodes(placemark,node,"LineString");
this.processShapeNodes(placemark,node,"LinearRing");
this.processShapeNodes(placemark,node,"Polygon");
return placemark
},processShapeNodes:function(placemark,node,shape){var shapeNodes=node.getElementsByTagName(shape);
if(shapeNodes.length>0){for(i=0;
i<shapeNodes.length;
i++){this.processShape(shape,placemark,shapeNodes[i])
}}},getCoords:function(node,tag){var coordListA=[],i,j,coords,path,pathLength,coordList,k,coordNodes=node.getElementsByTagName("coordinates");
if(!coordNodes){return[{coordinates:[]}]
}for(j=0;
j<coordNodes.length;
j++){coords=this.getNodeValue(coordNodes[j]).trim();
coords=coords.replace(/,\s+/g,",");
path=coords.split(/\s+/g);
pathLength=path.length;
coordList=[];
for(k=0;
k<pathLength;
k++){coords=path[k].split(",");
coordList.push({lat:parseFloat(coords[1]),lng:parseFloat(coords[0]),alt:parseFloat(coords[2])})
}coordListA.push({coordinates:coordList})
}return coordListA
},findOverlays:function(doc,groundNodes,folder,parentFolder){var node,groundOverlay,color,overlay,id;
doc.overlays=doc.overlays||[];
for(i=0;
i<groundNodes.length;
i++){node=groundNodes[i];
groundOverlay={name:this.getNodeValue(node.getElementsByTagName("name")[0]),description:this.getNodeValue(node.getElementsByTagName("description")[0]),icon:{href:this.getNodeValue(node.getElementsByTagName("href")[0])},latLonBox:{north:parseFloat(this.getNodeValue(node.getElementsByTagName("north")[0])),east:parseFloat(this.getNodeValue(node.getElementsByTagName("east")[0])),south:parseFloat(this.getNodeValue(node.getElementsByTagName("south")[0])),west:parseFloat(this.getNodeValue(node.getElementsByTagName("west")[0]))}};
id=node.getAttribute("id");
groundOverlay.id=(id!==null)?id:"overlayview-"+this.overlayIndex++;
var box=groundOverlay.latLonBox,bounds=new google.maps.LatLngBounds(new google.maps.LatLng(box.south,box.west),new google.maps.LatLng(box.north,box.east));
groundOverlay.bounds=bounds;
if(this.bounds){this.bounds.union(bounds)
}color=this.getNodeValue(node.getElementsByTagName("color")[0]);
if((color!=="")&&(color.length===8)){var rgb=this.getRGBColorTransparency(color);
this.overlayOpacity=rgb.opacity
}if(groundOverlay.opacity===undefined){groundOverlay.opacity=0.7;
this.overlayOpacity=0.7
}this.createOverlay(doc,groundOverlay,folder)
}},createOverlay:function(doc,groundOverlay,folder){if(!window.KmlOverlayView){throw"KmlMapParser error: KmlOverlayView not found while rendering GroundOverlay from KML"
}var overlay=new KmlOverlayView({map:this.map,href:groundOverlay.icon.href,percentOpacity:groundOverlay.opacity,bounds:groundOverlay.bounds,id:groundOverlay.id});
groundOverlay.overlay=overlay;
groundOverlay.id=overlay.id_;
if(folder!==undefined){folder.overlays=folder.overlays||[];
groundOverlay.folderId=folder.id;
groundOverlay.folderName=folder.name;
folder.overlays.push(groundOverlay)
}if(folder!==doc){doc.overlays.push(groundOverlay);
doc.hasOverlays=true
}return overlay
},createSidebar:function(doc){if(!!this.sidebarId){var childFolders=doc.folders,i,placemarks,pm,folder,folderName,side=document.getElementById(this.sidebarId),id,contents="",innerContents="";
folderName=doc.name;
if(side!==null){if(this.showFolders&&doc.hasFolders){innerContents+=this.addSidebarFolder(folderName,doc.folders)
}else{placemarks=doc.placemarks;
innerContents+=this.addSidebarList(placemarks);
overlays=doc.overlays;
if(this.showOverlaysInSidebar&&overlays!==undefined){innerContents+=this.addSidebarOverlayList(overlays)
}}if(this.showRootName&&innerContents!==""){contents+='<li class="docroot" id="doc-'+doc.id+'" style="display:block"><span class="open"></span>'+folderName+"<ul>"+innerContents+"</ul></li>"
}else{if(innerContents!==""){contents+='<li class="docroot" id="doc-'+doc.id+'" style="display:block"><ul>'+innerContents+"</ul></li>"
}}var root=document.getElementById("root");
if(root!==null){var c=document.createElement("div");
c.innerHTML=contents;
root.appendChild(c)
}else{side.innerHTML='<ul id="root" >'+contents+"</ul>";
var scope=this,clickSidebar=function(e){var t,child,className;
if(!e){t=window.event.srcElement;
className=window.event.srcElement.className
}else{t=e.target;
if(!t){t=window.event.srcElement;
className=window.event.srcElement.className
}else{className=t.className
}}switch(className){case"placemark":if(scope.showBubble){if(scope.showSidebarBubble){scope.openBubbleById(t.id)
}else{scope.hilightShapesById(t.id)
}}break;
case"open":t.className="closed";
scope.setVisibilitybyNode(t.parentNode.getElementsByTagName("ul")[0],false);
break;
case"closed":t.className="open";
scope.setVisibilitybyNode(t.parentNode.getElementsByTagName("ul")[0],true);
break;
case"checked":t.className="unchecked";
scope.setOverlayVisibilityById(t.id.replace("-check",""),false);
break;
case"unchecked":t.className="checked";
scope.setOverlayVisibilityById(t.id.replace("-check",""),true);
break
}};
if(side.addEventListener){side.addEventListener("click",clickSidebar,false)
}else{if(side.attachEvent){side.attachEvent("onclick",clickSidebar)
}}}}}},addSidebarFolder:function(parentName,childFolders){var folder,i,folderName,cls,contents="",folderContents="",placemarkContents="",overlayContents="",placemarks,sameName=false;
if(!!parentName&&childFolders.length>0){for(i=0;
i<childFolders.length;
i++){folder=childFolders[i];
folderName=folder.name;
cls=folder.isOpen?"open":"closed";
if(folder.hasPlacemarks){placemarks=folder.placemarks;
if(folderName===placemarks[0].name){sameName=true
}else{sameName=false
}placemarkContents=this.addSidebarList(placemarks)
}else{placemarkContents=""
}if(this.showOverlaysInSidebar&&folder.hasOverlays){overlayContents=this.addSidebarOverlayList(folder.overlays)
}else{overlayContents=""
}if(folder.hasFolders){folderContents=this.addSidebarFolder(folderName,folder.folders)
}else{folderContents=""
}if(sameName){contents+=placemarkContents+overlayContents
}else{var d=folder.isOpen?"block":"none";
contents+='<li><span class="'+cls+'"></span>'+folderName+'<ul style="display:'+d+';">'+folderContents+placemarkContents+overlayContents+"</ul></li>"
}}}return contents
},createMarkerIconString:function(markerIcon){if(markerIcon!==undefined){return'<img src="'+markerIcon+'" />'
}else{return""
}},addSidebarList:function(placemarks){var pm,placemark,marker,icon,contents="",innerContents="",descrip="",markerId,markerIcon,id,itemList=[],itemListContents=[],folderHtml='<span class="closed"></span>';
for(pm=0;
pm<placemarks.length;
pm++){placemark=placemarks[pm];
id=placemark.id;
if(placemark.marker){marker=placemark.marker;
id=marker.id;
markerIcon=placemark.style.href;
icon=this.createMarkerIconString(markerIcon)
}if(this.showSidebarDescriptions){innerContents='<li class="placemark" id="'+id+'">'+folderHtml+icon+placemark.name;
descrip=this.createDescriptionString(placemark.description);
if(descrip!==undefined&&itemListContents[placemark.name]===undefined){itemListContents[placemark.name]=descrip
}}else{if(placemark.marker){innerContents='<li class="placemark" id="'+id+'">'+icon+placemark.name
}else{innerContents='<li class="placemark" id="'+id+'">'+placemark.name
}}itemList[placemark.name]=innerContents
}var placemarkId,lc;
for(placemarkId in itemList){if(itemList.hasOwnProperty(placemarkId)){lc=itemListContents[placemarkId];
if(this.showSidebarDescriptions){if(lc===undefined){contents+=itemList[placemarkId]+"</li>"
}else{contents+=itemList[placemarkId]+'<ul style="display:none;">'+lc+"</ul></li>"
}}else{contents+=itemList[placemarkId]+"</li>"
}}}return contents
},addSidebarOverlayList:function(overlays){var i,groundOverlay,overlay,contents="",innerContents="",descrip="",itemList=[],itemListContents=[],folderHtml='<span class="closed"></span>';
for(i=0;
i<overlays.length;
i++){groundOverlay=overlays[i];
if(groundOverlay.overlay){overlay=groundOverlay.overlay;
overlayId=groundOverlay.id;
if(this.showSidebarDescriptions){descrip=this.createDescriptionString(groundOverlay.description);
innerContents='<li class="overlay">'+folderHtml+'<span id="'+overlayId+'-check" class="checked"></span>'+groundOverlay.name+'<ul style="display:none;">'+descrip+"</ul></li>"
}else{innerContents='<li class="overlay"><span id="'+overlayId+'-check" class="checked"></span>'+groundOverlay.name
}}contents+=innerContents
}return contents
},createDescriptionString:function(description){if(description!==undefined&&description!==""){var descrip=description.replace('<a name="JR_PAGE_ANCHOR_0_1"></a>',"");
return'<li class="description" style="color: black;">'+descrip+"</li>"
}return undefined
},getPlacemarkById:function(id){var aId=id.split("-");
if(aId.length>0){var docId=aId[0],j=id.lastIndexOf("-"),newId=id.slice(0,j);
if(docId){var placemark,placemarkId,pm,placemarks=this.docSet.docs[docId].placemarks;
for(pm=0;
pm<placemarks.length;
pm++){placemark=placemarks[pm];
placemarkId=placemark.id;
if(placemark&&placemark.id===newId){return placemark
}}}}return undefined
},getDocFolderIds:function(id){if(!!id&&typeof id!=="number"){var aId=id.split("-");
if(aId.length>0){return aId
}}return undefined
},getPlacemarksByName:function(folderId,placemarkName){if(folderId){var ids=this.getDocFolderIds(folderId),placemarks,pm,placemark,aPlacemarks=[],doc;
if(ids!==undefined){doc=this.getDocumentById(ids[0])
}if(doc!==undefined&&doc.placemarks){placemarks=doc.placemarks;
for(pm=0;
pm<placemarks.length;
pm++){placemark=placemarks[pm];
if(placemark&&placemark.folderId===folderId&&placemark.name===placemarkName){aPlacemarks.push(placemark)
}}return aPlacemarks
}}return undefined
},hilightShapesById:function(id){var placemark,center,object=this.mapshapes[id];
if(object===undefined){object=this.mapshapes[id+"-0"]
}if(object&&object.folderId){var placemarks=this.getPlacemarksByName(object.folderId,object.title);
if(placemarks){center=this.hilightShapes(placemarks)
}this.zoomMap()
}return false
},hilightShapes:function(placemarks){if(this.lastSelectedPlacemark===placemarks){return 
}if(this.lastSelectedPlacemark!==undefined){this.changeShapeColors(this.lastSelectedPlacemark,false)
}var markerLatLng=this.changeShapeColors(placemarks,true);
if(markerLatLng!==undefined){this.map.setCenter(markerLatLng)
}this.lastSelectedPlacemark=placemarks
},changeShapeColors:function(placemarks,hilight){var pm,placemark,points,point,lines,line,areas,area,circles,circle,markerLatLng,i,hilite=(hilight!==undefined)?hilight:true,hiliteColor;
if(hilite){this.lastSelectedPlacemarks=placemarks;
hiliteColor=this.highlightColor
}for(pm=0;
pm<placemarks.length;
pm++){placemark=placemarks[pm];
points=placemark.points;
circles=placemark.circles;
lines=placemark.lines;
areas=placemark.areas;
marker=placemark.marker;
if(!!marker){markerLatLng=marker.getPosition()
}if(points!==undefined){for(i=0;
i<points.length;
i++){point=points[i];
if(hilite){point.setOptions({zIndex:this.zindex++})
}}}else{if(circles!==undefined){for(i=0;
i<circles.length;
i++){circle=circles[i];
if(hilite){circle.origStrokeColor=circle.strokeColor;
circle.origFillColor=circle.strokeColor;
circle.setOptions({strokeColor:hiliteColor,fillColor:hiliteColor,zIndex:this.zindex++})
}else{circle.setOptions({strokeColor:circle.origStrokeColor,fillColor:circle.origFillColor})
}}}else{if(lines!==undefined){for(i=0;
i<lines.length;
i++){line=lines[i];
if(hilite){line.origStrokeColor=line.strokeColor;
line.setOptions({strokeColor:hiliteColor,zIndex:this.zindex++})
}else{line.setOptions({strokeColor:line.origStrokeColor})
}}}else{if(areas!==undefined){for(i=0;
i<areas.length;
i++){area=areas[i];
if(hilite){area.origStrokeColor=area.strokeColor;
area.origFillColor=area.strokeColor;
area.setOptions({strokeColor:hiliteColor,fillColor:hiliteColor,zIndex:this.zindex++})
}else{area.setOptions({strokeColor:area.origStrokeColor,fillColor:area.origFillColor})
}}}}}}}return markerLatLng
},openBubble:function(object){if(object!==undefined){this.zoomMap();
if(this.infoWindow){if(object.description!==undefined){this.infoWindow.setContent(object.description)
}if(object.position!==undefined){this.infoWindow.setPosition(object.position)
}this.infoWindow.open(this.map,object)
}var placemarks=this.getPlacemarksByName(object.folderId,object.title);
if(placemarks){this.hilightShapes(placemarks)
}}},zoomMap:function(zoom){if(this.shouldZoom){if(zoom===undefined){zoom=this.defaultZoomLevel
}if(this.map.getZoom()<zoom+1){this.map.setZoom(zoom)
}}},openBubbleById:function(id){var m=this.mapshapes[id];
if(m===undefined){m=this.mapshapes[id+"-0"]
}this.openBubble(m)
},closeBubble:function(){if(this.infoWindow){this.infoWindow.close()
}},getRGBColorTransparency:function(kmlColor){var color={};
if(kmlColor){aa=kmlColor.substr(0,2);
bb=kmlColor.substr(2,2);
gg=kmlColor.substr(4,2);
rr=kmlColor.substr(6,2);
color.color="#"+rr+gg+bb;
color.opacity=parseFloat(parseInt(aa,16)/256).toFixed(1)
}if(isNaN(color.opacity)){color.color=this.getRandomColor();
color.opacity=1
}return color
},getRandomColor:function(){return"#"+Math.round(16777215*Math.random()).toString(16)
},enableDragZoom:function(){if(!this.map.enableKeyDragZoom){throw"KmlMapParser error: keydragzoom.js OR keydragzoom_packed.js not found while enabling dragZoomButton."
}this.map.enableKeyDragZoom({visualEnabled:true,visualPosition:google.maps.ControlPosition.LEFT,visualPositionOffset:new google.maps.Size(35,0),visualPositionIndex:null,visualSprite:this.dragZoomButtonImage,visualSize:new google.maps.Size(20,20),visualTips:{off:"Turn on drag zoom",on:"Turn off drag zoom"}})
},log:function(msg){if(window.console!==undefined){console.log(msg)
}else{alert("log:"+msg)
}}};KmlOverlayView=function(config){if(config===undefined){throw"KmlOverlayView internal error: needs Configuration options!"
}this.origConfig_=config;
this.idIndex_=0;
this.map_=config.map;
this.id_=config.id;
this.href_=config.href;
this.bounds_=config.bounds;
this.opacity_=config.opacity?config.opacity:0.7;
this.setMap(this.map_)
};
KmlOverlayView.prototype=new google.maps.OverlayView();
KmlOverlayView.prototype.onAdd=function(){if(this.div_===undefined){var div=document.createElement("div");
div.style.position="absolute";
div.setAttribute("id",this.id_);
this.div_=div;
this.lastZoom_=-1;
if(this.opacity_){this.setOpacity(this.opacity_)
}this.getPanes().overlayLayer.appendChild(this.div_)
}};
KmlOverlayView.prototype.draw=function(){if(this.div_===undefined){return 
}var projection=this.getProjection(),p1=projection.fromLatLngToDivPixel(this.bounds_.getSouthWest()),p2=projection.fromLatLngToDivPixel(this.bounds_.getNorthEast());
if(!p1||!p2){return 
}var width=Math.abs(p2.x-p1.x)+"px",height=Math.abs(p2.y-p1.y)+"px";
this.div_.style.width=width;
this.div_.style.height=height;
this.div_.style.left=Math.min(p2.x,p1.x)+"px";
this.div_.style.top=Math.min(p2.y,p1.y)+"px";
if(this.lastZoom_==this.map.getZoom()){return 
}this.lastZoom_=this.map.getZoom();
this.div_.innerHTML='<img src="'+this.href_+'"  width='+width+" height="+height+" />"
};
KmlOverlayView.prototype.onRemove=function(){if(this.div_){this.div_.parentNode.removeChild(this.div);
this.div_=null
}};
KmlOverlayView.prototype.setOpacity=function(opacity){if(opacity<0){opacity=0
}if(opacity>1){opacity=1
}if(typeof (this.div_.style.filter)=="string"){this.div_.style.filter="alpha(opacity:"+opacity*100+")"
}if(typeof (this.div_.style.KHTMLOpacity)=="string"){this.div_.style.KHTMLOpacity=opacity
}if(typeof (this.div_.style.MozOpacity)=="string"){this.div_.style.MozOpacity=opacity
}if(typeof (this.div_.style.opacity)=="string"){this.div_.style.opacity=opacity
}};
KmlOverlayView.prototype.setVisibility=function(isVisible){if(isVisible){this.div_.style.display="block"
}else{this.div_.style.display="none"
}};