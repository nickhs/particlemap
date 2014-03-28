/*****************************************************************************
*  KmlOverlayView.js
*  KmlOverlayView  - A Google Maps API Extension
*  Project: http://code.google.com/p/kmlmapparser/
*  Version 1.0
*  author R. Raponi
*
*  Licensed under the Apache License, Version 2.0 (the "License");
*  you may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*******************************************************************************/

KmlOverlayView  = function(config){
	
  if (config === undefined){
	    throw 'KmlOverlayView internal error: needs Configuration options!';
  }
  
  this.origConfig_ = config;
  this.idIndex_  = 0;
  this.map_ = config.map;
  this.id_ = config.id;
  this.href_ = config.href;
  this.bounds_ = config.bounds;
  this.opacity_ = config.opacity ? config.opacity : 0.7;

  this.setMap(this.map_);	 
};

KmlOverlayView.prototype = new google.maps.OverlayView();
	
/*
*  onAdd
*/
KmlOverlayView.prototype.onAdd = function () {	
	if (this.div_ === undefined ){	
		var div = document.createElement("div");
		div.style.position = "absolute";
		div.setAttribute('id',this.id_);

		this.div_= div;
		
		this.lastZoom_ = -1;
		if( this.opacity_){
			this.setOpacity(this.opacity_) ;
		}
		this.getPanes().overlayLayer.appendChild(this.div_);
	}	
};


/*
*  draw
*/
KmlOverlayView.prototype.draw = function () {

	if (this.div_ === undefined ){
	  return ;
	}
	var projection = this.getProjection(),
		p1 = projection.fromLatLngToDivPixel(this.bounds_.getSouthWest()),
		p2 = projection.fromLatLngToDivPixel(this.bounds_.getNorthEast());
		
	if (!p1 || !p2){return;}
	
	var width = Math.abs(p2.x - p1.x) + "px",
		height = Math.abs(p2.y - p1.y) + "px";
	
	//position the div
	this.div_.style.width = width;
	this.div_.style.height = height;
	this.div_.style.left = Math.min(p2.x, p1.x) + "px";
	this.div_.style.top = Math.min(p2.y, p1.y) + "px";
	 
	if ( this.lastZoom_ == this.map.getZoom()){
		return;
	}
	this.lastZoom_ = this.map.getZoom();  
	this.div_.innerHTML = '<img src="' + this.href_ + '"  width=' + width + ' height=' + height + ' />' ;	
};


/*
 *  onRemove
 */
KmlOverlayView.prototype.onRemove = function () {	
	if (this.div_){
	  this.div_.parentNode.removeChild(this.div);
	  this.div_ = null;
	 }
};


/*
 *  setOpacity
 */
KmlOverlayView.prototype.setOpacity = function (opacity) {
	if (opacity < 0){
	  opacity = 0;
	}
	if(opacity > 1){
	  opacity = 1;
	}
	if (typeof(this.div_.style.filter) =='string'){
	  this.div_.style.filter = 'alpha(opacity:' + opacity * 100 + ')' ;
	}
	if (typeof(this.div_.style.KHTMLOpacity) == 'string' ){
	  this.div_.style.KHTMLOpacity = opacity;
	}
	if (typeof(this.div_.style.MozOpacity) == 'string'){
	  this.div_.style.MozOpacity = opacity;
	}
	if (typeof(this.div_.style.opacity) == 'string'){
	  this.div_.style.opacity = opacity;
	}
};



/*
 *  setVisibility
 */
KmlOverlayView.prototype.setVisibility = function(isVisible) {
    if (isVisible){
    	this.div_.style.display='block';
    }else{
    	this.div_.style.display='none';
    }
};
