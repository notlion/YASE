var _       = require("underscore")
  , plask   = require("plask")
  , Embr    = require("../public/lib/embr/src/embr")
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
, multisample: true
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

      var sc = toy.get("shadow_volume_scale")
      this.light_projection = mat4.ortho(-sc, sc, -sc, sc, -sc, sc)
      this.light_modelview = mat4.identity()
      this.light_mvp = mat4.multiply(this.light_projection, this.light_modelview, mat4.create())


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
        , res_shadow = toy.get("fbo_res_shadow")
        , shadow_volume_scale = toy.get("shadow_volume_scale")
        , point_size = 2//+toy.editor.get("define_point_size") || 2
        , clip_near = 0.1
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
            .setProg(toy.prog_copy.use({ u_position: 0 }))
            .draw()

          fbo.read.textures[0].unbind()

        fbo.prev_write.unbind()


        // Render particle step pass

        if(editor.program.linked) {
          fbo.write.bind()

            fbo.read.textures[0].bind(0)      // Position
            fbo.prev_read.textures[0].bind(1) // Previous position
            toy.tex_index.bind(2)
            toy.fbo_shadow_depth.textures[0].bind(3)

            editor.program.use({
              position:           0
            , position_prev:      1
            , index:              2
            , shadow_depth:       3
            , light_mvp:          self.light_mvp
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
              .setProg(editor.program)
              .draw()

            fbo.read.textures[0].unbind()
            fbo.prev_read.textures[0].unbind()
            toy.tex_index.unbind()
            toy.fbo_shadow_depth.textures[0].unbind()

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
          .setProg(toy.prog_mix.use({
            u_position_left:  0
          , u_position_right: 1
          , u_mix:            shader_mix
          }))
          .draw()

        toy.fbo_groups["left"].read.textures[0].unbind()
        toy.fbo_groups["right"].read.textures[0].unbind()

      toy.fbo_mix.unbind()


      // Render shadow pass

      if(+toy.editors.get("left").get("define_shadows") ||
         +toy.editors.get("right").get("define_shadows")) {
        toy.fbo_shadow_depth.bind()

          gl.viewport(0, 0, res_shadow, res_shadow)
          gl.clearColor(0, 0, 0, 1)
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
          gl.enable(gl.DEPTH_TEST)

          toy.fbo_mix.textures[0].bind(0) // Position

          toy.prog_depth.use({
            u_position:   0
          , u_projection: this.light_projection
          , u_modelview:  this.light_modelview
          , u_point_size: 1.0
          })

          toy.vbo_particles.setProg(toy.prog_depth).draw()

          toy.fbo_mix.textures[0].unbind()

        toy.fbo_shadow_depth.unbind()
      }


      // Render view pass

      gl.viewport(0, 0, this.width, this.height)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.enable(gl.DEPTH_TEST)

      toy.fbo_mix.textures[0].bind(0) // Position

      toy.prog_final.use({
        u_mvp:        this.mvp
      , u_position:   0
      , u_point_size: point_size
      })

      toy.vbo_particles.setProg(toy.prog_final).draw()

      toy.fbo_mix.textures[0].unbind()
    }

  })

}
