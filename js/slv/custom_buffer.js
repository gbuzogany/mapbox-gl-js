'use strict';

var util = require('../util/util');

module.exports = CustomBuffer;

function CustomBuffer(gl, transform, painter, markers, quadrant) {
    this.gl = gl;
    this.transform = transform;
    this.markers = markers;
    this.quadrant = quadrant;
    this.painter = painter;

    this.buffers = {
        vertex : {
            buffer : gl.createBuffer(),
            itemSize : 3
        },
        texture : {
            buffer : gl.createBuffer(),
            itemSize : 2
        },
        offset : {
            buffer : gl.createBuffer(),
            itemSize : 2
        },
        indices : {
            buffer : gl.createBuffer(),
            itemSize : 1
        }
    };

    this.vertexBuffer = undefined;

    this.bind();
}

util.extend(CustomBuffer.prototype, {
    bind: function() {
        this.buildVertexBuffer();
        this.buildTextureBuffer();
        this.buildIndexBuffer();
    },
    buildVertexBuffer: function() {
        var gl = this.gl;
        var markers = this.markers;

        var quadrantIncement = {
            x: 360 / this.quadrant.lngDivisions,
            y: 180 / this.quadrant.latDivisions
        };

        this.vertexBuffer = new Float32Array(markers.length * 4 * 3);
        var vertexBuffer = this.vertexBuffer;
        var vertexIndex = 0;
        var offsetBuffer = new Float32Array(markers.length * 4 * 2);
        var offsetIndex = 0;

        var quadX = quadrantIncement.x * this.quadrant.col;
        var quadY = quadrantIncement.y * this.quadrant.row;

        this.tX = this.lngX(quadX - 180);
        this.tY = this.latY(90 - quadY);

        var z = 0;

        for (var i = 0; i < markers.length; i++) {
            if (markers[i] === undefined) continue;

            if (markers[i].status && markers[i].status !== 0) {
                z = 1;
            } else {
                z = 0;
            }

            var x = this.lngX(markers[i].lng);
            var y = this.latY(markers[i].lat);

            vertexBuffer[vertexIndex++] = x - this.tX;
            vertexBuffer[vertexIndex++] = y - this.tY;
            vertexBuffer[vertexIndex++] = z;
            offsetBuffer[offsetIndex++] = -1;
            offsetBuffer[offsetIndex++] = 0;

            vertexBuffer[vertexIndex++] = x - this.tX;
            vertexBuffer[vertexIndex++] = y - this.tY;
            vertexBuffer[vertexIndex++] = z;
            offsetBuffer[offsetIndex++] = 1;
            offsetBuffer[offsetIndex++] = 0;

            vertexBuffer[vertexIndex++] = x - this.tX;
            vertexBuffer[vertexIndex++] = y - this.tY;
            vertexBuffer[vertexIndex++] = z;
            offsetBuffer[offsetIndex++] = 1;
            offsetBuffer[offsetIndex++] = -2;

            vertexBuffer[vertexIndex++] = x - this.tX;
            vertexBuffer[vertexIndex++] = y - this.tY;
            vertexBuffer[vertexIndex++] = z;
            offsetBuffer[offsetIndex++] = -1;
            offsetBuffer[offsetIndex++] = -2;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertexBuffer, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.offset.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, offsetBuffer, gl.STATIC_DRAW);

    },
    buildZBuffer: function() {
        var gl = this.gl;
        var markers = this.markers;

        var vertexBuffer = this.vertexBuffer;

        var z = 0;
        var vertexIndex = 2;

        for (var i = 0; i < markers.length; i++) {
            if (markers[i] === undefined) continue;

            if (markers[i].status && markers[i].status !== 0) {
                z = 1;
            } else {
                z = 0;
            }

            vertexBuffer[vertexIndex] = z;
            vertexIndex += 3;
            vertexBuffer[vertexIndex] = z;
            vertexIndex += 3;
            vertexBuffer[vertexIndex] = z;
            vertexIndex += 3;
            vertexBuffer[vertexIndex] = z;
            vertexIndex += 3;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.vertex.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.STATIC_DRAW);

    },
    buildTextureBuffer: function() {
        var gl = this.gl;
        var markers = this.markers;

        var buffer = new Float32Array(this.markers.length * 4 * 2);
        var index = 0;

        for (var i = 0; i < markers.length; i++) {
            if (markers[i] === undefined) continue;
            var addDefault = false;
            if (this.painter.spriteAtlas.sprite !== undefined) {
                var sprites = this.painter.spriteAtlas.images;
                if (markers[i].sprite in sprites) {
                    var sprite = sprites[markers[i].sprite];
                    buffer[index++] = (sprite.rect.x) / 4;
                    buffer[index++] = (sprite.rect.y + sprite.rect.height) / 4;
                    buffer[index++] = (sprite.rect.x + sprite.rect.width) / 4;
                    buffer[index++] = (sprite.rect.y + sprite.rect.height) / 4;
                    buffer[index++] = (sprite.rect.x + sprite.rect.width) / 4;
                    buffer[index++] = (sprite.rect.y) / 4;
                    buffer[index++] = sprite.rect.x / 4;
                    buffer[index++] = sprite.rect.y / 4;
                } else {
                    console.warn(markers[i].sprite + ' not found.');
                    addDefault = true;
                }
            }
            if (addDefault === true) {
                console.warn('Marker doesn\'t have a sprite on the current sprite map!', markers[i]);
                buffer[index++] = 0;
                buffer[index++] = 0;
                buffer[index++] = 0;
                buffer[index++] = 0;
                buffer[index++] = 0;
                buffer[index++] = 0;
                buffer[index++] = 0;
                buffer[index++] = 0;
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.texture.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    },
    buildIndexBuffer: function() {
        var gl = this.gl;
        var markers = this.markers;

        var index = 0;

        var indicesBuffer = new Uint16Array(markers.length * 6);
        var indicesIndex = 0;

        for (var i = 0; i < markers.length; i++) {
            if (markers[i] === undefined) continue;

            indicesBuffer[indicesIndex++] = index;
            indicesBuffer[indicesIndex++] = index + 1;
            indicesBuffer[indicesIndex++] = index + 3;
            indicesBuffer[indicesIndex++] = index + 1;
            indicesBuffer[indicesIndex++] = index + 2;
            indicesBuffer[indicesIndex++] = index + 3;
            index += 4;
        }

        this.indicesLength = markers.length * 6;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices.buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer, gl.STATIC_DRAW);

    },
    lngX: function(lng) {
        return ((180 + lng) * 1.4222222222);
    },
    latY: function(lat) {
        var y = 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
        return (180 - y) * 1.4222222222;
    },
    clear: function() {
        var gl = this.gl;
        gl.deleteBuffer(this.buffers.vertex.buffer);
        gl.deleteBuffer(this.buffers.offset.buffer);
        gl.deleteBuffer(this.buffers.texture.buffer);
        gl.deleteBuffer(this.buffers.indices.buffer);
    },
    isEmpty: function() {
        if (this.markers.length > 0)
            return false;
        else
            return true;
    }
});
