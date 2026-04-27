import {definePreset} from "@primeuix/themes"
import base from "@primeuix/themes/aura/base"
import button from "@primeuix/themes/aura/button"
import checkbox from "@primeuix/themes/aura/checkbox"
import confirmdialog from "@primeuix/themes/aura/confirmdialog"
import datatable from "@primeuix/themes/aura/datatable"
import datepicker from "@primeuix/themes/aura/datepicker"
import dialog from "@primeuix/themes/aura/dialog"
import drawer from "@primeuix/themes/aura/drawer"
import fileupload from "@primeuix/themes/aura/fileupload"
import iconfield from "@primeuix/themes/aura/iconfield"
import iftalabel from "@primeuix/themes/aura/iftalabel"
import image from "@primeuix/themes/aura/image"
import inputnumber from "@primeuix/themes/aura/inputnumber"
import inputtext from "@primeuix/themes/aura/inputtext"
import menu from "@primeuix/themes/aura/menu"
import message from "@primeuix/themes/aura/message"
import multiselect from "@primeuix/themes/aura/multiselect"
import paginator from "@primeuix/themes/aura/paginator"
import progressbar from "@primeuix/themes/aura/progressbar"
import ripple from "@primeuix/themes/aura/ripple"
import select from "@primeuix/themes/aura/select"
import selectbutton from "@primeuix/themes/aura/selectbutton"
import skeleton from "@primeuix/themes/aura/skeleton"
import tag from "@primeuix/themes/aura/tag"
import textarea from "@primeuix/themes/aura/textarea"
import tieredmenu from "@primeuix/themes/aura/tieredmenu"
import toast from "@primeuix/themes/aura/toast"
import tooltip from "@primeuix/themes/aura/tooltip"
import virtualscroller from "@primeuix/themes/aura/virtualscroller"

const compactAuraPreset = {
  ...base,
  components: {
    button,
    checkbox,
    confirmdialog,
    datatable,
    datepicker,
    dialog,
    drawer,
    fileupload,
    iconfield,
    iftalabel,
    image,
    inputnumber,
    inputtext,
    menu,
    message,
    multiselect,
    paginator,
    progressbar,
    ripple,
    select,
    selectbutton,
    skeleton,
    tag,
    textarea,
    tieredmenu,
    toast,
    tooltip,
    virtualscroller
  }
}

export const primeVuePreset = definePreset(compactAuraPreset, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          color: "#1A4568",
          inverseColor: "#ffffff",
          hoverColor: "#3e92cc",
          activeColor: "#0F2236"
        }
      }
    }
  }
})
