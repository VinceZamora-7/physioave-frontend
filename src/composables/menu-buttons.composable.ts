import type {UUID} from "@/utils/global.type.ts";

export const useMenuButtons = () => {
  const menus: Map<UUID, any> = new Map()

  const add = (id: UUID, menuElement: any): void => {
    if (!menuElement) return
    menus.set(id, menuElement)
  }

  const toggle = (id: UUID, event: Event): void => {
    const menu: any = menus.get(id)
    if (!menu) return
    menu.toggle(event)
  }

  return {menus, add, toggle}
}
