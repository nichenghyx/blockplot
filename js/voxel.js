var createGame = require('voxel-hello-world')
var fly = require('voxel-fly')
var voxelLevel = require('voxel-level')
var workerstream = require('workerstream')
var bundle = require('voxel-bundle')
var blockInfo = require('minecraft-blockinfo')
var level = voxelLevel('blocks', function ready() {})

module.exports = {
  initGame: initGame,
  saveRegion: saveRegion,
  level: level
}

function initGame(options) {
  $('.content').hide()

  var textures = "http://commondatastorage.googleapis.com/voxeltextures/painterly/"

  var materials = []
  
  Object.keys(blockInfo.blocks).map(function(b) {
    var type = blockInfo.blocks[b].type
    materials.push(type)
  })

  var pos = [0, 0, 0]
  var chunkDimensions = [16, 16, 16]
  var gameChunkSize = 16
  // var regionX = Math.floor((pos[0] >> 4) / 32)
  // var regionZ = Math.floor((pos[2] >> 4) / 32)
  
  var game = require('voxel-hello-world')({
    generateChunks: false,
    texturePath: textures,
    playerSkin: textures + '../player.png',
    chunkSize: gameChunkSize,
    chunkDistance: 4,
    arrayType: Uint8Array,
    worldOrigin: pos,
    materials: materials
  })
  
  var level = voxelLevel(game, function ready() {
    game.paused = false
    window.game = game // for console debugging
    var makeFly = fly(game)
    makeFly(game.controls.target()).startFlying()
    game.controls.target().avatar.position.copy({x: pos[0], y: pos[1], z: pos[2]})
  })
  
  game.voxels.on('missingChunk', function(p) {
    var chunkPosition = [p[0] * gameChunkSize, p[1] * gameChunkSize, p[2] * gameChunkSize]
    var empty = {
      position: p,
      voxels: new Uint8Array(gameChunkSize * gameChunkSize * gameChunkSize),
      dims: [gameChunkSize, gameChunkSize, gameChunkSize]
    }
    game.showChunk(empty)
    level.load(chunkPosition, chunkDimensions, function(err, chunk) {
      if (err) return
      var chunkBundle = bundle(chunk)
      chunkBundle.extract(function(x, y, z, val, idx) {
        if (!val) return
        var cx = x - chunk.position[0]
        var cy = y - chunk.position[1]
        var cz = z - chunk.position[2]
        var cidx = cx + (cy * gameChunkSize) + (cz * gameChunkSize * gameChunkSize)
        var pos = [x,y,z]
        var type = blockInfo.blocks['_' + val].type
        game.setBlock(pos, type)
      })
    })
  })
}

function saveRegion(buffer, regionX, regionZ, cb) {
  var progress = $('.progress.hidden')
  progress.removeClass('hidden')
  var progressBar = progress.find('.bar')
  progressBar.css('width', '0%')
  var worker = workerstream('convert-worker.js')
  worker.on('data', function(data) {
    if (data.progress) {
      progressBar.css('width', data.progress + '%')
    } else if (data.done) {
      progressBar.css('width', '100%')
      cb(data.errors)
    } else {
      console.log(data)
    }
  })
  worker.write({regionX: regionX, regionZ: regionZ})
  worker.write(buffer)
  worker.end()
}

