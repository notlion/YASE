'use strict';

var _      = require("underscore")
  , plask  = require("plask")
  , stats  = require("plask-stats")
  , Embr   = require("embr")
  , Toy    = require("./Toy")
  , Camera = require("./Camera")


var glMatrix = require("gl-matrix")
var mat4 = glMatrix.mat4
var vec3 = glMatrix.vec3

var default_settings = {
  width:       1280
, height:      720
, type:        '3d'
, vsync:       true
, multisample: false
, fullscreen:  false
, position:    { x: 0, y: -0 }
}

exports.create = function (settings) {
  if (!settings) settings = {};

  return plask.simpleWindow({

    settings: _.defaults(settings, default_settings)

  , init: function() {
      var self = this
        , toy = this.model = new Toy()

      toy.set("context", this.gl)


      this.projection = mat4.create()
      this.modelview = mat4.create()
      this.modelview_inv = mat4.create()
      this.camera_pos = vec3.create()

      this.camera = new Camera(toy.control)


      // Start

      toy.editors.each(function (editor) {
        editor.compile()
      })


      // Init Stats
      this.stats = new stats.Stats(100, 60).open();
    }

  , start: function() {
      this.start_time = this.start_time || Date.now()
      this.frame_num = this.frame_num || 0
      this.framerate(60)
    }

  , stop: function() {
      this.framerate(0)
    }

  , draw: function() {
      var self = this
        , gl = Embr.gl
        , toy = this.model
        , control = toy.control
        , time = (Date.now() - this.start_time) / 1000
        , res = toy.get("fbo_res")
        , point_size = 0.001
        , shader_mix = control.get("shader_mix.x")


      this.camera.step();

      this.camera.calcModelView(this.modelview)
      this.camera.calcProjection(this.projection, this.width, this.height)

      vec3.set(this.camera_pos, 0, 0, 0)
      mat4.invert(this.modelview_inv, this.modelview)
      vec3.transformMat4(this.camera_pos, this.camera_pos, this.modelview_inv)

      gl.viewport(0, 0, res, res)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.BLEND)


      toy.editors.each(function (editor) {

        // Ignore low-contribution shaders
        if((editor.id == "left" && shader_mix > 0.99) ||
           (editor.id == "right" && shader_mix < 0.01))
          return;

        var fbo = toy.fbo_groups[editor.id]


        // Copy previous step

        fbo.prev_write.bind()

          fbo.read.textures[0].bind(0) // Position
          toy.vbo_plane
            .setProgram(toy.prog_copy.use({ u_position: 0 }))
            .draw()

          fbo.read.textures[0].unbind()

        fbo.prev_write.unbind()


        // Render particle step pass

        if(editor.program.linked) {
          fbo.write.bind()

            fbo.read.textures[0].bind(0)      // Position
            fbo.prev_read.textures[0].bind(1) // Previous position
            toy.tex_index.bind(2)

            editor.program.use({
              position:      0
            , position_prev: 1
            , index:         2
            , resolution:    res
            , oneOverRes:    1.0 / res
            , count:         res * res
            , cameraPos:     self.camera_pos
            , time:          time
            , frame:         self.frame_num
            })

            toy.vbo_plane
              .setProgram(editor.program)
              .draw()

            fbo.read.textures[0].unbind()
            fbo.prev_read.textures[0].unbind()
            toy.tex_index.unbind()

          fbo.write.unbind()
          fbo.swap()
        }

      })

      this.frame_num++


      // Render mix pass

      toy.fbo_mix.bind()

        toy.fbo_groups["left"].read.textures[0].bind(0)
        toy.fbo_groups["right"].read.textures[0].bind(1)

        toy.vbo_plane
          .setProgram(toy.prog_mix.use({
            u_position_left:  0
          , u_position_right: 1
          , u_mix:            shader_mix
          }))
          .draw()

        toy.fbo_groups["left"].read.textures[0].unbind()
        toy.fbo_groups["right"].read.textures[0].unbind()

      toy.fbo_mix.unbind()


      // Render view pass

      gl.viewport(0, 0, this.width, this.height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)

      toy.fbo_mix.textures[0].bind(0) // Position

      toy.prog_final.use({
        u_modelview:    this.modelview
      , u_projection:   this.projection
      , u_position:     0
      , u_point_size:   point_size
      , u_screen_width: this.width
      })

      toy.vbo_particles.setProgram(toy.prog_final).draw()

      toy.fbo_mix.textures[0].unbind()

      this.stats.update();
    }

  })

}
