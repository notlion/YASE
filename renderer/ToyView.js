var Backbone   = require("backbone")
  , _          = require("underscore")
  , plask      = require("plask")
  , Embr       = require("../public/lib/embr/src/embr")
  , Toy        = require("./Toy")
  , Arcball    = require("./Arcball")
  , OscControl = require("./OscControl")


var glMatrix = require("../public/lib/gl-matrix")
  , mat4 = glMatrix.mat4
  , vec3 = glMatrix.vec3

exports.create = function() {
  return plask.simpleWindow({

    settings: {
      width: 1280
    , height: 720
    , type: '3d'
    , vsync: false
    , fullscreen: true
    , position: { x: 1440, y: -0 }
    }

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
      this.control = new OscControl()

      var sc = toy.get("shadow_volume_scale")
      this.light_projection = mat4.ortho(-sc, sc, -sc, sc, -sc, sc)
      this.light_modelview = mat4.identity()
      this.light_mvp = mat4.multiply(this.light_projection, this.light_modelview, mat4.create())


      // Assign event listeners

      toy.on("change:rendering", function(toy, rendering) {
        if(rendering) self.start()
        else self.stop()
      })

      toy.editor
        .on("change:define_pixel_scale", this.layout, this)

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

      toy.editor.compile()
      this.layout()
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
      var gl = Embr.gl
        , toy = this.model
        , time = (Date.now() - this.start_time) / 1000
        , res = toy.get("fbo_res")
        , res_shadow = toy.get("fbo_res_shadow")
        , shadow_volume_scale = toy.get("shadow_volume_scale")
        , point_size = +toy.editor.get("define_point_size") || 2
        , clip_near = 0.1
        , clip_far = 100.0
        , fov = 60.0

      // Animate Arcball

      var velocity = this.control.get("velocity")
        , distance = this.control.get("distance.x")
      if(velocity)
        this.arcball.pan(velocity.x, velocity.y)
      if(distance)
        this.arcball.distance = distance

      this.arcball.getModelView(this.modelview)
      // mat4.lookAt([ 0, 0, 5 ], [ 0, 0, 0 ], [ 0, 1, 0 ], this.modelview)
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


      // Copy previous step

      toy.fbo_prev_write.bind()

        toy.fbo_read.textures[0].bind(0) // Position
        toy.vbo_plane
          .setProg(toy.prog_copy.use({ u_position: 0 }))
          .draw()

        toy.fbo_write.textures[0].unbind()

      toy.fbo_prev_write.unbind()


      // Render particle step pass

      if(toy.editor.program.linked) {
        toy.fbo_write.bind()

          toy.fbo_read.textures[0].bind(0)      // Position
          toy.fbo_prev_read.textures[0].bind(1) // Previous position
          toy.tex_index.bind(2)
          toy.fbo_shadow_depth.textures[0].bind(3)

          toy.editor.program.use({
            position:           0
          , position_prev:      1
          , index:              2
          , shadow_depth:       3
          , light_mvp:          this.light_mvp
          , resolution:         res
          , oneOverRes:         1.0 / res
          , count:              res * res
          , mousePos:           this.mouse_world_pos
          , prevMousePos:       this.mouse_world_pos_prev
          , screenMousePos:     this.mouse_pos
          , prevScreenMousePos: this.mouse_pos_prev
          , cameraPos:          this.camera_pos
          , time:               time
          , frame:              this.frame_num
          })

          toy.vbo_plane
            .setProg(toy.editor.program)
            .draw()

          toy.fbo_read.textures[0].unbind()
          toy.fbo_prev_read.textures[0].unbind()
          toy.tex_index.unbind()
          toy.fbo_shadow_depth.textures[0].unbind()

        toy.fbo_write.unbind()
        toy.swap()

        this.frame_num++
      }


      // Render shadow pass

      if(+toy.editor.get("define_shadows")) {
        toy.fbo_shadow_depth.bind()

          gl.viewport(0, 0, res_shadow, res_shadow)
          gl.clearColor(0, 0, 0, 1)
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
          gl.enable(gl.DEPTH_TEST)

          toy.fbo_read.textures[0].bind(0) // Position

          toy.prog_depth.use({
            u_position:   0
          , u_projection: this.light_projection
          , u_modelview:  this.light_modelview
          , u_point_size: 1.0
          })

          toy.vbo_particles.setProg(toy.prog_depth).draw()

          toy.fbo_read.textures[0].unbind()

        toy.fbo_shadow_depth.unbind()
      }


      // Render view pass

      gl.viewport(0, 0, this.width, this.height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)

      toy.fbo_read.textures[0].bind(0) // Position

      toy.prog_final.use({
        u_mvp:        this.mvp
      , u_position:   0
      , u_point_size: point_size
      })

      toy.vbo_particles.setProg(toy.prog_final).draw()

      toy.fbo_read.textures[0].unbind()
    }

  })

}
