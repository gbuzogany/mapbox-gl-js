'use strict';

module.exports = PointGroup;

function PointGroup(customBufferManager, quadrant) {
    this.index = 0;
    this.markers = [];
    this.quadrant = quadrant;
    this.customBufferManager = customBufferManager;
    this.needsRefresh = false;
}

PointGroup.prototype.buildBuffer = function () {
    this.buffer = this.customBufferManager.createStaticBufferWithMarkers(this.markers, this.quadrant);
};

PointGroup.prototype.setNeedsRefresh = function () {
    this.needsRefresh = true;
};

PointGroup.prototype.refreshIfNeeded = function () {
    if (this.needsRefresh === true && this.buffer) {
        this.buffer.bind();
        this.needsRefresh = false;
        return true;
    } else {
        return false;
    }
};

PointGroup.prototype.addMarker = function (marker) {
    marker.index = this.index++;
    this.markers.push(marker);
};

PointGroup.prototype.selectMarker = function (marker) {
    if (this.markers[marker.index].sprite.endsWith('-selected') === false) {
        this.markers[marker.index].sprite += '-selected';
        this.needsRefresh = true;
        return true;
    }
    return false;
};

PointGroup.prototype.unselectMarker = function (marker) {
    if (this.markers[marker.index].sprite.endsWith('-selected') === true) {
        this.markers[marker.index].sprite = this.markers[marker.index].sprite.substring(0, this.markers[marker.index].sprite.length - 9);
        this.needsRefresh = true;
        return true;
    }
    return false;
};


PointGroup.prototype.clear = function () {
    if (this.buffer !== undefined) {
        this.customBufferManager.removeBuffer(this.buffer);
        this.buffer.clear();
        delete this.buffer;
    }
};

PointGroup.prototype.rebuild = function () {
    this.clear();
    this.buildBuffer();
};

PointGroup.prototype.findMarker = function (marker) {
    for (var i=0; i < this.markers.length; i++) {
        if (this.markers[i] !== undefined && this.markers[i].id == marker.id) {
            return i;
        }
    }
    return -1;
};

PointGroup.prototype.removeMarker = function (marker) {
    var index = findMarker(marker);
    if (index > 0) {
        this.removeMarkerFromIndex(index);
    }
};

PointGroup.prototype.removeMarkerFromIndex = function (index) {
    if (index >= 0) {
        delete this.markers[index];
        this.rebuild();
    }
};
