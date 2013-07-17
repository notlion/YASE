'use strict';

var _       = require("underscore")
  , plask   = require("plask")
  , stats   = require("plask-stats")
  , Embr    = require("embr")
  , Toy     = require("./Toy")
  , Arcball = require("./Arcball")


var glMatrix = require("../public/lib/gl-matrix")
  , mat4 = glMatrix.mat4
  , vec3 = glMatrix.vec3

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
      this.mvp = mat4.create()
      this.camera_pos = vec3.create()

      this.arcball = new Arcball()


      // Assign event listeners

      toy.on("change:rendering", function(toy, rendering) {
        if(rendering) self.start()
        else self.stop()
      })

      // toy.editor
      //   .on("change:define_pixel_scale", this.layout, this)

      this.arcball
        .on("change:rotation", function(arcball, r) {
          toy.set("rotation", [ r[0], r[1], r[2], r[3] ])
        })
        .on("change:distance", function(arcball, d) {
          toy.set("distance", d)
        })


      // Init Mouse

      this.mouse_pos = vec3.create()
      this.mouse_pos_prev = vec3.create()
      this.mouse_world_pos = vec3.create()
      this.mouse_world_pos_prev = vec3.create()


      // Start

      toy.editors.each(function (editor) {
        editor.compile()
      })

      this.layout()


      // Init Stats
      this.stats = new stats.Stats(100, 60).open();
    }

  , layout: function() {
      this.aspect = this.width / this.height
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
        , clip_near = 0.01
        , clip_far = 100.0
        , fov = control.get("fov.x")
        , shader_mix = control.get("shader_mix.x")


      // Animate Arcball

      var velocity = control.get("eye_velocity")
        , distance = control.get("eye_distance.x")
      if(velocity)
        this.arcball.pan(velocity.x, velocity.y)
      if(distance)
        this.arcball.distance = distance

      this.arcball.getModelView(this.modelview)
      mat4.perspective(fov, this.aspect, clip_near, clip_far, this.projection)
      mat4.multiply(this.projection, this.modelview, this.mvp)

      vec3.set([ 0, 0, 0 ], this.camera_pos)
      mat4.inverse(this.modelview, this.modelview_inv)
      mat4.multiplyVec3(this.modelview_inv, this.camera_pos)

      vec3.set(this.mouse_pos, this.mouse_pos_prev)
      vec3.set(this.mouse_world_pos, this.mouse_world_pos_prev)

      // this.mouse_pos[2] = utils.distanceToDepth(this.arcball.getDistance(), clip_near, clip_far)
      // vec3.unproject(this.mouse_pos, this.modelview, this.projection, [ 0, 0, 1, 1 ], this.mouse_world_pos)

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
              position:           0
            , position_prev:      1
            , index:              2
            , resolution:         res
            , oneOverRes:         1.0 / res
            , count:              res * res
            , mousePos:           self.mouse_world_pos
            , prevMousePos:       self.mouse_world_pos_prev
            , screenMousePos:     self.mouse_pos
            , prevScreenMousePos: self.mouse_pos_prev
            , cameraPos:          self.camera_pos
            , time:               time
            , frame:              self.frame_num
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
