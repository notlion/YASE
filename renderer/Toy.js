var Backbone     = require("backbone")
  , _            = require("underscore")
  , fs           = require("fs")
  , path         = require("path")
  , Embr         = require("../public/lib/embr/src/embr")
  , RemoteEditor = require("./RemoteEditor")


function loadTpl(filename) {
  var p = path.join(__dirname, "..", "public", "template", filename)
  return fs.readFileSync(p, "utf8")
}

var src_copy_vertex    = loadTpl("copy.vsh")
  , src_copy_fragment  = loadTpl("copy.fsh")
  , src_step_vertex    = loadTpl("step.vsh")
  , src_step_fragment  = loadTpl("step.fsh")
  , src_final_vertex   = loadTpl("final.vsh")
  , src_final_fragment = loadTpl("final.fsh")
  , src_depth_vertex   = loadTpl("depth.vsh")
  , src_depth_fragment = loadTpl("depth.fsh")
  , src_step_template  = loadTpl("step_template.fsh")


module.exports = Backbone.Model.extend({

  defaults: {
    fbo_res: 512
  , fbo_res_shadow: 512
  , shadow_volume_scale: 10
  , rotation: null
  , distance: null
  , rendering: false
  }

, initialize: function () {
    var self = this

    this.editor = new RemoteEditor({
      src_vertex: src_step_vertex,
      src_fragment_template: src_step_template
    })

    // Event Listeners

    this.editor
      .on("change:define_sim_res", function (editor, res) {
        if(!isNaN(res) && res > 0)
          self.set("fbo_res", +res)
      })
      .on("compiled", function (editor, compiled) {
        console.log(compiled)
      })

    this
      .on("change:context change:fbo_res", function () {
        self.initGL()
      })
  },

  initGL: function () {
    var self = this
      , gl = Embr.wrapContextWithErrorChecks(this.get("context"))

    Embr.setContext(gl)

    if(gl.getExtension && !(this.ext_oes_float = gl.getExtension("OES_texture_float")))
      throw "Float textures not supported :("
      // TODO: Implement some better UI to notify this happened.


    // Create shader programs

    this.prog_copy  = new Embr.Program(src_copy_vertex, src_copy_fragment).link()
    this.prog_final = new Embr.Program(src_final_vertex, src_final_fragment).link()
    this.prog_depth = new Embr.Program(src_depth_vertex, src_depth_fragment).link()


    var res = this.get("fbo_res")
    var res_shadow = this.get("fbo_res_shadow")


    // Generate texture data

    var n = res * res
      , index_data    = new Float32Array(n)
      , texcoord_data = new Float32Array(n * 2)
      , position_data = new Float32Array(n * 4)
      , i, i2, i4

    for(i = 0; i < texcoord_data.length; ++i) {
      i2 = i * 2
      i4 = i * 4
      index_data[i] = i
      texcoord_data[i2    ] = (i % res + 0.5) / res
      texcoord_data[i2 + 1] = (Math.floor(i / res) + 0.5) / res
      position_data[i4    ] = texcoord_data[i2    ] - 0.5
      position_data[i4 + 1] = texcoord_data[i2 + 1] - 0.5
      position_data[i4 + 3] = 1
    }


    // Create step framebuffers

    var fbo_fmt = {
      width: res
    , height: res
    , format: gl.RGBA
    , format_internal: gl.RGBA32F
    , type: gl.FLOAT
    }
    var fbo_fmt_position = _.extend(fbo_fmt, { data: position_data })

    if(this.fbo_read)  this.fbo_read.cleanup()
    if(this.fbo_write) this.fbo_write.cleanup()

    this.fbo_read = new Embr.Fbo()
      .attach(new Embr.Texture(fbo_fmt_position))
      .check()
    this.fbo_write = new Embr.Fbo()
      .attach(new Embr.Texture(fbo_fmt_position))
      .check()

    if(this.fbo_prev_read)  this.fbo_prev_read.cleanup()
    if(this.fbo_prev_write) this.fbo_prev_write.cleanup()

    this.fbo_prev_read = new Embr.Fbo()
      .attach(new Embr.Texture(fbo_fmt_position))
      .check()
    this.fbo_prev_write = new Embr.Fbo()
      .attach(new Embr.Texture(fbo_fmt_position))
      .check()


    // Create shadow framebuffer

    this.fbo_shadow_depth = new Embr.Fbo()
      .attach(new Embr.Texture({
        width: res_shadow, height: res_shadow,
        type: gl.FLOAT,
        data: null
      }))
      .attach(new Embr.Rbo({ width: res_shadow, height: res_shadow }))
      .check()


    // Create index texture

    if(this.tex_index) this.tex_index.cleanup()

    this.tex_index = new Embr.Texture(_.extend(fbo_fmt, {
      format: gl.LUMINANCE,
      format_internal: gl.LUMINANCE,
      data: index_data
    }))


    // Create vertexbuffers

    if(this.vbo_particles) this.vbo_particles.cleanup()
    if(this.vbo_plane)     this.vbo_plane.cleanup()

    this.vbo_particles = new Embr.Vbo(gl.POINTS)
      .setAttr("a_texcoord", { size: 2, data: texcoord_data })
      .setAttr("a_index", { size: 1, data: index_data })
      .setProg(this.prog_final)

    this.vbo_plane = new Embr.Vbo(gl.TRIANGLE_STRIP)
      .setAttr("a_position", {
        data: [ -1, -1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0 ], size: 3
      })
      .setAttr("a_texcoord", {
        data: [ 0, 0, 0, 1, 1, 0, 1, 1 ], size: 2
      })


    // Create audio textures

    // var eq_tex_fmt = {
    //   width: this.audio.get("num_bands")
    // , height: 1
    // , format: gl.LUMINANCE
    // , format_internal: gl.LUMINANCE
    // , data: null
    // }

    // if(this.tex_eq_left)  this.tex_eq_left.cleanup()
    // if(this.tex_eq_right) this.tex_eq_right.cleanup()

    // this.tex_eq_left = new Embr.Texture(eq_tex_fmt)
    // this.tex_eq_right = new Embr.Texture(eq_tex_fmt)


    // Events

    this.editor.on("compile", function (program) {
      self.vbo_plane.setProg(program)
    })

    // this.audio
    //   .on("change:eq_left", function (audio, eq_left) {
    //     self.tex_eq_left.set({ data: eq_left })
    //   })
    //   .on("change:eq_right", function (audio, eq_right) {
    //     self.tex_eq_right.set({ data: eq_right })
    //   })
  }

, swap: function () {
    var tmp = this.fbo_read
    this.fbo_read = this.fbo_write
    this.fbo_write = tmp
    tmp = this.fbo_prev_read
    this.fbo_prev_read = this.fbo_prev_write
    this.fbo_prev_write = tmp
  }

, start: function () {
    this.set("rendering", true)
  }

})
